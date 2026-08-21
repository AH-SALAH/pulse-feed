import type { ConnectionState, Tick } from "./types";

export interface MarketDataProvider {
  connect(symbols: string[]): void;
  subscribe(symbol: string, cb: (tick: Tick) => void): void;
  disconnect(): void;
  connectionState: ConnectionState;
}