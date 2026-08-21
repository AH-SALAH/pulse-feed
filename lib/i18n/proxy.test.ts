import { describe, it, expect } from "vitest";
import { resolveLocale } from "./detect";
import { defaultLocale } from "./settings";

function requestWith({
  acceptLanguage,
  cookie,
}: {
  acceptLanguage?: string;
  cookie?: string;
}): Request {
  const headers = new Headers();
  if (acceptLanguage) headers.set("accept-language", acceptLanguage);
  if (cookie) headers.set("cookie", cookie);
  return new Request("http://localhost:3000/", { headers });
}

describe("proxy locale resolution", () => {
  it("resolves ar from Accept-Language ar-AE,ar;q=0.9", () => {
    const request = requestWith({ acceptLanguage: "ar-AE,ar;q=0.9" });
    expect(resolveLocale(request)).toBe("ar");
  });

  it("falls back to the default locale with no header", () => {
    const request = requestWith({});
    expect(resolveLocale(request)).toBe(defaultLocale);
  });

  it("cookie wins over the Accept-Language header", () => {
    const request = requestWith({
      acceptLanguage: "en-US,en;q=0.9",
      cookie: "NEXT_LOCALE=ar",
    });
    expect(resolveLocale(request)).toBe("ar");
  });

  it("ignores unsupported locales in the header", () => {
    const request = requestWith({ acceptLanguage: "fr-FR,fr;q=0.9" });
    expect(resolveLocale(request)).toBe(defaultLocale);
  });
});
