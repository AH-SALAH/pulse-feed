"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LuLayoutGrid, LuX } from "react-icons/lu";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Widget from "../widget/Widget";
import { WidgetSkeleton } from "../widget/WidgetSkeleton";
import type { WidgetDTO } from "@/lib/boards/types";

export interface BoardGridProps {
  widgets: WidgetDTO[];
  editable?: boolean;
  loading?: boolean;
  dragId?: string | null;
  onDragStart?: (id: string) => void;
  onDragOver?: (id: string) => void;
  onDrop?: (id: string) => void;
  onDragEnd?: () => void;
  onRemove?: (id: string) => void;
}

export function BoardGrid({
  widgets,
  editable = false,
  loading = false,
  dragId = null,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
}: BoardGridProps) {
  const { t } = useTranslation();
  const { locale } = useParams<{ locale: string }>();
  const reducedMotion = useReducedMotion();

  const transition = reducedMotion
    ? { layout: { duration: 0 }, duration: 0 }
    : {
        layout: { type: "spring", stiffness: 380, damping: 30, mass: 0.8 },
        opacity: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
        scale: { type: "spring", stiffness: 500, damping: 32, mass: 0.7 },
      };

  const staggerDelay = reducedMotion ? 0 : 0.04;

  return (
    <div>
      {loading ? (
        <div className="relative grid grid-cols-[repeat(1,minmax(0,1fr))] gap-gutter sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(4,minmax(0,1fr))]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-card-in" style={{ animationDelay: `${i * 80}ms` }}>
              <WidgetSkeleton />
            </div>
          ))}
        </div>
      ) : (
      <div className="relative grid grid-cols-[repeat(1,minmax(0,1fr))] gap-gutter sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(4,minmax(0,1fr))]">
        <AnimatePresence mode="popLayout" initial={false}>
          {widgets.map((widget) => {
            const isDragging = dragId === widget.id;
            return (
              <motion.div
                key={widget.id}
                layout
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={
                  isDragging
                    ? { opacity: 0.5, scale: 1.04, y: -2 }
                    : { opacity: 1, scale: 1, y: 0 }
                }
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  y: 4,
                  transition: { duration: reducedMotion ? 0 : 0.2, ease: [0.4, 0, 1, 1] },
                }}
                transition={{
                  ...transition,
                  delay: staggerDelay,
                }}
                className="relative"
              >
                <div
                  data-testid="widget-slot"
                  draggable={editable}
                  onDragStart={(e) => {
                    if (!editable) return;
                    onDragStart?.(widget.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    if (editable && dragId) {
                      e.preventDefault();
                      onDragOver?.(widget.id);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    onDrop?.(widget.id);
                  }}
                  onDragEnd={() => onDragEnd?.()}
                >
                  <Widget
                    id={widget.id}
                    symbol={widget.symbol}
                    position={widget.position}
                    editable={editable}
                  />
                  {editable ? (
                    <button
                      type="button"
                      data-testid="remove-widget"
                      aria-label={t("board.removeAria", { symbol: widget.symbol })}
                      className="absolute -top-2 -end-2 flex size-6 cursor-pointer items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container text-on-surface-variant/60 shadow-sm transition-all hover:-top-2.5 hover:-end-2.5 hover:scale-110 hover:border-error hover:text-error hover:bg-error-container/30 hover:shadow-md hover:shadow-error/10"
                      onClick={() => onRemove?.(widget.id)}
                    >
                      <LuX aria-hidden="true" className="size-4" />
                    </button>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      )}

      {!loading && widgets.length === 0 ? (
        <div
          data-testid="board-empty"
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low p-8 lg:p-12 text-center"
        >
          <LuLayoutGrid
            aria-hidden="true"
            className="size-12 text-outline-variant"
          />
          <p className="font-heading text-headline-md font-medium text-on-surface">
            {t("board.empty.title")}
          </p>
          <Link
            href={`/${locale}/board`}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-body-md font-medium text-on-primary transition hover:bg-primary-container/80 h-[40px]"
          >
            {t("board.empty.cta")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}