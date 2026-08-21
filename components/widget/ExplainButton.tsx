"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCircleAlert, LuInfo, LuX, LuSparkles, LuBrainCircuit } from "react-icons/lu";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface ExplainButtonProps {
  symbol: string;
  initialState?: ExplainState;
  isExplainLoading: boolean
}

type ExplainState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; summary: string }
  | { status: "unavailable"; resetsAt: string }
  | { status: "error"; errorKey: "signInRequired" | "error" };

const STREAM_MS = 16;
const STREAM_CHARS = 2;

export default function ExplainButton({
  symbol,
  initialState,
  isExplainLoading
}: ExplainButtonProps) {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<ExplainState>(
    initialState ?? { status: "idle" },
  );

  useEffect(() => {
    if(state.status === "idle") return;
    if(state.status === "loading") {
      dispatchEvent(new CustomEvent("explaining", { detail: true, bubbles: true, composed: true }));
    }
    else {
      dispatchEvent(new CustomEvent("explaining", { detail: false, bubbles: true, composed: true }));
    }
  }, [state.status]);

  async function explain(): Promise<void> {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, locale: i18n.resolvedLanguage ?? "en" }),
      });
      const body = (await res.json().catch(() => null)) as
        | { available: true; summary: string }
        | { available: false; resetsAt: string }
        | null;
      if (body?.available) {
        setState({ status: "success", summary: body.summary });
        return;
      }
      if (body && "resetsAt" in body) {
        setState({ status: "unavailable", resetsAt: body.resetsAt });
        return;
      }
      if (res.status === 401) {
        setState({ status: "error", errorKey: "signInRequired" });
        return;
      }
      setState({ status: "error", errorKey: "error" });
    } catch {
      setState({ status: "error", errorKey: "error" });
    }
  }

  function dismiss(): void {
    setState({ status: "idle" });
  }

  const label =
    state.status === "loading"
      ? t("widget.explain.loading")
      : state.status === "success"
        ? t("widget.explain.again")
        : t("widget.explain.cta");

  const popoverOpen =
    state.status === "loading" ||
    state.status === "success" ||
    state.status === "unavailable" ||
    state.status === "error";

  return (
    <div className="flex flex-col">
      {popoverOpen ? (
        <section
          data-testid={
            state.status === "success"
              ? "explain-summary"
              : state.status === "loading"
                ? "explain-loading"
                : state.status === "unavailable"
                  ? "explain-unavailable"
                  : "explain-error"
          }
          className="absolute bottom-full z-20 mb-3 w-full animate-popover-in rounded-2xl border border-outline-variant/40 bg-surface-container-high motion-reduce:animate-none"
        >
          <header className="flex items-center justify-between gap-2 px-3 pt-2.5">
            <span className="flex items-center gap-2 text-secondary">
              <span className="flex size-5 items-center justify-center rounded-sm bg-secondary/10">
                <LuBrainCircuit aria-hidden="true" className="size-3.5" />
              </span>
              <span className="font-label text-label-caps">
                {t("widget.explain.heading")}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-telemetry text-telemetry-sm tracking-tight text-on-surface-variant/70">
                {symbol}
              </span>
              <button
                type="button"
                data-testid="explain-close"
                aria-label={t("widget.explain.dismiss")}
                className="flex size-5 cursor-pointer items-center justify-center rounded-sm text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface"
                onClick={dismiss}
              >
                <LuX aria-hidden="true" className="size-3.5" />
              </button>
            </span>
          </header>

          {state.status === "loading" ? (
            <div className="flex items-center gap-3 px-3 pb-3 pt-2.5">
              <span
                aria-hidden="true"
                className="h-6 w-px shrink-0 rounded-full bg-secondary/30"
              />
              <div className="h-1 w-full overflow-hidden rounded-full bg-secondary/10">
                <div className="h-full w-full origin-left animate-pulse-skeleton bg-secondary/50 rtl:origin-right" />
              </div>
            </div>
          ) : null}

          {state.status === "success" ? (
            <div className="flex gap-3 px-3 pb-3 pt-2.5">
              <span
                aria-hidden="true"
                className="w-px shrink-0 self-stretch rounded-full bg-secondary/40"
              />
              <StreamingText
                key={state.summary}
                text={state.summary}
                reducedMotion={reducedMotion}
              />
            </div>
          ) : null}

          {state.status === "unavailable" ? (
            <div className="flex items-center gap-2 px-3 pb-3 pt-2.5">
              <LuInfo
                aria-hidden="true"
                className="size-4 shrink-0 text-on-surface-variant"
              />
              <p className="font-body text-body-md text-on-surface-variant">
                {t("widget.explain.unavailable")}
              </p>
            </div>
          ) : null}

          {state.status === "error" ? (
            <div className="flex items-center gap-2 px-3 pb-3 pt-2.5">
              <LuCircleAlert
                aria-hidden="true"
                className="size-4 shrink-0 text-error"
              />
              <p className="font-body text-body-md text-error">
                {t(`widget.explain.${state.errorKey}`)}
              </p>
            </div>
          ) : null}

          <span
            aria-hidden="true"
            className="absolute -bottom-1 start-6 size-2 rotate-45 rounded-[1px] border-b border-r border-outline-variant/40 bg-surface-container-high"
          />
        </section>
      ) : null}

      <div aria-live="polite" className="sr-only">
        {state.status === "success" ? state.summary : ""}
        {state.status === "unavailable" ? t("widget.explain.unavailable") : ""}
        {state.status === "error"
          ? t(`widget.explain.${state.errorKey}`)
          : ""}
      </div>

      <button
        type="button"
        data-testid="explain-button"
        aria-label={t("widget.explain.aria", { symbol })}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-t border-outline-variant/10 bg-surface-container-low/50 px-3 py-2.5 font-body text-body-md text-secondary transition-all hover:bg-secondary/10 hover:text-secondary hover:shadow-[inset_0_1px_0_var(--color-secondary)]/10 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={state.status === "loading" || isExplainLoading}
        onClick={explain}
      >
        <LuSparkles aria-hidden="true" className="size-4" />
        {label}
      </button>
    </div>
  );
}

interface StreamingTextProps {
  text: string;
  reducedMotion: boolean;
}

function StreamingText({ text, reducedMotion }: StreamingTextProps) {
  const [count, setCount] = useState(() =>
    reducedMotion ? text.length : 0,
  );

  useEffect(() => {
    if (reducedMotion) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += STREAM_CHARS;
      if (i >= text.length) {
        setCount(text.length);
        window.clearInterval(id);
      } else {
        setCount(i);
      }
    }, STREAM_MS);
    return () => window.clearInterval(id);
  }, [text, reducedMotion]);

  const done = count >= text.length;

  return (
    <p className="max-h-[10.5rem] overflow-y-auto overscroll-contain font-body text-body-md text-pretty leading-relaxed text-on-surface">
      {text.slice(0, count)}
      {!done && !reducedMotion ? (
        <span
          aria-hidden="true"
          className="ms-1 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-pulse rounded-full bg-secondary"
        />
      ) : null}
    </p>
  );
}