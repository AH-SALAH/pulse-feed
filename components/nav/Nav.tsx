"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  LuActivity,
  LuLayoutGrid,
  LuLogIn,
  LuLogOut,
  LuMenu,
  LuX,
} from "react-icons/lu";
import { authClient } from "@/lib/auth/client";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "@/components/brand/Logo";

export function Nav() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const { data: session } = authClient.useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  async function handleSignOut() {
    setMenuOpen(false);
    await authClient.signOut();
    router.push(`/${locale}`);
    router.refresh();
  }

  function closeMenu() {
    setMenuOpen(false);
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

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 64rem)");
    function handleChange(event: MediaQueryListEvent) {
      if (event.matches) setMenuOpen(false);
    }
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const navLinkClass =
    "inline-flex items-center gap-1.5 font-body text-body-md text-on-surface-variant hover:text-on-surface transition-colors";
  const signInClass =
    "inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-body text-body-md font-medium text-on-primary transition hover:bg-primary-container/80 h-[40px]";

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-20 border-b border-outline bg-surface-container-low/80 backdrop-blur"
    >
      <nav
        aria-label={t("nav.menuLabel")}
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-margin-mobile lg:px-margin-desktop"
      >
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-heading text-headline-md font-semibold text-on-surface"
        >
          <Logo />
          <span className="sr-only">{t('page.pulseFeed')}</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href={`/${locale}`}
              className={navLinkClass}
            >
              <LuActivity aria-hidden="true" className="size-4" />
              {t("nav.demo")}
            </Link>
            <Link
              href={`/${locale}/board`}
              className={navLinkClass}
            >
              <LuLayoutGrid aria-hidden="true" className="size-4" />
              {t("nav.myBoard")}
            </Link>
          </div>

          <LanguageSwitcher />
          <ThemeToggle />

          {session ? (
            <button
              type="button"
              data-testid="sign-out"
              onClick={handleSignOut}
              className={`${navLinkClass} max-lg:hidden cursor-pointer`}
            >
              <LuLogOut aria-hidden="true" className="size-4" />
              {t("auth.signOut")}
            </button>
          ) : (
            <Link
              href={`/${locale}/sign-in`}
              className={`${signInClass} max-lg:hidden`}
            >
              <LuLogIn aria-hidden="true" className="size-4" />
              {t("auth.signIn")}
            </Link>
          )}

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-on-surface transition-colors hover:border-primary hover:bg-surface-container-high lg:hidden"
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <LuX aria-hidden="true" className="size-5" />
            ) : (
              <LuMenu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div
          id="mobile-nav-menu"
          ref={panelRef}
          className="absolute inset-x-0 top-full border-b border-outline bg-surface-container-low/95 backdrop-blur lg:hidden"
          role="menu"
          aria-label={t("nav.menuLabel")}
        >
          <div className="mx-auto max-w-6xl px-margin-mobile py-2">
            <Link
              href={`/${locale}`}
              role="menuitem"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-3 font-body text-body-md text-on-surface transition-colors hover:bg-surface-container"
            >
              <LuActivity aria-hidden="true" className="size-4 text-on-surface-variant" />
              {t("nav.demo")}
            </Link>
            <Link
              href={`/${locale}/board`}
              role="menuitem"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-3 font-body text-body-md text-on-surface transition-colors hover:bg-surface-container"
            >
              <LuLayoutGrid aria-hidden="true" className="size-4 text-on-surface-variant" />
              {t("nav.myBoard")}
            </Link>
            <div role="separator" className="my-1 h-px bg-outline-variant" />
            {session ? (
              <button
                type="button"
                role="menuitem"
                data-testid="sign-out"
                onClick={handleSignOut}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-start font-body text-body-md text-on-surface transition-colors hover:bg-surface-container"
              >
                <LuLogOut aria-hidden="true" className="size-4 text-on-surface-variant" />
                {t("auth.signOut")}
              </button>
            ) : (
              <Link
                href={`/${locale}/sign-in`}
                role="menuitem"
                onClick={closeMenu}
                className="mt-1 flex h-[40px] items-center justify-center gap-2 rounded-full bg-primary px-4 font-body text-body-md font-medium text-on-primary transition hover:bg-primary-container/80"
              >
                <LuLogIn aria-hidden="true" className="size-4" />
                {t("auth.signIn")}
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}