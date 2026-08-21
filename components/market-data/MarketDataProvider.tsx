"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MarketDataProvider as IMarketDataProvider } from "@/lib/market-data/provider";
import { BinanceProvider } from "@/lib/market-data/binance-provider";
import type { ConnectionState, Tick } from "@/lib/market-data/types";
import { TickBuffer } from "@/lib/market-data/tick-buffer";

interface MarketDataContextValue {
  connectionState: ConnectionState;
  latestTick: (symbol: string) => Tick | undefined;
  window: (symbol: string) => Tick[];
}

const MarketDataContext = createContext<MarketDataContextValue | null>(null);

interface MarketDataProviderProps {
  symbols: string[];
  provider?: IMarketDataProvider;
  children: ReactNode;
}

export function MarketDataProvider({
  symbols,
  provider,
  children,
}: MarketDataProviderProps) {
  const providerRef = useRef<IMarketDataProvider | null>(null);
  if (providerRef.current === null) {
    providerRef.current = provider ?? new BinanceProvider();
  }

  const buffersRef = useRef(new Map<string, TickBuffer>());
  const [latest, setLatest] = useState<Map<string, Tick>>(new Map());
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");

  useEffect(() => {
    const marketData = providerRef.current;
    if (!marketData) return;

    marketData.connect(symbols);
    setConnectionState(marketData.connectionState);

    const unsubscribe: Array<() => void> = [];
    for (const symbol of symbols) {
      const buffer = buffersRef.current.get(symbol) ?? new TickBuffer();
      buffersRef.current.set(symbol, buffer);
      marketData.subscribe(symbol, (tick) => {
        buffer.push(tick);
        setLatest((prev) => {
          const next = new Map(prev);
          next.set(symbol, tick);
          return next;
        });
      });
    }

    const poll = window.setInterval(() => {
      setConnectionState(marketData.connectionState);
    }, 500);

    return () => {
      window.clearInterval(poll);
      unsubscribe.forEach((fn) => fn());
      marketData.disconnect();
    };
    // symbols is a stable prop per board; reconnect intentionally not re-run on change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<MarketDataContextValue>(
    () => ({
      connectionState,
      latestTick: (symbol) => latest.get(symbol),
      window: (symbol) => buffersRef.current.get(symbol)?.getWindow() ?? [],
    }),
    [connectionState, latest],
  );

  return (
    <MarketDataContext.Provider value={value}>
      {children}
    </MarketDataContext.Provider>
  );
}

export function useMarketData(): MarketDataContextValue {
  const value = useContext(MarketDataContext);
  if (value === null) {
    throw new Error("useMarketData must be used within a MarketDataProvider");
  }
  return value;
}