import en from "../../locales/en/common.json";
import ar from "../../locales/ar/common.json";

type PageKey = "demoTitle" | "boardTitle";

export function pageTitle(locale: string, key: PageKey): string {
  return (locale === "ar" ? ar : en).page[key];
}