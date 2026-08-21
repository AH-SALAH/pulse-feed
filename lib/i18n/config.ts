import { createInstance, type i18n as I18n } from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import enCommon from "../../locales/en/common.json";
import arCommon from "../../locales/ar/common.json";
import { defaultLocale, locales, type Locale } from "./settings";

const resources = {
  en: { common: enCommon },
  ar: { common: arCommon },
};

export function createI18n(locale: Locale): I18n {
  const instance = createInstance();
  void instance
    .use(initReactI18next)
    .use(
      resourcesToBackend((lng: string, ns: string) => import(`../../locales/${lng}/${ns}.json`)),
    )
    .use(LanguageDetector)
    .init({
      lng: locale,
      fallbackLng: defaultLocale,
      supportedLngs: [...locales],
      resources,
      ns: ["common"],
      defaultNS: "common",
      detection: {
        order: ["cookie", "navigator"],
        lookupCookie: "NEXT_LOCALE",
        caches: ["cookie"],
      },
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
  return instance;
}