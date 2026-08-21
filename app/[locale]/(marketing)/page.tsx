import { headers } from "next/headers";
// import Link from "next/link";
import Board from "@/components/board/Board";
import { getDictionary } from "@/lib/i18n/server";
import type { WidgetDTO } from "@/lib/boards/types";

export const dynamic = "force-dynamic";

export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const res = await fetch(`${proto}://${host}/api/boards/public/demo`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Demo board endpoint failed with status ${res.status}`);
  }
  const data = (await res.json()) as { widgets: WidgetDTO[] };
  return (
    <main className="bg-atmosphere flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-6xl px-margin-mobile pt-12 pb-8 lg:px-margin-desktop lg:pt-20 lg:pb-12">
        <h1 className="mx-auto text-start font-heading text-headline-lg-mobile text-on-surface lg:text-display-lg">
          {dict.demo.heroTitle}
        </h1>
        <p className="mx-auto mt-3 text-start font-body text-body-lg text-on-surface-variant">
          {dict.demo.heroSubtitle}
        </p>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-margin-mobile pb-6 lg:px-margin-desktop lg:pb-8">
        <Board widgets={data.widgets} />
      </div>

      <footer className="mt-auto border-t border-outline bg-surface-container-low/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-margin-mobile py-6 text-center lg:flex-row lg:px-margin-desktop lg:py-4 lg:text-start">
          <div className="flex items-center gap-3">
            <p className="font-body text-body-md text-on-surface">
              {dict.demo.footerCta.replace("{{year}}", String(new Date().getFullYear()))}
            </p>
          </div>
          <div className="flex items-center gap-4 font-telemetry text-telemetry-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-pulse rounded-full bg-positive opacity-75" />
                <span className="absolute inset-0 rounded-full bg-positive" />
              </span>
              {dict.board.realTimeFeed}
            </span>
            <span>
              {dict.board.latency}: 14ms
            </span>
            <span>
              {dict.board.uptime}: 99.98%
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}