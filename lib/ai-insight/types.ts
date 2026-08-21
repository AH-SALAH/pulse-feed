import type { Tick } from "@/lib/market-data/types";

export type AiExplainResult =
  | { available: true; summary: string; model: string }
  | { available: false; resetsAt: string, reason: string };

export type ExplainGenerator = (
  symbol: string,
  window: Tick[],
  locale: string,
) => Promise<AiExplainResult>;