"use client";

import { useTranslation } from "react-i18next";
import { useParams, usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { locales, type Locale } from "@/lib/i18n/settings";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useParams<{ locale: Locale }>();
  const { data: session } = authClient.useSession();

  async function switchTo(next: Locale) {
    if (next === locale) return;
    // eslint-disable-next-line react-hooks/immutability -- Cookie write via global document, not component state
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    if (session) {
      await fetch("/api/user/locale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      }).catch(() => undefined);
    }
    const rest = pathname.replace(`/${locale}`, "") || "/";
    router.push(`/${next}${rest}`);
    router.refresh();
  }

  return (
    <div
      data-testid="language-switcher"
      role="group"
      aria-label={t("language.label")}
      className="flex items-center rounded-full bg-surface-container-high p-1"
    >
      {locales.map((l) => {
        const label = l === "ar" ? "AR" : "EN";
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => void switchTo(l)}
            aria-pressed={active}
            className={`rounded-full px-3 py-1 font-label text-label-caps transition-colors ${
              active
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}