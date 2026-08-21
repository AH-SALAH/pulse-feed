import en from "../../locales/en/common.json";
import ar from "../../locales/ar/common.json";

const dictionaries = { en, ar } as const;

export type Dict = typeof en;

export function getDictionary(locale: string): Dict {
  return (locale === "ar" ? ar : en) as unknown as Dict;
}

export const dictionariesList = dictionaries;