"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuSearch, LuX, LuPlus } from "react-icons/lu";
import { useMarketData } from "@/components/market-data/MarketDataProvider";
import CoinIcon from "@/components/widget/CoinIcon";
import Sparkline from "@/components/widget/Sparkline";

interface AddWidgetModalProps {
  open: boolean;
  symbols: readonly string[];
  onAdd: (symbol: string) => void;
  onClose: () => void;
}

const priceFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function AddWidgetModal({
  open,
  symbols,
  onAdd,
  onClose,
}: AddWidgetModalProps) {
  const { t } = useTranslation();
  const { latestTick, window: getWindow } = useMarketData();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) triggerRef.current?.focus();
  }, [open]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return symbols;
    return symbols.filter((symbol) => {
      const base = symbol.replace("USDT", "");
      const name = t(`widget.names.${base}`, base);
      return (
        symbol.toLowerCase().includes(needle) ||
        name.toLowerCase().includes(needle)
      );
    });
  }, [query, symbols, t]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-surface-container-lowest/80 p-gutter backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-widget-modal-title"
        data-testid="add-widget-modal"
        className="relative z-50 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-outline-variant/20 bg-surface px-6 py-4">
          <div className="flex flex-col">
            <h2
              id="add-widget-modal-title"
              className="font-heading text-headline-md font-medium text-on-surface"
            >
              {t("board.modalTitle")}
            </h2>
            <p className="mt-1 font-body text-body-md text-on-surface-variant">
              {t("board.modalSubtitle")}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("board.closeModalAria")}
            className="flex size-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            onClick={onClose}
          >
            <LuX aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div className="border-b border-outline-variant/10 bg-surface-container-lowest px-6 py-3">
          <div className="relative">
            <LuSearch
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-on-surface-variant"
            />
            <input
              ref={searchRef}
              type="text"
              data-testid="add-widget-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={t("board.searchAria")}
              placeholder={t("board.searchPlaceholder")}
              className="h-10 w-full rounded-full border border-outline-variant/30 bg-surface-container py-2 pl-10 pr-20 font-body text-body-md text-on-surface transition-all placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <span className="rounded-sm border border-outline-variant/30 bg-surface-variant px-1.5 py-0.5 font-label text-label-caps text-on-surface-variant">
                {navigator.platform.toLowerCase().includes("mac")
                  ? "⌘"
                  : "Ctrl"}
              </span>
              <span className="rounded-sm border border-outline-variant/30 bg-surface-variant px-1.5 py-0.5 font-label text-label-caps text-on-surface-variant">
                K
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 border-b border-outline-variant/20 bg-surface px-6 py-2 text-label-caps font-label uppercase tracking-wider text-on-surface-variant">
          <div className="col-span-5 flex items-center">
            {t("board.assetHeader")}
          </div>
          <div className="col-span-3 text-end">{t("board.valueHeader")}</div>
          <div className="col-span-4 text-end">{t("board.trendHeader")}</div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto bg-surface-container-lowest p-2">
          {filtered.length === 0 ? (
            <p
              data-testid="add-widget-no-results"
              className="px-6 py-8 text-center font-body text-body-md text-on-surface-variant"
            >
              {t("board.noResults")}
            </p>
          ) : (
            filtered.map((symbol, index) => {
              const base = symbol.replace("USDT", "");
              const tick = latestTick(symbol);
              const prices = getWindow(symbol).map((t) => t.price);
              const changePct = tick?.changePct ?? 0;
              const positive = changePct > 0;
              const neutral = changePct === 0;
              return (
                <button
                  key={symbol}
                  type="button"
                  data-testid={`add-widget-option-${symbol}`}
                  aria-label={t("board.addRowAria", { symbol })}
                  onClick={() => onAdd(symbol)}
                  className={`group grid w-full cursor-pointer grid-cols-12 items-center gap-4 rounded-lg border border-transparent px-4 py-2 text-start transition-all hover:border-outline-variant/30 ${
                    index % 2 === 0
                      ? "bg-surface-container"
                      : "bg-surface-bright"
                  }`}
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-outline-variant/20 bg-surface transition-colors group-hover:bg-surface-container-high">
                      <CoinIcon
                        symbol={base}
                        className={`size-[18px] ${
                          positive ? "text-secondary" : "text-on-surface-variant"
                        }`}
                      />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-telemetry text-telemetry-sm font-semibold text-on-surface">
                        {base}/USD
                      </span>
                      <span className="truncate font-body text-body-md text-on-surface-variant">
                        {t(`widget.names.${base}`, base)}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-3 flex flex-col items-end justify-center">
                    <span className="font-telemetry text-telemetry-sm text-on-surface">
                      {tick ? priceFormat.format(tick.price) : "—"}
                    </span>
                    <span
                      className={`font-telemetry text-telemetry-sm ${
                        neutral
                          ? "text-tertiary"
                          : positive
                            ? "text-secondary"
                            : "text-error"
                      }`}
                    >
                      {tick ? `${positive ? "+" : ""}${changePct.toFixed(2)}%` : "--.--%"}
                    </span>
                  </div>
                  <div className="col-span-4 flex items-center justify-end gap-3">
                    <div dir="ltr">
                      <Sparkline
                        data={prices}
                        isLive
                        aria-label={t("board.rowSparklineAria", { symbol })}
                        className="h-5 w-16 overflow-visible"
                      />
                    </div>
                    <LuPlus
                      aria-hidden="true"
                      className="size-5 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-outline-variant/20 bg-surface px-6 py-3">
          <button
            ref={triggerRef}
            type="button"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-outline-variant/30 px-4 py-2 font-body text-body-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            onClick={onClose}
          >
            {t("board.cancel")}
          </button>
        </footer>
      </div>
    </div>
  );
}