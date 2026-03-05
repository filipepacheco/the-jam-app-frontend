import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

// collect missing keys during QA/runtime
const _missingI18nKeys: Array<{lng: string; ns: string; key: string}> = [];

// i18next expects missingKeyHandler to have the signature:
// (lngs: readonly string[], ns: string, key: string, fallbackValue: string, updateMissing: boolean, options: Record<string, unknown>) => void
function missingKeyHandler(
  lngs: readonly string[],
  ns: string,
  key: string,
  _fallbackValue?: string,
  _updateMissing?: boolean,
  _options?: Record<string, unknown>
) {
  try {
    const lngStr = Array.isArray(lngs) ? (lngs as string[]).join(',') : String(lngs || '');
    const nsStr = String(ns || '');

    _missingI18nKeys.push({lng: lngStr, ns: nsStr, key});
    // expose on window for quick inspection in the browser during QA
    if (typeof window !== 'undefined') {
      // @ts-expect-error - attach to window for debugging only
      window.__MISSING_I18N_KEYS__ = window.__MISSING_I18N_KEYS__ || [];
      // @ts-expect-error - Custom window property for QA debugging
      window.__MISSING_I18N_KEYS__.push({lng: lngStr, ns: nsStr, key});
    }
     
    console.warn('[i18n] missing key', {lng: lngStr, ns: nsStr, key});
  } catch (e) {
    // swallow errors in handler
     
    console.warn('[i18n] missing key handler error', e);
  }
}

// Determine if the user already selected a language and stored it in localStorage.
// If so, initialize i18n with that language so the LanguageDetector doesn't override it on reload.
let initialLang: string | undefined = undefined;
try {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('i18nextLng');
    if (raw) {
      const trimmed = raw.trim();
      if (trimmed.startsWith('[')) {
        try {
          const arr = JSON.parse(trimmed);
          if (Array.isArray(arr) && arr.length > 0) initialLang = String(arr[0]);
        } catch (e) {
          // ignore parse error and fall back to raw
          initialLang = trimmed;
        }
      } else if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        initialLang = trimmed.slice(1, -1);
      } else {
        initialLang = trimmed;
      }
      // normalize to use hyphenated form where appropriate (e.g., pt-BR)
      if (initialLang) initialLang = initialLang.replace('_', '-');
    }
  }
} catch (e) {
  // ignore storage access errors
}

// Always use the language detector so querystring (?lng=en) works,
// but default to Portuguese when no explicit choice exists.
const i18nBuilder = i18n.use(LanguageDetector);

// pass the i18n instance to react-i18next.
i18nBuilder.use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng: {
      'pt-BR': ['pt'],
      'pt-PT': ['pt'],
      default: ['pt'],
    },
    // Use persisted language if available; otherwise let detection run
    // (localStorage > querystring). If nothing is found, default to Portuguese.
    lng: initialLang || undefined,
    debug: import.meta.env.DEV,

    ns: ['translation'],
    defaultNS: 'translation',
    keySeparator: '.', // ensure dot-separated keys are parsed as nested lookups
    returnObjects: true,

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    react: {
      useSuspense: false,
    },
    detection: {
      // Portuguese is the default (via fallbackLng). Only override if user
      // explicitly chose a language (localStorage) or via URL param (?lng=en).
      // Navigator is intentionally excluded so crawlers and first-time visitors
      // see Portuguese content (target audience is Brazilian).
      order: ['localStorage', 'querystring'],
      lookupQuerystring: 'lng',
      caches: ['localStorage'],
    },
    resources: {
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
      // pt-BR and pt-PT fall back to pt via fallbackLng config above
    },
    // attach the missing key handler so QA can collect unresolved keys
    missingKeyHandler: missingKeyHandler,
  });

export default i18n;
