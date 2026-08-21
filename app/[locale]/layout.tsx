import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { defaultLocale, dir, isLocale, type Locale } from "@/lib/i18n/settings";
import "../globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-telemetry",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic"],
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const title =
    locale === "ar" ? "PulseFeed — لوحة تتبع الأسعار" : "PulseFeed";
  const description =
    locale === "ar"
      ? "لوحة تتبع مباشرة لأسعار العملات الرقمية"
      : "Live cryptocurrency price tracking board";
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    ),
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "PulseFeed",
      locale: locale === "ar" ? "ar_AR" : "en_US",
      type: "website",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;

  return (
    <html
      lang={locale}
      dir={dir(locale)}
      data-locale={locale}
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} ${arabic.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <QueryProvider>
            <I18nProvider locale={locale}>
              {children}
            </I18nProvider>
            <ReactQueryDevtools/>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}