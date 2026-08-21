import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, explainLimiter } from "./route";
import { getServerSession } from "@/lib/auth/session";
import { getOrGenerate } from "@/lib/ai-insight/cache";
import {
  fetchRecentTicks,
} from "@/lib/ai-insight/client";
import type { AiExplainResult } from "@/lib/ai-insight/types";

vi.mock("@/lib/auth/session", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/ai-insight/cache", () => ({
  getOrGenerate: vi.fn(),
}));

vi.mock("@/lib/ai-insight/client", () => ({
  explainPriceAction: vi.fn(),
  fetchRecentTicks: vi.fn(),
  nextUtcMidnight: () => "2026-08-19T00:00:00.000Z",
}));

const session = {
  session: { id: "sess_1" },
  user: { id: "user_1", email: "a@example.com" },
} as Awaited<ReturnType<typeof getServerSession>>;

function explainRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/ai/explain", {
    method: "POST",
    headers: {
      cookie: "better-auth.session_token=token",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/explain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    explainLimiter.reset();
    vi.mocked(fetchRecentTicks).mockResolvedValue([]);
    vi.mocked(getOrGenerate).mockResolvedValue({
      available: true,
      summary: "default",
      model: "openrouter/free",
    });
  });

  it("returns 401 when there is no session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await POST(explainRequest({ symbol: "BTCUSDT" }));

    expect(res.status).toBe(401);
    expect(getOrGenerate).not.toHaveBeenCalled();
  });

  it("returns 422 for a missing or malformed symbol", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);

    const res = await POST(explainRequest({}));

    expect(res.status).toBe(422);
    expect(getOrGenerate).not.toHaveBeenCalled();
  });

  it("returns a typed unavailable response (429, not 5xx) once the per-user budget is exhausted", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);

    let last = new Response();
    for (let i = 0; i < explainLimiter.capacity; i++) {
      last = await POST(explainRequest({ symbol: "BTCUSDT" }));
    }
    expect(last.status).toBe(200);

    const blocked = await POST(explainRequest({ symbol: "BTCUSDT" }));
    expect(blocked.status).toBe(429);
    const body = (await blocked.json()) as AiExplainResult;
    expect(body).toMatchObject({ available: false });
    expect(body.available).toBe(false);
    if (body.available) return;
    expect(body.resetsAt).toMatch(/T00:00:00\.000Z$/);
    expect(blocked.status).toBeLessThan(500);
  });

  it("returns a summary on the happy path", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    vi.mocked(fetchRecentTicks).mockResolvedValue([
      { symbol: "BTCUSDT", price: 60000, changePct: 1, timestamp: 1 },
    ]);
    vi.mocked(getOrGenerate).mockResolvedValue({
      available: true,
      summary: "BTC is trending up.",
      model: "openrouter/free",
    });

    const res = await POST(explainRequest({ symbol: "BTCUSDT" }));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { available: true; summary: string };
    expect(body.available).toBe(true);
    expect(body.summary).toBe("BTC is trending up.");
    expect(getOrGenerate).toHaveBeenCalledWith(
      "BTCUSDT",
      expect.any(Array),
      expect.any(Function),
      "en",
    );
  });

  it("forwards the requested locale to the generator", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);

    await POST(explainRequest({ symbol: "BTCUSDT", locale: "ar" }));

    expect(getOrGenerate).toHaveBeenCalledWith(
      "BTCUSDT",
      expect.any(Array),
      expect.any(Function),
      "ar",
    );
  });

  it("passes a cap-exhausted result through as a typed unavailable response", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    vi.mocked(fetchRecentTicks).mockResolvedValue([]);
    vi.mocked(getOrGenerate).mockResolvedValue({
      available: false,
      resetsAt: "2026-08-19T00:00:00.000Z",
      reason: "budget_exhausted",
    });

    const res = await POST(explainRequest({ symbol: "BTCUSDT" }));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { available: false; resetsAt: string; reason: string };
    expect(body).toEqual({
      available: false,
      resetsAt: "2026-08-19T00:00:00.000Z",
      reason: "budget_exhausted",
    });
  });

  it("degrades to unavailable instead of 5xx when the tick window cannot be fetched", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    vi.mocked(fetchRecentTicks).mockRejectedValue(new Error("upstream down"));

    const res = await POST(explainRequest({ symbol: "BTCUSDT" }));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { available: false };
    expect(body.available).toBe(false);
    expect(getOrGenerate).not.toHaveBeenCalled();
  });
});