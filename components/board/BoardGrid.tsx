"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LuLayoutGrid, LuX } from "react-icons/lu";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Widget from "../widget/Widget";
import type { WidgetDTO } from "@/lib/boards/types";

export interface BoardGridProps {
  widgets: WidgetDTO[];
  editable?: boolean;
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
        layout: { type: "spring", stiffness: 420, damping: 36, mass: 0.9 },
        opacity: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
        scale: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
      };

  return (
    <div>
      <div className="relative grid grid-cols-[repeat(1,minmax(0,1fr))] gap-gutter sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(4,minmax(0,1fr))]">
        <AnimatePresence mode="popLayout" initial={false}>
          {widgets.map((widget) => {
            const isDragging = dragId === widget.id;
            return (
              <motion.div
                key={widget.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={
                  isDragging
                    ? { opacity: 0.55, scale: 1.03 }
                    : { opacity: 1, scale: 1 }
                }
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  transition: { duration: reducedMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] },
                }}
                transition={transition}
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
                      className="absolute -top-2 -end-2 flex size-6 cursor-pointer items-center justify-center rounded-full border border-outline-variant bg-surface-container text-on-surface-variant shadow-sm hover:border-error hover:text-error hover:bg-error-container/20 transition-colors"
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

      {widgets.length === 0 ? (
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