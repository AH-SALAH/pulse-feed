import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrGenerate, AI_WINDOW_MS, windowBucket } from "./cache";
import { prisma } from "@/lib/prisma";
import type { Tick } from "@/lib/market-data/types";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aiExplanation: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const symbol = "BTCUSDT";
const tick: Tick = {
  symbol,
  price: 60000,
  changePct: 0.5,
  timestamp: 1_000_000,
};

function cachedRow(
  start: Date,
  summary = "Rising over the window",
  model = "openrouter/free",
  locale = "en",
) {
  return {
    id: "ai_1",
    symbol,
    locale,
    windowStart: start,
    windowEnd: new Date(start.getTime() + AI_WINDOW_MS),
    summary,
    model,
    createdAt: new Date(),
  };
}

describe("getOrGenerate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("triggers only one underlying generate call for two requests in the same 5-minute window", async () => {
    const generator = vi.fn().mockResolvedValue({
      available: true as const,
      summary: "Rising over the window",
      model: "openrouter/free",
    });
    const now = () => new Date("2026-08-19T12:02:00Z");
    const { start } = windowBucket(now());

    vi.mocked(prisma.aiExplanation.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(cachedRow(start));

    const first = await getOrGenerate(symbol, [tick], generator, "en", now);
    const second = await getOrGenerate(symbol, [tick], generator, "en", now);

    expect(generator).toHaveBeenCalledTimes(1);
    expect(first).toEqual({
      available: true,
      summary: "Rising over the window",
      model: "openrouter/free",
    });
    expect(second).toMatchObject({ summary: "Rising over the window" });
    expect(prisma.aiExplanation.create).toHaveBeenCalledTimes(1);
  });

  it("generates once per 5-minute window; a request in the next window triggers again", async () => {
    const generator = vi.fn().mockResolvedValue({
      available: true as const,
      summary: "Window summary",
      model: "openrouter/free",
    });
    const windowOne = () => new Date("2026-08-19T12:02:00Z");
    const windowTwo = () => new Date("2026-08-19T12:07:00Z");

    vi.mocked(prisma.aiExplanation.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await getOrGenerate(symbol, [tick], generator, "en", windowOne);
    await getOrGenerate(symbol, [tick], generator, "en", windowTwo);

    expect(generator).toHaveBeenCalledTimes(2);
  });

  it("passes an unavailable generate result through without caching it", async () => {
    const generator = vi.fn().mockResolvedValue({
      available: false as const,
      resetsAt: "2026-08-19T00:00:00.000Z",
    });

    vi.mocked(prisma.aiExplanation.findUnique).mockResolvedValue(null);

    const result = await getOrGenerate(symbol, [tick], generator);

    expect(result).toEqual({
      available: false,
      resetsAt: "2026-08-19T00:00:00.000Z",
    });
    expect(prisma.aiExplanation.create).not.toHaveBeenCalled();
  });

  it("queries the AiExplanation table with the composite (symbol, windowStart, locale) key", async () => {
    const generator = vi.fn().mockResolvedValue({
      available: true as const,
      summary: "s",
      model: "m",
    });
    const now = () => new Date("2026-08-19T12:02:00Z");
    const { start } = windowBucket(now());

    vi.mocked(prisma.aiExplanation.findUnique).mockResolvedValue(null);

    await getOrGenerate(symbol, [tick], generator, "ar", now);

    expect(prisma.aiExplanation.findUnique).toHaveBeenCalledWith({
      where: {
        symbol_windowStart_locale: { symbol, windowStart: start, locale: "ar" },
      },
    });
    expect(prisma.aiExplanation.create).toHaveBeenCalledWith({
      data: {
        symbol,
        locale: "ar",
        windowStart: start,
        windowEnd: new Date(start.getTime() + AI_WINDOW_MS),
        summary: "s",
        model: "m",
      },
    });
  });
});

describe("windowBucket", () => {
  it("snaps any instant inside a 5-minute bucket to that bucket's start", () => {
    const now = new Date("2026-08-19T12:02:59Z");
    const { start, end } = windowBucket(now);
    expect(start.toISOString()).toBe("2026-08-19T12:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-19T12:05:00.000Z");
  });
});