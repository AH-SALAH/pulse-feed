import { NextRequest, NextResponse } from "next/server";
import { locales } from "@/lib/i18n/settings";
import { resolveLocale } from "@/lib/i18n/detect";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = (locales as readonly string[]).some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) {
    return NextResponse.next();
  }

  const locale = resolveLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
