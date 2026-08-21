export interface Tick {
  symbol: string;
  price: number;
  changePct: number;
  timestamp: number;
}

export type ConnectionState = "connected" | "reconnecting" | "disconnected";