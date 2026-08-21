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
      <section className="mx-auto w-full max-w-6xl px-margin-mobile pt-16 pb-10 lg:px-margin-desktop lg:pt-24 lg:pb-14">
        <div className="flex flex-col gap-4">
          <div className="animate-hero-in flex items-center gap-2">
            <span className="inline-block h-px w-8 bg-primary" />
            <span className="font-telemetry text-label-caps tracking-wider text-primary">LIVE DATA</span>
          </div>
          <h1 className="animate-hero-in-delay-1 max-w-3xl font-heading text-headline-lg-mobile font-semibold leading-tight tracking-tight text-on-surface lg:text-display-lg whitespace-pre-line">
            {dict.demo.heroTitle}
          </h1>
          <p className="animate-hero-in-delay-2 max-w-2xl font-body text-body-lg leading-relaxed text-on-surface-variant">
            {dict.demo.heroSubtitle}
          </p>
          <div className="animate-hero-in-delay-3">
            <span className="inline-block h-px w-16 bg-gradient-to-r from-primary/60 to-transparent" />
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-margin-mobile pb-8 lg:px-margin-desktop lg:pb-10">
        <Board widgets={data.widgets} />
      </div>

      <footer className="mt-auto border-t border-outline/40 bg-surface-container-low/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-margin-mobile py-6 text-center lg:flex-row lg:px-margin-desktop lg:py-5 lg:text-start">
          <div className="flex items-center gap-3">
            <span className="inline-block h-4 w-px bg-outline-variant/60" />
            <p className="font-body text-body-sm text-on-surface-variant">
              {dict.demo.footerCta.replace("{{year}}", String(new Date().getFullYear()))}
            </p>
          </div>
          <div className="flex items-center gap-5 font-telemetry text-telemetry-sm text-on-surface-variant/80">
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-pulse rounded-full bg-positive opacity-75" />
                <span className="absolute inset-0 rounded-full bg-positive" />
              </span>
              {dict.board.realTimeFeed}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-on-surface-variant/50">{dict.board.latency}</span>
              <span className="text-positive">14ms</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-on-surface-variant/50">{dict.board.uptime}</span>
              <span className="text-positive">99.98%</span>
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}