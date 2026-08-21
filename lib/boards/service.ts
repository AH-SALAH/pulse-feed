import type { BoardDTO, WidgetDTO } from "./types";
import { BoardError } from "./errors";
import { prisma } from "@/lib/prisma";

export const DEMO_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"] as const;
export const MAX_WIDGETS = 8;

export function getPublicDemoBoard(): WidgetDTO[] {
  return DEMO_SYMBOLS.map((symbol, position) => ({
    id: `demo-${symbol.toLowerCase()}`,
    symbol,
    position,
  }));
}

export async function ensureDefaultBoard(userId: string): Promise<BoardDTO> {
  const existing = await prisma.board.findFirst({
    where: { userId },
    include: { widgets: { orderBy: { position: "asc" } } },
  });
  if (existing) {
    return toBoardDTO(existing);
  }

  const board = await prisma.board.create({
    data: {
      userId,
      name: "My Board",
      widgets: {
        create: DEMO_SYMBOLS.map((symbol, position) => ({ symbol, position })),
      },
    },
    include: { widgets: { orderBy: { position: "asc" } } },
  });
  return toBoardDTO(board);
}

type BoardWithWidgets = {
  id: string;
  name: string;
  widgets: { id: string; symbol: string; position: number }[];
};

function toBoardDTO(board: BoardWithWidgets): BoardDTO {
  return {
    id: board.id,
    name: board.name,
    widgets: board.widgets.map((w) => ({
      id: w.id,
      symbol: w.symbol,
      position: w.position,
    })),
  };
}

async function findBoardForUser(userId: string) {
  const board = await prisma.board.findFirst({
    where: { userId },
  });
  if (!board) {
    throw new BoardError("BOARD_NOT_FOUND", "No board found for this user");
  }
  return board;
}

export async function addWidget(
  userId: string,
  symbol: string,
): Promise<WidgetDTO> {
  const board = await findBoardForUser(userId);

  const count = await prisma.widget.count({ where: { boardId: board.id } });
  if (count >= MAX_WIDGETS) {
    throw new BoardError(
      "WIDGET_CAP",
      `Board limit of ${MAX_WIDGETS} widgets reached`,
    );
  }

  const widget = await prisma.widget.create({
    data: { boardId: board.id, symbol, position: count },
  });
  return { id: widget.id, symbol: widget.symbol, position: widget.position };
}

export async function removeWidget(
  userId: string,
  widgetId: string,
): Promise<void> {
  const widget = await prisma.widget.findUnique({
    where: { id: widgetId },
    include: { board: true },
  });
  if (!widget) {
    throw new BoardError("WIDGET_NOT_FOUND", "Widget not found");
  }
  if (widget.board.userId !== userId) {
    throw new BoardError("FORBIDDEN", "Widget does not belong to this user");
  }

  await prisma.widget.delete({ where: { id: widgetId } });
  await prisma.widget.updateMany({
    where: { boardId: widget.boardId, position: { gt: widget.position } },
    data: { position: { decrement: 1 } },
  });
}

export async function reorderWidgets(
  userId: string,
  order: string[],
): Promise<BoardDTO> {
  const board = await prisma.board.findFirst({
    where: { userId },
    include: { widgets: true },
  });
  if (!board) {
    throw new BoardError("BOARD_NOT_FOUND", "No board found for this user");
  }

  const ownedIds = new Set(board.widgets.map((w) => w.id));
  const orderHasSameSet =
    order.length === ownedIds.size && order.every((id) => ownedIds.has(id));
  if (!orderHasSameSet) {
    throw new BoardError(
      "INVALID_ORDER",
      "Order must contain exactly the board's widget ids",
    );
  }

  await prisma.$transaction(
    order.map((id, position) =>
      prisma.widget.update({ where: { id }, data: { position } }),
    ),
  );

  const updated = await prisma.board.findFirst({
    where: { userId },
    include: { widgets: { orderBy: { position: "asc" } } },
  });
  if (!updated) {
    throw new BoardError("BOARD_NOT_FOUND", "No board found for this user");
  }
  return toBoardDTO(updated);
}
