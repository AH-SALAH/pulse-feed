import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BinanceProvider, backoffDelay } from "./binance-provider";
import type { Tick } from "./types";

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.onclose?.();
  }
}

describe("BinanceProvider", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("connects to the multiplexed-stream URL for the given symbol list", () => {
    const provider = new BinanceProvider();
    provider.connect(["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"]);
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe(
      "wss://stream.binance.com:9443/stream?streams=btcusdt@miniTicker/ethusdt@miniTicker/solusdt@miniTicker/bnbusdt@miniTicker",
    );
  });

  it("transitions to connected on open and dispatches parsed ticks to subscribers", () => {
    const provider = new BinanceProvider();
    provider.connect(["BTCUSDT"]);
    expect(provider.connectionState).toBe("reconnecting");

    const ws = MockWebSocket.instances[0];
    ws.onopen?.();
    expect(provider.connectionState).toBe("connected");

    const cb = vi.fn();
    provider.subscribe("BTCUSDT", cb);
    ws.onmessage?.({ data: JSON.stringify({ stream: "btcusdt@miniTicker", data: { s: "BTCUSDT", c: "64000.5", P: "1.23" } }) });

    const tick: Tick = cb.mock.calls[0][0] as Tick;
    expect(tick.symbol).toBe("BTCUSDT");
    expect(tick.price).toBe(64000.5);
    expect(tick.changePct).toBe(1.23);
    expect(provider.getWindow("BTCUSDT")).toHaveLength(1);
  });

  it("enters reconnecting with exponential backoff after a disconnect and reconnects", () => {
    const provider = new BinanceProvider();
    provider.connect(["BTCUSDT"]);
    const first = MockWebSocket.instances[0];
    first.onopen?.();
    expect(provider.connectionState).toBe("connected");

    first.onclose?.();
    expect(provider.connectionState).toBe("reconnecting");

    vi.advanceTimersByTime(backoffDelay(1));
    expect(MockWebSocket.instances).toHaveLength(2);

    const second = MockWebSocket.instances[1];
    expect(second.url).toContain("streams=btcusdt@miniTicker");
    second.onopen?.();
    expect(provider.connectionState).toBe("connected");
  });

  it("scales backoff exponentially, capped around 30s", () => {
    const delays = [1, 2, 3, 4, 5, 6, 7].map((attempt) => backoffDelay(attempt));
    expect(delays).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000]);
  });

  it("disconnect stops reconnect attempts and reports disconnected", () => {
    const provider = new BinanceProvider();
    provider.connect(["BTCUSDT"]);
    provider.disconnect();
    expect(provider.connectionState).toBe("disconnected");
    const countAfterIdle = MockWebSocket.instances.length;
    vi.advanceTimersByTime(60_000);
    expect(MockWebSocket.instances.length).toBe(countAfterIdle);
  });

  it("seeds an immediate price snapshot from the REST ticker on connect", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { symbol: "BTCUSDT", lastPrice: "64000.5", priceChangePercent: "1.23" },
        { symbol: "ETHUSDT", lastPrice: "2100.1", priceChangePercent: "-0.4" },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new BinanceProvider();
    const cb = vi.fn();
    provider.subscribe("BTCUSDT", cb);
    provider.connect(["BTCUSDT", "ETHUSDT"]);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("ticker/24hr"),
    );

    await vi.advanceTimersByTimeAsync(0);
    await vi.waitFor(() => {
      expect(cb).toHaveBeenCalledTimes(1);
    });

    const tick: Tick = cb.mock.calls[0][0] as Tick;
    expect(tick.symbol).toBe("BTCUSDT");
    expect(tick.price).toBe(64000.5);
    expect(tick.changePct).toBe(1.23);
    expect(provider.getWindow("BTCUSDT")).toHaveLength(1);
  });

  it("tolerates a failed REST snapshot and keeps the websocket as the only source", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const provider = new BinanceProvider();
    const cb = vi.fn();
    provider.subscribe("BTCUSDT", cb);
    provider.connect(["BTCUSDT"]);
    await vi.advanceTimersByTimeAsync(0);

    expect(cb).not.toHaveBeenCalled();

    const ws = MockWebSocket.instances[0];
    ws.onmessage?.({
      data: JSON.stringify({
        stream: "btcusdt@miniTicker",
        data: { s: "BTCUSDT", c: "64000.5", P: "1.23" },
      }),
    });
    expect(cb).toHaveBeenCalledTimes(1);
  });
});