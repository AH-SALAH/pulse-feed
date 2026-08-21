"use client";

import { useTranslation } from "react-i18next";

export function BoardFooter() {
  const { t } = useTranslation();

  return (
    <footer className="fixed bottom-0 z-10 w-full border-t border-outline bg-surface-container-low/80 backdrop-blur lg:block">
      <div className="flex items-center justify-between gap-4 px-margin-mobile lg:px-margin-desktop py-2 text-xs">
        <div className="flex items-center gap-4 font-telemetry text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-pulse rounded-full bg-positive opacity-75" />
              <span className="absolute inset-0 rounded-full bg-positive" />
            </span>
            {t("board.realTimeFeed")}: {t("board.version")}
          </span>
          <span>{t("board.latency")}: 14ms</span>
          <span>{t("board.uptime")}: 99.98%</span>
        </div>
        <p className="font-body text-on-surface-variant">
          {t("demo.footerCta", { year: String(new Date().getFullYear()) })}
        </p>
      </div>
    </footer>
  );
}