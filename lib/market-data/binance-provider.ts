import type { ConnectionState, Tick } from "./types";
import type { MarketDataProvider } from "./provider";
import { TickBuffer } from "./tick-buffer";

const STREAM_URL = "wss://stream.binance.com:9443/stream";
const TICKER_URL = "https://api.binance.com/api/v3/ticker/24hr";
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;
const JITTER_MS = 250;

export function backoffDelay(attempt: number): number {
  const exponential = BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * JITTER_MS);
  return Math.min(exponential, MAX_DELAY_MS) + jitter;
}

interface CombinedMessage {
  stream: string;
  data: {
    s: string;
    c: string;
    o: string;
    P: string;
  };
}

interface Ticker24hr {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
}

export class BinanceProvider implements MarketDataProvider {
  private ws: WebSocket | null = null;
  private symbols: string[] = [];
  private state: ConnectionState = "disconnected";
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private subscribers = new Map<string, Array<(tick: Tick) => void>>();
  private buffers = new Map<string, TickBuffer>();

  get connectionState(): ConnectionState {
    return this.state;
  }

  connect(symbols: string[]): void {
    this.symbols = symbols;
    for (const symbol of symbols) {
      if (!this.subscribers.has(symbol)) {
        this.subscribers.set(symbol, []);
      }
      if (!this.buffers.has(symbol)) {
        this.buffers.set(symbol, new TickBuffer());
      }
    }
    this.seedSnapshot();
    this.open();
  }

  subscribe(symbol: string, cb: (tick: Tick) => void): void {
    const list = this.subscribers.get(symbol) ?? [];
    list.push(cb);
    this.subscribers.set(symbol, list);
  }

  disconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempt = 0;
    this.state = "disconnected";
    this.ws?.close();
    this.ws = null;
  }

  getWindow(symbol: string): Tick[] {
    return this.buffers.get(symbol)?.getWindow() ?? [];
  }

  private seedSnapshot(): void {
    const url = `${TICKER_URL}?symbols=${encodeURIComponent(
      JSON.stringify(this.symbols),
    )}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((rows: Ticker24hr[]) => {
        for (const row of rows) {
          const price = Number.parseFloat(row.lastPrice);
          const changePct = Number.parseFloat(row.priceChangePercent);
          if (Number.isNaN(price)) continue;
          const tick: Tick = {
            symbol: row.symbol.toUpperCase(),
            price,
            changePct: Number.isNaN(changePct) ? 0 : changePct,
            timestamp: Date.now(),
          };
          this.buffers.get(tick.symbol)?.push(tick);
          for (const cb of this.subscribers.get(tick.symbol) ?? []) {
            cb(tick);
          }
        }
      })
      .catch(() => {
        // snapshot is best-effort; the websocket remains the source of truth
      });
  }

  private open(): void {
    const url = `${STREAM_URL}?streams=${this.symbols
      .map((symbol) => `${symbol.toLowerCase()}@miniTicker`)
      .join("/")}`;
    const ws = new WebSocket(url);
    this.ws = ws;
    this.state = "reconnecting";

    ws.onopen = () => {
      if (this.ws !== ws) return;
      this.reconnectAttempt = 0;
      this.state = "connected";
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      if (this.ws !== ws) return;
      try {
        const message = JSON.parse(event.data) as CombinedMessage;
        this.handleTick(message);
      } catch {
        // ignore malformed frames; keep the last known value
      }
    };

    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      if (this.state === "disconnected") return;
      this.scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  private scheduleReconnect(): void {
    this.state = "reconnecting";
    this.reconnectAttempt += 1;
    const delay = backoffDelay(this.reconnectAttempt);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.state === "disconnected") return;
      this.open();
    }, delay);
  }

  private handleTick(message: CombinedMessage): void {
    const symbol = message.data.s.toUpperCase();
    const price = Number.parseFloat(message.data.c);
    const openPrice = Number.parseFloat(message.data.o);

    // percentage change
    const changePct = Number.isFinite(Number.parseFloat(message.data.P)) ? Number.parseFloat(message.data.P) : (price - openPrice) / openPrice;
    if (Number.isNaN(price)) return;

    const tick: Tick = {
      symbol,
      price,
      changePct: Number.isNaN(changePct) ? 0 : changePct,
      timestamp: Date.now(),
    };

    this.buffers.get(symbol)?.push(tick);
    for (const cb of this.subscribers.get(symbol) ?? []) {
      cb(tick);
    }
  }
}