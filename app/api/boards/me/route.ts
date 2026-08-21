import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { BoardDTO } from "@/lib/boards/types";

export async function GET(request: Request): Promise<Response> {
  const session = await getServerSession(request);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const board = await prisma.board.findFirst({
    where: { userId: session.user.id },
    include: { widgets: { orderBy: { position: "asc" } } },
  });
  if (!board) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body: BoardDTO = {
    id: board.id,
    name: board.name,
    widgets: board.widgets.map((w) => ({
      id: w.id,
      symbol: w.symbol,
      position: w.position,
    })),
  };

  return Response.json({ board: body });
}
