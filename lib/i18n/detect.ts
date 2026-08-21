import { defaultLocale, isLocale } from "./settings";

export interface LocaleRequest {
  cookies?: {
    get(name: string): { value?: string } | null | undefined;
  };
  headers?: Headers;
}

export function resolveLocale(request: LocaleRequest): string {
  const cookieHeader = request.headers?.get("cookie") ?? "";
  const cookieLocale = cookieHeader
    .split(";")
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith("NEXT_LOCALE="))
    ?.slice("NEXT_LOCALE=".length);
  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLanguage = request.headers?.get("accept-language");
  if (acceptLanguage) {
    for (const part of acceptLanguage.split(",")) {
      const lang = part.split(";")[0].trim().toLowerCase();
      const base = lang.slice(0, 2);
      if (isLocale(base)) {
        return base;
      }
    }
  }

  return defaultLocale;
}