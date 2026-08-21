import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MarketDataProvider } from "../market-data/MarketDataProvider";
import type { MarketDataProvider as IMarketDataProvider } from "@/lib/market-data/provider";
import type { Tick } from "@/lib/market-data/types";
import Widget from "./Widget";

/* ── fake price data ──────────────────────────────────────── */

const SEED_PRICES: Record<string, number> = {
  BTCUSDT: 104_320,
  ETHUSDT: 3_842,
  SOLUSDT: 187,
  BNBUSDT: 698,
  ADAUSDT: 0.82,
  DOGEUSDT: 0.23,
  XRPUSDT: 2.91,
  LINKUSDT: 18.45,
};

/** Generate a realistic-looking series of price ticks for sparkline. */
function generateHistory(
  symbol: string,
  count = 60,
): Tick[] {
  const base = SEED_PRICES[symbol] ?? 100;
  const now = Date.now();
  const ticks: Tick[] = [];
  let price = base * 0.97; // start slightly below

  for (let i = 0; i < count; i++) {
    const drift = (Math.random() - 0.48) * base * 0.003;
    price = Math.max(base * 0.9, Math.min(base * 1.1, price + drift));
    const changePct = i === 0 ? 0 : (price - ticks[i - 1].price) / ticks[i - 1].price;
    ticks.push({
      symbol,
      price: +price.toFixed(2),
      changePct: +changePct.toFixed(6),
      timestamp: now - (count - i) * 1_000,
    });
  }
  return ticks;
}

/** A fake MarketDataProvider that immediately emits ticks and keeps them ticking. */
class FakeProvider implements IMarketDataProvider {
  connectionState: "connected" | "reconnecting" | "disconnected" = "disconnected";

  private intervals: ReturnType<typeof setInterval>[] = [];
  private listeners = new Map<string, (tick: Tick) => void>();
  private histories = new Map<string, Tick[]>();

  connect(symbols: string[]): void {
    this.connectionState = "connected";
    for (const symbol of symbols) {
      const history = generateHistory(symbol);
      this.histories.set(symbol, history);

      // Emit a new tick every 1.5 s
      const id = setInterval(() => {
        const prev = history[history.length - 1];
        const drift = (Math.random() - 0.48) * (SEED_PRICES[symbol] ?? 100) * 0.003;
        const price = +(
          Math.max(
            (SEED_PRICES[symbol] ?? 100) * 0.9,
            Math.min((SEED_PRICES[symbol] ?? 100) * 1.1, prev.price + drift),
          )
        ).toFixed(2);
        const tick: Tick = {
          symbol,
          price,
          changePct: +((price - prev.price) / prev.price).toFixed(6),
          timestamp: Date.now(),
        };
        history.push(tick);
        if (history.length > 120) history.shift();
        this.listeners.get(symbol)?.(tick);
      }, 1_500);
      this.intervals.push(id);
    }
  }

  subscribe(symbol: string, cb: (tick: Tick) => void): () => void {
    this.listeners.set(symbol, cb);
    // Immediately fire with the latest tick so the UI isn't blank
    const history = this.histories.get(symbol);
    if (history && history.length > 0) {
      cb(history[history.length - 1]);
    }
    return () => {
      this.listeners.delete(symbol);
    };
  }

  getWindow(symbol: string): Tick[] {
    return this.histories.get(symbol) ?? [];
  }

  disconnect(): void {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    this.connectionState = "disconnected";
  }
}

/* ── story helper ─────────────────────────────────────────── */

function WidgetFixture({ symbol, id, position }: { symbol: string; id: string; position: number }) {
  const [provider] = useState(() => new FakeProvider());
  return (
    <MarketDataProvider symbols={[symbol]} provider={provider}>
      <Widget id={id} symbol={symbol} position={position} />
    </MarketDataProvider>
  );
}

const meta: Meta<typeof Widget> = {
  title: "Widget/Widget",
  component: Widget,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Widget>;

export const Bitcoin: Story = {
  render: () => <WidgetFixture id="w1" symbol="BTCUSDT" position={0} />,
};

export const Ethereum: Story = {
  render: () => <WidgetFixture id="w2" symbol="ETHUSDT" position={1} />,
};

export const Solana: Story = {
  render: () => <WidgetFixture id="w3" symbol="SOLUSDT" position={2} />,
};