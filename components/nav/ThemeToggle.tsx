"use client";

import { useTheme } from "@teispace/next-themes";
import { useEffect, useState } from "react";
import { LuMoon, LuSun } from "react-icons/lu";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- Standard hydration guard pattern
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="inline-flex items-center justify-center size-8 rounded-full border border-outline-variant bg-surface-container text-on-surface-variant cursor-pointer disabled:opacity-50"
        disabled
        aria-label="Toggle theme"
      >
        <LuSun className="size-4" aria-hidden="true" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center justify-center size-8 rounded-full border border-outline-variant bg-surface-container text-on-surface transition-colors hover:border-primary hover:bg-surface-container-high focus:outline-none focus:ring-0 focus:border-primary"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <LuSun className="size-5 text-secondary" aria-hidden="true" />
      ) : (
        <LuMoon className="size-5 text-primary" aria-hidden="true" />
      )}
    </button>
  );
}