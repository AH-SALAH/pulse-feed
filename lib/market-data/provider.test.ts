import { describe, it, expect, vi } from "vitest";
import type { MarketDataProvider } from "./provider";
import type { Tick } from "./types";

class FakeProvider implements MarketDataProvider {
  connectionState: "connected" | "reconnecting" | "disconnected" = "connected";
  private listeners = new Map<string, Array<(tick: Tick) => void>>();

  connect(symbols: string[]): void {
    for (const symbol of symbols) {
      this.listeners.set(symbol, []);
    }
  }

  subscribe(symbol: string, cb: (tick: Tick) => void): void {
    const list = this.listeners.get(symbol) ?? [];
    list.push(cb);
    this.listeners.set(symbol, list);
  }

  disconnect(): void {
    this.connectionState = "disconnected";
    this.listeners.clear();
  }

  emit(symbol: string, tick: Tick): void {
    for (const cb of this.listeners.get(symbol) ?? []) {
      cb(tick);
    }
  }
}

describe("MarketDataProvider contract", () => {
  it("subscribe fires the callback with mock ticks for the subscribed symbol", () => {
    const provider = new FakeProvider();
    provider.connect(["BTCUSDT", "ETHUSDT"]);

    const cb = vi.fn();
    provider.subscribe("BTCUSDT", cb);

    const tick: Tick = { symbol: "BTCUSDT", price: 64000.5, changePct: 1.2, timestamp: 1000 };
    provider.emit("BTCUSDT", tick);

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(tick);
  });

  it("exposes connectionState and transitions on disconnect", () => {
    const provider = new FakeProvider();
    provider.connect(["BTCUSDT"]);
    expect(provider.connectionState).toBe("connected");
    provider.disconnect();
    expect(provider.connectionState).toBe("disconnected");
  });
});