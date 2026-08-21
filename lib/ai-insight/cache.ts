import { prisma } from "@/lib/prisma";
import type { Tick } from "@/lib/market-data/types";
import type { AiExplainResult, ExplainGenerator } from "./types";

export const AI_WINDOW_MS = 5 * 60 * 1000;

export function windowBucket(now: Date): { start: Date; end: Date } {
  const startMs = Math.floor(now.getTime() / AI_WINDOW_MS) * AI_WINDOW_MS;
  return { start: new Date(startMs), end: new Date(startMs + AI_WINDOW_MS) };
}

export async function getOrGenerate(
  symbol: string,
  window: Tick[],
  generator: ExplainGenerator,
  locale: string = "en",
  now: () => Date = () => new Date(),
): Promise<AiExplainResult> {
  const { start, end } = windowBucket(now());

  const cached = await prisma.aiExplanation.findUnique({
    where: {
      symbol_windowStart_locale: { symbol, windowStart: start, locale },
    },
  });
  if (cached) {
    return { available: true, summary: cached.summary, model: cached.model };
  }

  const generated = await generator(symbol, window, locale);
  if (!generated.available) {
    return generated;
  }

  await prisma.aiExplanation.create({
    data: {
      symbol,
      locale,
      windowStart: start,
      windowEnd: end,
      summary: generated.summary,
      model: generated.model,
    },
  });
  return generated;
}