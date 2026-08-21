import type { Tick } from "@/lib/market-data/types";
import type { AiExplainResult } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines";
const DEFAULT_MODEL = "openrouter/free";
const WINDOW_LIMIT = 200;

export function nextUtcMidnight(now: Date = new Date()): string {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return next.toISOString();
}

export async function fetchRecentTicks(
  symbol: string,
  limit = WINDOW_LIMIT,
): Promise<Tick[]> {
  const url = `${BINANCE_KLINES_URL}?symbol=${encodeURIComponent(
    symbol,
  )}&interval=1m&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Binance klines failed with status ${res.status}`);
  }
  const rows = (await res.json()) as Array<
    [number, string, string, string, string, string, number, ...unknown[]]
  >;
  const open = Number.parseFloat(rows[0]?.[1] ?? "0");
  return rows.map((row) => {
    const price = Number.parseFloat(row[4]);
    const changePct = open > 0 ? ((price - open) / open) * 100 : 0;
    return {
      symbol,
      price,
      changePct,
      timestamp: row[6],
    };
  });
}

function buildPrompt(symbol: string, window: Tick[], locale: string): string {
  const last = window[window.length - 1];
  const first = window[0];
  const prices = window.slice(-20).map((t) => t.price.toFixed(2)).join(", ");
  const changePct = first
    ? ((last.price - first.price) / first.price) * 100
    : 0;
  const languageInstruction =
    locale === "ar"
      ? "اكتب الإجابة باللغة العربية الفصحى."
      : "Respond in English.";
  return [
    `You are a concise market analyst. Explain the recent price action of ${symbol} in plain language.`,
    `The sparkline shows the last ~${window.length} price ticks.`,
    `First price: ${first.price.toFixed(2)}, last price: ${last.price.toFixed(2)}, change over the window: ${changePct.toFixed(2)}%.`,
    `Recent prices: ${prices}.`,
    languageInstruction,
    "Write 2-3 sentences a non-technical reader understands. Do not use markdown.",
  ].join("\n");
}

export async function explainPriceAction(
  symbol: string,
  window: Tick[],
  locale: string,
): Promise<AiExplainResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { available: false, resetsAt: nextUtcMidnight(), reason: "no Api key" };
  }
  const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildPrompt(symbol, window, locale) }],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    return { available: false, resetsAt: nextUtcMidnight(), reason: "bad response" };
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const summary = data.choices?.[0]?.message?.content?.trim();
  if (!summary) {
    return { available: false, resetsAt: nextUtcMidnight(), reason: "no summary" };
  }

  return { available: true, summary, model };
}