export interface SidebarPosition {
  x: number;
  y: number;
}

export interface SidebarBounds {
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  margin: number;
}

export const SIDEBAR_DEFAULT_OFFSET = 24;
export const SIDEBAR_KEYBOARD_STEP = 8;
export const SIDEBAR_STORAGE_KEY = "pulsefeed:board-sidebar-position";

export function clampPosition(
  pos: SidebarPosition,
  bounds: SidebarBounds,
): SidebarPosition {
  const maxX = Math.max(bounds.margin, bounds.viewportWidth - bounds.width - bounds.margin);
  const maxY = Math.max(bounds.margin, bounds.viewportHeight - bounds.height - bounds.margin);
  return {
    x: Math.min(Math.max(pos.x, bounds.margin), maxX),
    y: Math.min(Math.max(pos.y, bounds.margin), maxY),
  };
}

export function defaultPosition(
  bounds: SidebarBounds,
  dir: "ltr" | "rtl",
): SidebarPosition {
  const y = Math.round((bounds.viewportHeight - bounds.height) / 2);
  const x =
    dir === "rtl"
      ? bounds.viewportWidth - bounds.width - SIDEBAR_DEFAULT_OFFSET
      : SIDEBAR_DEFAULT_OFFSET;
  return { x, y };
}

export function movePosition(
  pos: SidebarPosition,
  dx: number,
  dy: number,
): SidebarPosition {
  return { x: pos.x + dx, y: pos.y + dy };
}

export function serializePosition(pos: SidebarPosition): string {
  return JSON.stringify(pos);
}

export function parseStoredPosition(raw: string | null): SidebarPosition | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("x" in parsed) ||
      !("y" in parsed)
    ) {
      return null;
    }
    const { x, y } = parsed as Record<string, unknown>;
    if (typeof x !== "number" || typeof y !== "number") return null;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  } catch {
    return null;
  }
}