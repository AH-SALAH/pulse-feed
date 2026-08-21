import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth/session", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    board: {
      findFirst: vi.fn(),
    },
  },
}));

const DEMO_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];

function boardFor(userId: string, boardId: string) {
  return {
    id: boardId,
    userId,
    name: "My Board",
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    widgets: DEMO_SYMBOLS.map((symbol, position) => ({
      id: `widget_${boardId}_${symbol}`,
      boardId,
      symbol,
      position,
      config: {},
    })),
  };
}

function authedRequest(cookie: string): Request {
  return new Request("http://localhost:3000/api/boards/me", {
    headers: { cookie },
  });
}

describe("GET /api/boards/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost:3000/api/boards/me"));
    expect(res.status).toBe(401);
    expect(prisma.board.findFirst).not.toHaveBeenCalled();
  });

  it("returns the authenticated user's board", async () => {
    const userA = { id: "user_A", email: "a@example.com" };
    vi.mocked(getServerSession).mockResolvedValue({
      session: { id: "sess_A" },
      user: userA,
    } as Awaited<ReturnType<typeof getServerSession>>);
    vi.mocked(prisma.board.findFirst).mockResolvedValue(
      boardFor("user_A", "board_A"),
    );

    const res = await GET(authedRequest("better-auth.session_token=token-a"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.board.id).toBe("board_A");
    expect(body.board.widgets.map((w: { symbol: string }) => w.symbol)).toEqual(
      DEMO_SYMBOLS,
    );
    expect(prisma.board.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_A" } }),
    );
  });

  it("never leaks another user's board across sessions", async () => {
    const userB = { id: "user_B", email: "b@example.com" };
    vi.mocked(getServerSession).mockResolvedValue({
      session: { id: "sess_B" },
      user: userB,
    } as Awaited<ReturnType<typeof getServerSession>>);
    vi.mocked(prisma.board.findFirst).mockResolvedValue(
      boardFor("user_B", "board_B"),
    );

    const res = await GET(authedRequest("better-auth.session_token=token-b"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.board.id).toBe("board_B");
    expect(prisma.board.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_B" } }),
    );
  });
});
