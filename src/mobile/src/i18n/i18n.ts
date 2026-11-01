import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import { en, my, th, zh, lo, km, vi, ms, id, hi, fil } from "./locales";

const deviceLanguage = (getLocales()[0]?.languageCode ?? "en").toLowerCase();
const normalizedDeviceLanguage = deviceLanguage === "mm" ? "my" : deviceLanguage.split("-")[0];

const supportedLanguages = ["en", "my", "th", "zh", "lo", "km", "vi", "ms", "id", "hi", "fil", "mm"];
const defaultLanguage = supportedLanguages.includes(normalizedDeviceLanguage)
  ? normalizedDeviceLanguage
  : "en";

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    my: { translation: my },
    mm: { translation: my },
    th: { translation: th },
    zh: { translation: zh },
    lo: { translation: lo },
    km: { translation: km },
    vi: { translation: vi },
    ms: { translation: ms },
    id: { translation: id },
    hi: { translation: hi },
    fil: { translation: fil },
  },
  lng: defaultLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  defaultNS: "translation",
});

export default i18next;
