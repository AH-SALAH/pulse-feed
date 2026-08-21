import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import BoardClient from "@/components/board/BoardClient";
import { BoardSidebar } from "@/components/board/BoardSidebar";
import { BoardHeader } from "@/components/board/BoardHeader";
import { BoardFooter } from "@/components/board/BoardFooter";
import type { BoardDTO } from "@/lib/boards/types";

export const dynamic = "force-dynamic";

interface BoardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { locale } = await params;
  const h = await headers();
  const request = new Request("http://localhost", { headers: h });
  const session = await getServerSession(request);

  if (!session) {
    redirect(`/${locale}/sign-in`);
  }

  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const res = await fetch(`${proto}://${host}/api/boards/me`, {
    headers: { cookie: h.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Personal board endpoint failed with status ${res.status}`);
  }
  const data = (await res.json()) as { board: BoardDTO };

  return (
    <div className="flex min-h-screen flex-col">
      <BoardSidebar locale={locale} />
      <BoardHeader locale={locale} />
      <main className="flex-1 pb-14">
        <div className="px-margin-mobile py-6 lg:px-margin-desktop">
          <BoardClient widgets={data.board.widgets} editable />
        </div>
      </main>
      <BoardFooter />
    </div>
  );
}