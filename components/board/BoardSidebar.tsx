"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LuGripHorizontal } from "react-icons/lu";
import { boardNavItems } from "./nav-items";
import { useDraggableSidebar } from "@/lib/hooks/use-draggable-sidebar";
import { SIDEBAR_STORAGE_KEY } from "@/lib/ui/sidebar-position";

export function BoardSidebar({ locale }: { locale: string }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { ref, isDragging, side, handleProps } = useDraggableSidebar({
    storageKey: SIDEBAR_STORAGE_KEY,
  });

  const tooltipClass = `pointer-events-none absolute whitespace-nowrap rounded-[0.5rem] border border-surface-container-highest bg-surface-container-highest px-3 py-1.5 text-xs font-medium text-on-surface opacity-0 invisible transition-all group-hover:opacity-100 group-hover:visible group-focus-visible:opacity-100 group-focus-visible:visible motion-reduce:transition-none ${
    side === "left" ? "left-14" : "right-14"
  }`;

  return (
    <aside
      ref={ref}
      className="fixed left-0 top-0 z-50 hidden will-change-transform lg:block"
      aria-label={t("nav.appMenu")}
    >
      <nav
        aria-label={t("nav.appMenu")}
        className="flex flex-col gap-4 rounded-2xl border border-outline/30 bg-surface-container-low/80 p-3 shadow-lg shadow-black/10 backdrop-blur-xl"
      >
        <button
          type="button"
          {...handleProps}
          className={`flex h-6 w-full !cursor-grab touch-none select-none items-center justify-center rounded-[0.5rem] text-on-surface-variant/40 transition-all hover:bg-surface-container-high hover:text-primary focus-visible:text-primary ${
            isDragging ? "!cursor-grabbing bg-primary/10 text-primary" : ""
          }`}
          aria-label={t("nav.moveHandle")}
          title={t("nav.moveHandle")}
        >
          <LuGripHorizontal aria-hidden="true" className="size-4" />
        </button>
        {boardNavItems.map((item) => {
          const href = `/${locale}${item.href}`;
          const isActive =
            pathname === href || (item.href !== "/" && pathname.startsWith(href));
          const label = t(`nav.${item.key}`);
          if(!item.active) {
            return <button key={item.key}            className={`group relative flex size-12 cursor-pointer items-center justify-center rounded-[0.75rem] transition-all ${
                isActive
                  ? "border border-primary/20 bg-primary-container/20 text-primary"
                  : "border border-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
              } disabled:opacity-50`} disabled>
                <item.icon aria-hidden="true" className="size-5" />
              <span
                aria-hidden="true"
                className={tooltipClass}
              >
                {label}
              </span>
            </button>;
          }
          return (
            <Link
              key={item.key}
              href={href}
              className={`group relative flex size-12 cursor-pointer items-center justify-center rounded-[0.75rem] transition-all
                ${isActive
                  ? "sidebar-active-glow border border-primary/20 bg-primary-container/20 text-primary shadow-sm shadow-primary/10"
                  : "border border-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
              }`}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
            >
              <item.icon aria-hidden="true" className="size-5" />
              <span
                aria-hidden="true"
                className={tooltipClass}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}