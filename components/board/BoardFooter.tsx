"use client";

import { useTranslation } from "react-i18next";

export function BoardFooter() {
  const { t } = useTranslation();

  return (
    <footer className="fixed bottom-0 z-10 w-full border-t border-outline/40 bg-surface-container-low/80 backdrop-blur-xl lg:block">
      <div className="flex items-center justify-between gap-4 px-margin-mobile lg:px-margin-desktop py-2.5 text-xs">
        <div className="flex items-center gap-3">
          <span className="hidden h-3 w-px bg-outline-variant/40 lg:block" />
          <p className="font-body text-body-sm text-on-surface-variant/60">
            {t("demo.footerCta", { year: String(new Date().getFullYear()) })}
          </p>
        </div>
        <div className="flex items-center gap-5 font-telemetry text-telemetry-sm text-on-surface-variant/80">
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-pulse rounded-full bg-positive opacity-75" />
              <span className="absolute inset-0 rounded-full bg-positive" />
            </span>
            {t("board.realTimeFeed")}
            <span className="text-on-surface-variant/40">{t("board.version")}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-on-surface-variant/50">{t("board.latency")}</span>
            <span className="text-positive">14ms</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-on-surface-variant/50">{t("board.uptime")}</span>
            <span className="text-positive">99.98%</span>
          </span>
        </div>
      </div>
    </footer>
  );
}