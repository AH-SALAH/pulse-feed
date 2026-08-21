"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuPlus } from "react-icons/lu";
import { MarketDataProvider } from "@/components/market-data/MarketDataProvider";
import { AddWidgetModal } from "./AddWidgetModal";
import { BoardGrid } from "./BoardGrid";
import type { BoardDTO, WidgetDTO } from "@/lib/boards/types";

const MAX_WIDGETS = 8;
const ADDABLE_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "ADAUSDT", "DOGEUSDT", "XRPUSDT", "LINKUSDT", "DOTUSDT", "AVAXUSDT"];

interface BoardClientProps {
  widgets: WidgetDTO[];
  editable?: boolean;
}

type BoardQuery = { board: BoardDTO };

export default function BoardClient({ widgets: initialWidgets, editable = false }: BoardClientProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dragId, setDragId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Serialized queue refs to prevent reorder race conditions
  const pendingOrderRef = useRef<string[] | null>(null);
  const isSyncingRef = useRef(false);
  const snapshotRef = useRef<BoardQuery | null>(null);

  const { data } = useQuery<BoardQuery>({
    queryKey: ["board", editable ? "personal" : "demo"],
    queryFn: async () => {
      const res = await fetch("/api/boards/me", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load board");
      return (await res.json()) as BoardQuery;
    },
    enabled: editable,
    initialData: { board: { id: "", name: "My Board", widgets: initialWidgets } },
  });

  const board = data.board;
  const symbols = board.widgets.map((widget: WidgetDTO) => widget.symbol);
  const watchSymbols = Array.from(
    new Set([...symbols, ...ADDABLE_SYMBOLS]),
  );
  const atCap = board.widgets.length >= MAX_WIDGETS;
  const addable = ADDABLE_SYMBOLS.filter(
    (symbol) => !board.widgets.some((w: WidgetDTO) => w.symbol === symbol),
  );

  function handleAdd(symbol: string) {
    addMutation.mutate(symbol);
    setModalOpen(false);
  }

  const addMutation = useMutation({
    mutationFn: async (symbol: string) => {
      const res = await fetch("/api/boards/me/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      const json = (await res.json().catch(() => null)) as
        | { widget: WidgetDTO }
        | { error: string }
        | null;
      if (!res.ok) {
        throw new Error(
          (json && "error" in json ? json.error : "") ||
            t("board.addError"),
        );
      }
      return json;
    },
    onMutate: async (symbol) => {
      setAddError(null);
      await queryClient.cancelQueries({ queryKey: ["board"] });
      const prev = queryClient.getQueryData<BoardQuery>(["board"]);
      queryClient.setQueryData<BoardQuery>(["board"], (old) => {
        if (!old) return old;
        return {
          board: {
            ...old.board,
            widgets: [
              ...old.board.widgets,
              { id: `temp-${symbol}`, symbol, position: old.board.widgets.length },
            ],
          },
        };
      });
      return { prev };
    },
    onError: (err, _symbol, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["board"], ctx.prev);
      setAddError(err instanceof Error ? err.message : t("board.addError"));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["board"] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (widgetId: string) => {
      const res = await fetch("/api/boards/me/widgets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetId }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as
          | { error: string }
          | null;
        throw new Error(
          (json && "error" in json ? json.error : "") ||
            t("board.removeError"),
        );
      }
    },
    onMutate: async (widgetId) => {
      await queryClient.cancelQueries({ queryKey: ["board"] });
      const prev = queryClient.getQueryData<BoardQuery>(["board"]);
      queryClient.setQueryData<BoardQuery>(["board"], (old) => {
        if (!old) return old;
        return {
          board: {
            ...old.board,
            widgets: old.board.widgets
              .filter((w) => w.id !== widgetId)
              .map((w, position) => ({ ...w, position })),
          },
        };
      });
      return { prev };
    },
    onError: (_err, _widgetId, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["board"], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["board"] }),
  });

  const processReorderQueue = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    while (pendingOrderRef.current !== null) {
      const orderToSend = pendingOrderRef.current;
      pendingOrderRef.current = null;

      try {
        const res = await fetch("/api/boards/me/widgets", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderToSend }),
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(json?.error || t("board.reorderError"));
        }
      } catch (err) {
        // Revert to snapshot on network/server error and flush queue
        if (snapshotRef.current) {
          queryClient.setQueryData(["board"], snapshotRef.current);
        }
        pendingOrderRef.current = null;
        snapshotRef.current = null;
        isSyncingRef.current = false;
        setAddError(err instanceof Error ? err.message : t("board.reorderError"));
        return;
      }
    }

    isSyncingRef.current = false;
    snapshotRef.current = null;
    queryClient.invalidateQueries({ queryKey: ["board"] });
  }, [queryClient, t]);

  const handleDrop = useCallback(
    (targetId: string) => {
      if (!dragId || dragId === targetId) return;

      const currentWidgets = board.widgets;
      const newOrder = reorderInPlace(
        currentWidgets.map((w) => w.id),
        dragId,
        targetId,
      );

      // Save initial snapshot before first queued mutation
      if (!isSyncingRef.current && !snapshotRef.current) {
        snapshotRef.current = queryClient.getQueryData<BoardQuery>(["board"]) ?? null;
      }

      // Optimistically update query cache immediately
      queryClient.setQueryData<BoardQuery>(["board"], (old) => {
        if (!old) return old;
        const byId = new Map(old.board.widgets.map((w) => [w.id, w]));
        const widgets = newOrder.map((id, position) => ({
          ...byId.get(id)!,
          position,
        }));
        return { board: { ...old.board, widgets } };
      });

      pendingOrderRef.current = newOrder;
      setDragId(null);
      void processReorderQueue();
    },
    [dragId, board.widgets, queryClient, processReorderQueue],
  );

  return (
    <MarketDataProvider symbols={watchSymbols}>
      {editable && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container p-4 justify-between">
          <button
            type="button"
            data-testid="add-widget-button"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-body-md font-medium text-on-primary transition hover:bg-primary-container/80 disabled:cursor-not-allowed disabled:opacity-50 h-[40px]"
            disabled={atCap || addable.length === 0}
            onClick={() => setModalOpen(true)}
          >
            <LuPlus aria-hidden="true" className="size-4" />
            {t("board.addWidget")}
          </button>
          <div className="block">
            <h4 className="text-2xl font-bold">{t(`${'board.'+ board.name?.replace(/^[A-Z]/, match => match?.toLowerCase())?.replaceAll(/(\s+)(\w)/ig, '$2')}`, board.name)}</h4>
            {atCap ? (
              <p
                data-testid="widget-limit-message"
                className="font-body text-body-md font-medium text-error"
              >
                {t("board.widgetLimitReached", { count: MAX_WIDGETS })}
              </p>
            ) : null}
            {addError ? (
              <p
                data-testid="add-error"
                className="font-body text-body-md font-medium text-error"
              >
                {addError}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <AddWidgetModal
        open={modalOpen}
        symbols={addable}
        onAdd={handleAdd}
        onClose={() => setModalOpen(false)}
      />

      <BoardGrid
        widgets={board.widgets}
        editable={editable}
        dragId={dragId}
        onDragStart={setDragId}
        onDrop={handleDrop}
        onDragEnd={() => setDragId(null)}
        onRemove={(id) => removeMutation.mutate(id)}
      />
    </MarketDataProvider>
  );
}

function reorderInPlace(ids: string[], from: string, to: string): string[] {
  const list = [...ids];
  const fromIdx = list.indexOf(from);
  const toIdx = list.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return list;
  list.splice(fromIdx, 1);
  list.splice(toIdx, 0, from);
  return list;
}