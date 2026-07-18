import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import { en, mm } from "./locales";

const deviceLanguage = getLocales()[0]?.languageCode ?? "en";

const supportedLanguages = ["en", "mm"];
const defaultLanguage = supportedLanguages.includes(deviceLanguage)
  ? deviceLanguage
  : "en";

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    mm: { translation: mm },
  },
  lng: defaultLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  defaultNS: "translation",
});

export default i18next;
