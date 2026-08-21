import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPublicDemoBoard,
  ensureDefaultBoard,
  addWidget,
  removeWidget,
  reorderWidgets,
} from "./service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    board: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    widget: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const DEMO_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];

function fakeBoard(userId: string, boardId = "board_1") {
  return {
    id: boardId,
    userId,
    name: "My Board",
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    widgets: DEMO_SYMBOLS.map((symbol, position) => ({
      id: `widget_${symbol.toLowerCase()}`,
      boardId,
      symbol,
      position,
      config: {},
    })),
  };
}

describe("getPublicDemoBoard", () => {
  it("returns exactly the 4 fixed demo symbols with no database call", () => {
    const widgets = getPublicDemoBoard();
    expect(widgets.map((w) => w.symbol)).toEqual([
      "BTCUSDT",
      "ETHUSDT",
      "SOLUSDT",
      "BNBUSDT",
    ]);
    expect(widgets).toHaveLength(4);
  });

  it("positions are sequential and ids are stable", () => {
    const widgets = getPublicDemoBoard();
    widgets.forEach((w, index) => {
      expect(w.position).toBe(index);
      expect(w.id).toBe(`demo-${w.symbol.toLowerCase()}`);
    });
  });
});

describe("ensureDefaultBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a board with exactly 4 widgets if none exists for the user", async () => {
    vi.mocked(prisma.board.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.board.create).mockResolvedValue(fakeBoard("user_1"));

    const board = await ensureDefaultBoard("user_1");

    expect(prisma.board.create).toHaveBeenCalledTimes(1);
    const createData = vi.mocked(prisma.board.create).mock.calls[0]![0] as {
      data: {
        userId: string;
        widgets: { create: { symbol: string; position: number }[] };
      };
    };
    expect(createData.data.userId).toBe("user_1");
    expect(createData.data.widgets.create).toHaveLength(4);
    expect(board.widgets.map((w) => w.symbol)).toEqual(DEMO_SYMBOLS);
  });

  it("is idempotent: calling twice does not create a second board", async () => {
    vi.mocked(prisma.board.findFirst)
      .mockResolvedValueOnce(fakeBoard("user_1"))
      .mockResolvedValueOnce(fakeBoard("user_1"));

    const first = await ensureDefaultBoard("user_1");
    const second = await ensureDefaultBoard("user_1");

    expect(prisma.board.create).not.toHaveBeenCalled();
    expect(first.id).toBe(second.id);
    expect(first.widgets).toHaveLength(4);
  });
});

describe("addWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const board = {
    id: "board_1",
    userId: "user_1",
    name: "My Board",
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("creates a widget on the caller's board at the next position", async () => {
    vi.mocked(prisma.board.findFirst).mockResolvedValue(board);
    vi.mocked(prisma.widget.count).mockResolvedValue(4);
    vi.mocked(prisma.widget.create).mockResolvedValue({
      id: "widget_ada",
      boardId: "board_1",
      symbol: "ADAUSDT",
      position: 4,
      config: {},
    });

    const widget = await addWidget("user_1", "ADAUSDT");

    expect(widget).toEqual({
      id: "widget_ada",
      symbol: "ADAUSDT",
      position: 4,
    });
    expect(prisma.widget.create).toHaveBeenCalledWith({
      data: { boardId: "board_1", symbol: "ADAUSDT", position: 4 },
    });
  });

  it("scopes the lookup to the caller's board via userId", async () => {
    vi.mocked(prisma.board.findFirst).mockResolvedValue(board);
    vi.mocked(prisma.widget.count).mockResolvedValue(0);
    vi.mocked(prisma.widget.create).mockResolvedValue({
      id: "widget_x",
      boardId: "board_1",
      symbol: "XRPUSDT",
      position: 0,
      config: {},
    });

    await addWidget("user_1", "XRPUSDT");

    expect(prisma.board.findFirst).toHaveBeenCalledWith({
      where: { userId: "user_1" },
    });
  });

  it("rejects with WIDGET_CAP (409) when the board already has 8 widgets", async () => {
    vi.mocked(prisma.board.findFirst).mockResolvedValue(board);
    vi.mocked(prisma.widget.count).mockResolvedValue(8);

    await expect(addWidget("user_1", "ADAUSDT")).rejects.toEqual(
      expect.objectContaining({ status: 409, code: "WIDGET_CAP" }),
    );
    expect(prisma.widget.create).not.toHaveBeenCalled();
  });

  it("rejects with BOARD_NOT_FOUND (404) when the user has no board", async () => {
    vi.mocked(prisma.board.findFirst).mockResolvedValue(null);

    await expect(addWidget("user_1", "ADAUSDT")).rejects.toEqual(
      expect.objectContaining({ status: 404, code: "BOARD_NOT_FOUND" }),
    );
    expect(prisma.widget.create).not.toHaveBeenCalled();
  });
});

describe("removeWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the caller's widget and renormalizes positions", async () => {
    vi.mocked(prisma.widget.findUnique).mockResolvedValue({
      id: "widget_1",
      boardId: "board_1",
      symbol: "BTCUSDT",
      position: 1,
      config: {},
      board: { id: "board_1", userId: "user_1" },
    } as never);
    vi.mocked(prisma.widget.delete).mockResolvedValue({} as never);

    await removeWidget("user_1", "widget_1");

    expect(prisma.widget.delete).toHaveBeenCalledWith({
      where: { id: "widget_1" },
    });
    expect(prisma.widget.updateMany).toHaveBeenCalledWith({
      where: { boardId: "board_1", position: { gt: 1 } },
      data: { position: { decrement: 1 } },
    });
  });

  it("rejects with FORBIDDEN (403) when the widget belongs to another user", async () => {
    vi.mocked(prisma.widget.findUnique).mockResolvedValue({
      id: "widget_1",
      boardId: "board_2",
      symbol: "BTCUSDT",
      position: 0,
      config: {},
      board: { id: "board_2", userId: "user_2" },
    } as never);

    await expect(removeWidget("user_1", "widget_1")).rejects.toEqual(
      expect.objectContaining({ status: 403, code: "FORBIDDEN" }),
    );
    expect(prisma.widget.delete).not.toHaveBeenCalled();
  });

  it("rejects with WIDGET_NOT_FOUND (404) when the widget does not exist", async () => {
    vi.mocked(prisma.widget.findUnique).mockResolvedValue(null as never);

    await expect(removeWidget("user_1", "ghost")).rejects.toEqual(
      expect.objectContaining({ status: 404, code: "WIDGET_NOT_FOUND" }),
    );
    expect(prisma.widget.delete).not.toHaveBeenCalled();
  });
});

describe("reorderWidgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function boardWithWidgets(widgetIds: string[]) {
    const symbolOf: Record<string, string> = {
      w_btc: "BTCUSDT",
      w_eth: "ETHUSDT",
      w_sol: "SOLUSDT",
    };
    return {
      id: "board_1",
      userId: "user_1",
      name: "My Board",
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      widgets: widgetIds.map((id, position) => ({
        id,
        boardId: "board_1",
        symbol: symbolOf[id] ?? `SYM${position}`,
        position,
        config: {},
      })),
    };
  }

  it("applies the given order and returns the updated board DTO", async () => {
    const widgetIds = ["w_btc", "w_eth", "w_sol"];
    vi.mocked(prisma.board.findFirst)
      .mockResolvedValueOnce(boardWithWidgets(widgetIds))
      .mockResolvedValueOnce(
        boardWithWidgets(["w_sol", "w_btc", "w_eth"]),
      );
    vi.mocked(prisma.widget.update).mockImplementation(
      (({ where, data }: { where: { id: string }; data: { position: number } }) =>
        Promise.resolve({ id: where.id, ...data })) as never,
    );
    vi.mocked(prisma.$transaction).mockImplementation(
      ((updates: unknown[]) => Promise.all(updates)) as never,
    );

    const board = await reorderWidgets("user_1", ["w_sol", "w_btc", "w_eth"]);

    const txUpdates = vi.mocked(prisma.widget.update).mock.calls.map((c) => ({
      where: c[0]!.where,
      data: c[0]!.data,
    }));
    expect(txUpdates).toEqual([
      { where: { id: "w_sol" }, data: { position: 0 } },
      { where: { id: "w_btc" }, data: { position: 1 } },
      { where: { id: "w_eth" }, data: { position: 2 } },
    ]);
    expect(board.widgets.map((w) => w.symbol)).toEqual([
      "SOLUSDT",
      "BTCUSDT",
      "ETHUSDT",
    ]);
  });

  it("rejects with INVALID_ORDER (422) when the order mismatches the board's widget ids", async () => {
    vi.mocked(prisma.board.findFirst).mockResolvedValue(
      boardWithWidgets(["w_btc", "w_eth", "w_sol"]),
    );

    await expect(
      reorderWidgets("user_1", ["w_btc", "w_eth"]),
    ).rejects.toEqual(
      expect.objectContaining({ status: 422, code: "INVALID_ORDER" }),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects with BOARD_NOT_FOUND (404) when the user has no board", async () => {
    vi.mocked(prisma.board.findFirst).mockResolvedValue(null);

    await expect(reorderWidgets("user_1", [])).rejects.toEqual(
      expect.objectContaining({ status: 404, code: "BOARD_NOT_FOUND" }),
    );
  });
});
