import { getServerSession } from "@/lib/auth/session";
import {
  addWidget,
  removeWidget,
  reorderWidgets,
} from "@/lib/boards/service";
import { BoardError } from "@/lib/boards/errors";

function isBoardError(e: unknown): e is BoardError {
  return e instanceof BoardError;
}

export async function POST(request: Request): Promise<Response> {
  const session = await getServerSession(request);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 422 });
  }
  const symbol = (body as { symbol?: unknown } | null)?.symbol;
  if (typeof symbol !== "string" || symbol.trim() === "") {
    return Response.json({ error: "symbol is required" }, { status: 422 });
  }

  try {
    const widget = await addWidget(session.user.id, symbol.trim());
    return Response.json({ widget }, { status: 201 });
  } catch (e) {
    if (isBoardError(e)) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const session = await getServerSession(request);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 422 });
  }
  const widgetId = (body as { widgetId?: unknown } | null)?.widgetId;
  if (typeof widgetId !== "string" || widgetId === "") {
    return Response.json({ error: "widgetId is required" }, { status: 422 });
  }

  try {
    await removeWidget(session.user.id, widgetId);
    return new Response(null, { status: 204 });
  } catch (e) {
    if (isBoardError(e)) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const session = await getServerSession(request);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 422 });
  }
  const order = (body as { order?: unknown } | null)?.order;
  if (
    !Array.isArray(order) ||
    order.some((id) => typeof id !== "string")
  ) {
    return Response.json({ error: "order must be a string array" }, { status: 422 });
  }

  try {
    const board = await reorderWidgets(session.user.id, order);
    return Response.json({ board });
  } catch (e) {
    if (isBoardError(e)) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}