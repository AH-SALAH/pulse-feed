export function WidgetSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="flex h-full flex-col gap-3 rounded-2xl border border-outline-variant/10 bg-surface-container py-4 px-6"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="widget-skeleton size-8 shrink-0 rounded-xl" />
          <div className="flex flex-col gap-1.5">
            <div className="widget-skeleton h-3 w-16 rounded-full" />
            <div className="widget-skeleton h-2.5 w-12 rounded-full" />
          </div>
        </div>
        <div className="widget-skeleton h-3.5 w-12 rounded-full" />
      </header>

      <div className="flex items-center gap-1.5">
        <div className="widget-skeleton size-2 rounded-full" />
        <div className="widget-skeleton h-2.5 w-16 rounded-full" />
      </div>

      <div className="widget-skeleton h-5 w-24 rounded-full" />

      <div className="flex-1 rounded-xl bg-surface-container-low/50 p-2 -mx-1">
        <div className="widget-skeleton h-16 w-full rounded-lg" />
      </div>

      <footer className="relative">
        <div className="widget-skeleton h-9 w-full rounded-xl" />
      </footer>
    </article>
  );
}
