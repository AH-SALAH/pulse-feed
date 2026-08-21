import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { explainPriceAction, fetchRecentTicks, nextUtcMidnight } from "./client";
import type { Tick } from "@/lib/market-data/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const BINANCE_URL = "https://api.binance.com/api/v3/klines";

function window(n = 200): Tick[] {
  return Array.from({ length: n }, (_, i) => ({
    symbol: "BTCUSDT",
    price: 60_000 + i,
    changePct: 0.1,
    timestamp: 1_000_000 + i,
  }));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("explainPriceAction", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "sk-test-123";
    process.env.OPENROUTER_MODEL = "openrouter/free";
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_MODEL;
  });

  it("calls the OpenAI-compatible schema against the OpenRouter v1 endpoint", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: "BTC is trending up." } }],
      }),
    );

    const result = await explainPriceAction("BTCUSDT", window(), "en");
    expect(result.available).toBe(true);
    if (!result.available) return;
    expect(result.summary).toBe("BTC is trending up.");

    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe(OPENROUTER_URL);
    const body = JSON.parse(init?.body as string);
    expect(body.model).toBe("openrouter/free");
    expect(Array.isArray(body.messages)).toBe(true);
    expect(body.messages[0].role).toBe("user");
    expect(typeof body.messages[0].content).toBe("string");
    expect(body.messages[0].content).toContain("BTCUSDT");
  });

  it("reads the model id from process.env.OPENROUTER_MODEL", async () => {
    process.env.OPENROUTER_MODEL = "openrouter/auto";
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: "Flat market." } }],
      }),
    );

    const result = await explainPriceAction("BTCUSDT", window(), "en");
    expect(result.available).toBe(true);

    const body = JSON.parse(
      vi.mocked(fetch).mock.calls[0]![1]!.body as string,
    );
    expect(body.model).toBe("openrouter/auto");
  });

  it("instructs the model to reply in Arabic when locale is ar", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: "السوق صاعد." } }] }),
    );

    await explainPriceAction("BTCUSDT", window(), "ar");

    const body = JSON.parse(
      vi.mocked(fetch).mock.calls[0]![1]!.body as string,
    );
    expect(body.messages[0].content).toContain("باللغة العربية");
  });

  it("authenticates with the OpenRouter API key as a bearer token", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: "Up." } }] }),
    );

    await explainPriceAction("BTCUSDT", window(), "en");

    const init = vi.mocked(fetch).mock.calls[0]![1]!;
    expect(init.headers).toMatchObject({
      Authorization: "Bearer sk-test-123",
      "Content-Type": "application/json",
    });
  });

  it("maps a non-200 / rate-limit response to a typed unavailable result instead of throwing", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Rate limit" } }), {
        status: 429,
      }),
    );

    const result = await explainPriceAction("BTCUSDT", window(), "en");

    expect(result.available).toBe(false);
    if (result.available) return;
    expect(result.resetsAt).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/);
  });

  it("returns unavailable when no API key is configured", async () => {
    delete process.env.OPENROUTER_API_KEY;

    const result = await explainPriceAction("BTCUSDT", window(), "en");

    expect(result.available).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("fetchRecentTicks", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("maps Binance klines rows into ticks with a window-relative change percentage", async () => {
    const rows = Array.from({ length: 3 }, (_, i) => [
      1_000_000_000 + i * 60_000,
      String(100 + i),
      String(101 + i),
      String(99 + i),
      String(100 + i),
      "1000",
      1_000_060_000 + i * 60_000,
      "0",
    ]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(rows)));

    const ticks = await fetchRecentTicks("BTCUSDT", 3);

    expect(fetch).toHaveBeenCalledWith(
      `${BINANCE_URL}?symbol=BTCUSDT&interval=1m&limit=3`,
    );
    expect(ticks).toHaveLength(3);
    expect(ticks[0].price).toBe(100);
    expect(ticks[2].price).toBe(102);
    expect(ticks[2].changePct).toBeCloseTo(2, 5);
  });

  it("throws a typed error when the klines endpoint is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("boom", { status: 500 })),
    );

    await expect(fetchRecentTicks("BTCUSDT")).rejects.toThrow(
      /500/,
    );
  });
});

describe("nextUtcMidnight", () => {
  it("returns the next UTC midnight from a given instant", () => {
    const now = new Date("2026-08-19T12:00:00Z");
    expect(nextUtcMidnight(now)).toBe("2026-08-20T00:00:00.000Z");
  });
});