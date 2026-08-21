import { getServerSession } from "@/lib/auth/session";
import { getOrGenerate } from "@/lib/ai-insight/cache";
import {
  explainPriceAction,
  fetchRecentTicks,
  nextUtcMidnight,
} from "@/lib/ai-insight/client";
import { TokenBucket } from "@/lib/rate-limit/token-bucket";
import { isLocale, defaultLocale } from "@/lib/i18n/settings";
import type { Tick } from "@/lib/market-data/types";

// Per-user budget guard: protects the shared OpenRouter free tier from a single
// account exhausting it (the AiExplanation cache already de-duplicates identical
// (symbol, window) calls across users). Single-instance limitation only — upgrade
// path is an external store (Upstash Redis), matching the demo route's limiter.
const RATE_LIMIT_CAPACITY = 30;
const RATE_LIMIT_REFILL = 30;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export const explainLimiter = new TokenBucket(
  RATE_LIMIT_CAPACITY,
  RATE_LIMIT_REFILL,
  RATE_LIMIT_WINDOW_MS,
);

export async function POST(request: Request): Promise<Response> {
  const session = await getServerSession(request);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!explainLimiter.allow(session.user.id)) {
    return Response.json(
      { available: false, resetsAt: nextUtcMidnight(), reason: "rate_limited" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 422 });
  }
  const symbol = (body as { symbol?: unknown } | null)?.symbol;
  if (typeof symbol !== "string" || symbol.trim() === "") {
    return Response.json({ error: "symbol is required" }, { status: 422 });
  }
  const rawLocale = (body as { locale?: unknown } | null)?.locale;
  const locale = isLocale(String(rawLocale ?? ""))
    ? String(rawLocale)
    : defaultLocale;

  let window: Tick[];
  try {
    window = await fetchRecentTicks(symbol.trim());
  } catch {
    return Response.json(
      { available: false, resetsAt: nextUtcMidnight(), reason: "tick_fetch_failed" },
      { status: 200 },
    );
  }

  const result = await getOrGenerate(
    symbol.trim(),
    window,
    (sym, ticks, loc) => explainPriceAction(sym, ticks, loc),
    locale,
  );

  if (!result.available) {
    return Response.json({ available: false, resetsAt: result.resetsAt, reason: result.reason });
  }
  return Response.json({ available: true, summary: result.summary });
}