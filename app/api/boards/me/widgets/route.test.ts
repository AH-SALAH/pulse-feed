import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, DELETE, PATCH } from "./route";
import { getServerSession } from "@/lib/auth/session";
import {
  addWidget,
  removeWidget,
  reorderWidgets,
} from "@/lib/boards/service";
import { BoardError } from "@/lib/boards/errors";

vi.mock("@/lib/auth/session", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/boards/service", () => ({
  addWidget: vi.fn(),
  removeWidget: vi.fn(),
  reorderWidgets: vi.fn(),
}));

const session = {
  session: { id: "sess_1" },
  user: { id: "user_1", email: "a@example.com" },
} as Awaited<ReturnType<typeof getServerSession>>;

function authedRequest(
  method: string,
  body: unknown,
): Request {
  return new Request("http://localhost:3000/api/boards/me/widgets", {
    method,
    headers: { cookie: "better-auth.session_token=token", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/boards/me/widgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await POST(
      authedRequest("POST", { symbol: "ADAUSDT" }),
    );
    expect(res.status).toBe(401);
    expect(addWidget).not.toHaveBeenCalled();
  });

  it("returns 422 for a malformed body", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);

    const res = await POST(authedRequest("POST", {}));
    expect(res.status).toBe(422);
    expect(addWidget).not.toHaveBeenCalled();
  });

  it("creates a widget with 201 and the user's id derived from the session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    vi.mocked(addWidget).mockResolvedValue({
      id: "widget_ada",
      symbol: "ADAUSDT",
      position: 4,
    });

    const res = await POST(authedRequest("POST", { symbol: "ADAUSDT" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.widget.symbol).toBe("ADAUSDT");
    expect(addWidget).toHaveBeenCalledWith("user_1", "ADAUSDT");
  });

  it("maps WIDGET_CAP to 409", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    vi.mocked(addWidget).mockRejectedValue(
      new BoardError("WIDGET_CAP", "cap"),
    );

    const res = await POST(authedRequest("POST", { symbol: "ADAUSDT" }));
    expect(res.status).toBe(409);
  });
});

describe("DELETE /api/boards/me/widgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await DELETE(
      authedRequest("DELETE", { widgetId: "widget_1" }),
    );
    expect(res.status).toBe(401);
    expect(removeWidget).not.toHaveBeenCalled();
  });

  it("deletes with 204 using the session-derived user id", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    vi.mocked(removeWidget).mockResolvedValue();

    const res = await DELETE(
      authedRequest("DELETE", { widgetId: "widget_1" }),
    );
    expect(res.status).toBe(204);
    expect(removeWidget).toHaveBeenCalledWith("user_1", "widget_1");
  });

  it("maps FORBIDDEN to 403", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    vi.mocked(removeWidget).mockRejectedValue(
      new BoardError("FORBIDDEN", "not yours"),
    );

    const res = await DELETE(
      authedRequest("DELETE", { widgetId: "widget_1" }),
    );
    expect(res.status).toBe(403);
  });

  it("maps WIDGET_NOT_FOUND to 404", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    vi.mocked(removeWidget).mockRejectedValue(
      new BoardError("WIDGET_NOT_FOUND", "missing"),
    );

    const res = await DELETE(
      authedRequest("DELETE", { widgetId: "ghost" }),
    );
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/boards/me/widgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await PATCH(
      authedRequest("PATCH", { order: ["w1", "w2"] }),
    );
    expect(res.status).toBe(401);
    expect(reorderWidgets).not.toHaveBeenCalled();
  });

  it("reorders with 200 and returns the board", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);
    vi.mocked(reorderWidgets).mockResolvedValue({
      id: "board_1",
      name: "My Board",
      widgets: [
        { id: "w2", symbol: "ETHUSDT", position: 0 },
        { id: "w1", symbol: "BTCUSDT", position: 1 },
      ],
    });

    const res = await PATCH(
      authedRequest("PATCH", { order: ["w2", "w1"] }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.board.widgets[0].symbol).toBe("ETHUSDT");
    expect(reorderWidgets).toHaveBeenCalledWith("user_1", ["w2", "w1"]);
  });

  it("returns 422 for an invalid order array", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session);

    const res = await PATCH(authedRequest("PATCH", { order: "not-array" }));
    expect(res.status).toBe(422);
    expect(reorderWidgets).not.toHaveBeenCalled();
  });
});