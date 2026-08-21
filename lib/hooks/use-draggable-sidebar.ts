"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  clampPosition,
  defaultPosition,
  movePosition,
  parseStoredPosition,
  serializePosition,
  SIDEBAR_KEYBOARD_STEP,
  type SidebarPosition,
} from "@/lib/ui/sidebar-position";

export interface UseDraggableSidebarOptions {
  storageKey: string;
  margin?: number;
}

interface DragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
}

function viewportSize(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight };
}

function isRtl(): boolean {
  return document.documentElement.dir === "rtl";
}

export function useDraggableSidebar({
  storageKey,
  margin = 16,
}: UseDraggableSidebarOptions) {
  const ref = useRef<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [side, setSide] = useState<"left" | "right">("left");
  const dragStateRef = useRef<DragState | null>(null);
  const positionRef = useRef<SidebarPosition | null>(null);
  const initializedRef = useRef(false);

  const applyTransform = (pos: SidebarPosition) => {
    const el = ref.current;
    if (!el) return;
    positionRef.current = pos;
    el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    const viewport = viewportSize();
    const centerX = pos.x + el.offsetWidth / 2;
    setSide(centerX < viewport.width / 2 ? "left" : "right");
  };

  const boundsOf = () => {
    const el = ref.current;
    const vp = viewportSize();
    return {
      width: el ? el.offsetWidth : 0,
      height: el ? el.offsetHeight : 0,
      viewportWidth: vp.width,
      viewportHeight: vp.height,
      margin,
    };
  };

  const restorePosition = () => {
    const bounds = boundsOf();
    if (!bounds.width || !bounds.height) return;
    const stored = parseStoredPosition(
      typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null,
    );
    const next = stored
      ? clampPosition(stored, bounds)
      : defaultPosition(bounds, isRtl() ? "rtl" : "ltr");
    applyTransform(next);
    initializedRef.current = true;
  };

  useLayoutEffect(() => {
    restorePosition();

    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      const bounds = boundsOf();
      if (!bounds.width || !bounds.height) return;
      if (initializedRef.current && positionRef.current) {
        applyTransform(clampPosition(positionRef.current, bounds));
      } else {
        restorePosition();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
    // storageKey is constant per mount; margin is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!positionRef.current) restorePosition();
    if (!positionRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: positionRef.current.x,
      originY: positionRef.current.y,
    };
    setIsDragging(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const bounds = boundsOf();
    if (!bounds.width || !bounds.height) return;
    const next = clampPosition(
      movePosition(
        { x: drag.originX, y: drag.originY },
        event.clientX - drag.startClientX,
        event.clientY - drag.startClientY,
      ),
      bounds,
    );
    applyTransform(next);
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
    setIsDragging(false);
    if (!positionRef.current) return;
    try {
      window.localStorage.setItem(
        storageKey,
        serializePosition(positionRef.current),
      );
    } catch {
      // storage may be unavailable (private mode) — dragging still works.
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    endDrag(event);
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    endDrag(event);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const map: Record<string, { dx: number; dy: number }> = {
      ArrowLeft: { dx: -SIDEBAR_KEYBOARD_STEP, dy: 0 },
      ArrowRight: { dx: SIDEBAR_KEYBOARD_STEP, dy: 0 },
      ArrowUp: { dx: 0, dy: -SIDEBAR_KEYBOARD_STEP },
      ArrowDown: { dx: 0, dy: SIDEBAR_KEYBOARD_STEP },
    };
    const step = map[event.key];
    if (!step) return;
    event.preventDefault();
    if (!positionRef.current) restorePosition();
    if (!positionRef.current) return;
    const bounds = boundsOf();
    if (!bounds.width || !bounds.height) return;
    const next = clampPosition(movePosition(positionRef.current, step.dx, step.dy), bounds);
    applyTransform(next);
    try {
      window.localStorage.setItem(storageKey, serializePosition(next));
    } catch {
      // ignore storage failures
    }
  };

  return {
    ref,
    isDragging,
    side,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onKeyDown,
    },
  };
}