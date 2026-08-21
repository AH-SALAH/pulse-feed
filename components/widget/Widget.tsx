"use client";

import { useTranslation } from "react-i18next";
import {
  LuArrowDown,
  LuArrowUp,
  LuGripVertical,
  LuLoaderCircle,
  LuMinus,
} from "react-icons/lu";
import { useMarketData } from "../market-data/MarketDataProvider";
import CoinIcon from "./CoinIcon";
import Sparkline from "./Sparkline";
import ExplainButton from "./ExplainButton";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useEffect, useState } from "react";

interface WidgetProps {
  id: string;
  symbol: string;
  position: number;
  editable?: boolean;
}

const priceFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: 'currency',
  currencyDisplay: 'symbol',
  currency: 'USD',
});

export default function Widget({ symbol, editable = false }: WidgetProps) {
  const { t } = useTranslation();
  const { latestTick, window, connectionState } = useMarketData();
  const reducedMotion = useReducedMotion();
  const [isExplainLoading, setIsExplainLoading] = useState(false);

  const tick = latestTick(symbol);
  const prices = window(symbol).map((t) => t.price);
  const reconnecting = connectionState !== "connected";

  const changePct = tick?.changePct ?? 0;
  const changePositive = changePct > 0;
  const changeNeutral = changePct === 0;

  const baseSymbol = symbol.replace("USDT", "");
  const coinName = t(`widget.names.${baseSymbol}`) ?? baseSymbol;

  // sunscribe to explaining loading eent to disable all widgets buttons
  useEffect(() => {
    const handleExplaining = (e: CustomEventInit) => {
      setIsExplainLoading(e.detail);
    };
    globalThis.window.removeEventListener("explaining", handleExplaining);
    globalThis.window.addEventListener("explaining", handleExplaining);
    return () => globalThis.window.removeEventListener("explaining", handleExplaining);
  }, []);
  

  return (
    <article
      data-testid="widget"
      className="group relative flex h-full flex-col gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container py-4 px-6 transition-colors hover:border-secondary/40"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-highest text-secondary"
          >
            <CoinIcon
              symbol={baseSymbol}
              className="size-4 text-on-surface"
            />
          </div>
          <div className="flex flex-col">
            <h2 className="font-telemetry text-telemetry-sm font-semibold leading-none text-on-surface">
              {baseSymbol}/USDT
            </h2>
            <span className="font-label text-label-caps mt-1 text-on-surface-variant">
              {coinName}
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-1 font-telemetry text-telemetry-sm tabular-nums ${
            changeNeutral
              ? "text-tertiary"
              : changePositive
                ? "text-positive"
                : "text-negative"
          }`}
        >
          {changeNeutral ? (
            <LuMinus aria-hidden="true" className="size-3.5" />
          ) : changePositive ? (
            <LuArrowUp aria-hidden="true" className="size-3.5" />
          ) : (
            <LuArrowDown aria-hidden="true" className="size-3.5" />
          )}
          <span>
            {tick
              ? `${changePositive ? "+" : ""}${changePct.toFixed(2)}%`
              : "--.--%"}
          </span>
        </div>
      </header>

      <div className="flex items-center gap-1.5">
        {reconnecting ? (
          <LuLoaderCircle
            aria-hidden="true"
            className="size-3 animate-spin text-outline"
          />
        ) : (
          <span
            aria-hidden="true"
            className={`size-2 rounded-full bg-secondary ${
              reducedMotion ? "" : "animate-pulse-cyan"
            }`}
          />
        )}
        <span
          className={`font-label text-label-caps ${
            reconnecting ? "text-on-surface-variant" : "text-secondary"
          }`}
        >
          {reconnecting ? t("widget.reconnecting") : t("widget.liveStream")}
        </span>
      </div>

      <p>
        <span
          data-testid="widget-price"
          className={`font-telemetry text-telemetry-lg font-semibold tabular-nums text-on-surface ${
            reducedMotion ? "" : "animate-price-pop"
          }`}
        >
          {tick ? priceFormat.format(tick.price) : "—"}
        </span>
      </p>

      <div dir="ltr">
        <Sparkline
          data={prices}
          isLive={!reconnecting}
          aria-label={t("widget.priceHistoryAria", { symbol })}
          className="h-16 w-full"
        />
      </div>

      {editable ? (
        <div className="absolute top-2 start-2 cursor-grab active:cursor-grabbing text-on-surface-variant/40 hover:text-on-surface-variant transition-colors" aria-label="Drag to reorder">
          <LuGripVertical aria-hidden="true" className="size-4" />
        </div>
      ) : null}

      <footer className="mt-auto relative">
        <ExplainButton symbol={symbol} isExplainLoading={isExplainLoading} />
      </footer>
    </article>
  );
}