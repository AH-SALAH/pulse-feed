"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { LanguageSwitcher } from "@/components/nav/LanguageSwitcher";
import { ThemeToggle } from "@/components/nav/ThemeToggle";
import { Logo } from "@/components/brand/Logo";
import { LuLogOut, LuMenu, LuUser, LuX } from "react-icons/lu";
import { boardNavItems } from "./nav-items";

export function BoardHeader({ locale }: { locale: string }) {
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleSignOut() {
    setMenuOpen(false);
    await authClient.signOut();
    router.push(`/${locale}`);
    router.refresh();
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      panelRef.current
        ?.querySelector<HTMLElement>("[role='menuitem']")
        ?.focus();
    }
  }, [menuOpen]);

  const itemLinkClass =
    "flex items-center gap-3 rounded-xl px-3 py-3 font-body text-body-md text-on-surface transition-colors hover:bg-surface-container";

  return (
    <div
      ref={headerRef}
      role="region"
      aria-label={t("board.headerLabel")}
      className="sticky top-0 z-20 border-b border-outline/50 backdrop-blur-xl"
    >
      <div className="flex h-14 items-center justify-between gap-4 px-margin-mobile lg:px-margin-desktop">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <Logo />
            <span className="sr-only">{t('page.pulseFeed')}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <div className="hidden items-center gap-3 lg:flex">
              <span className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-1.5 font-body text-body-sm text-on-surface-variant">
                <LuUser aria-hidden="true" className="size-3.5 text-secondary" />
                {user.name ?? user.email}
              </span>
              <button
                type="button"
                data-testid="sign-out"
                onClick={handleSignOut}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-body text-body-sm text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
              >
                <LuLogOut aria-hidden="true" className="size-3.5" />
                {t("auth.signOut")}
              </button>
            </div>
          ) : null}

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-outline-variant/60 bg-surface-container text-on-surface transition-all hover:border-primary/50 hover:bg-surface-container-high hover:text-primary lg:hidden"
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={menuOpen}
            aria-controls="board-mobile-nav-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <LuX aria-hidden="true" className="size-5" />
            ) : (
              <LuMenu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="board-mobile-nav-menu"
          ref={panelRef}
          className="absolute inset-x-0 top-full z-10 border-b border-outline/50 bg-surface-container-low/95 shadow-lg shadow-black/20 backdrop-blur-xl animate-popover-in lg:hidden"
          role="menu"
          aria-label={t("nav.menuLabel")}
        >
          <div className="mx-auto max-w-6xl px-margin-mobile py-2">
            {boardNavItems.map((item) => {
              const href = `/${locale}${item.href}`;
              const isActive =
                pathname === href || (item.href !== "/" && pathname.startsWith(href));
              const label = t(`nav.${item.key}`);
              if(!item.active) {
                return <button key={item.key} className={itemLinkClass + " disabled:opacity-50"} disabled>
                  <item.icon aria-hidden="true" className="size-4 text-on-surface-variant" />
                  {label}
                </button>;
              }
              return (
                <Link
                  key={item.key}
                  href={`/${locale}${item.href}`}
                  role="menuitem"
                  onClick={closeMenu}
                  className={itemLinkClass + ` ${isActive
                    ? "border border-primary/20 bg-primary-container/20 text-primary"
                    : "border border-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                  }`}
                >
                  <item.icon aria-hidden="true" className="size-4 text-secondary" />
                  {label}
                </Link>
              );
            })}
            <div role="separator" className="my-2 h-px bg-outline-variant/50" />
            <button
              type="button"
              role="menuitem"
              data-testid="sign-out"
              onClick={handleSignOut}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-start font-body text-body-md text-on-surface transition-colors hover:bg-surface-container-high"
            >
              <LuLogOut aria-hidden="true" className="size-4 text-on-surface-variant" />
              {t("auth.signOut")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}