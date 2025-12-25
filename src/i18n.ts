import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

// collect missing keys during QA/runtime
const _missingI18nKeys: Array<{lng: string; ns: string; key: string}> = [];

// i18next expects missingKeyHandler to have the signature:
// (lngs: readonly string[], ns: string, key: string, fallbackValue: string, updateMissing: boolean, options: any) => void
function missingKeyHandler(lngs: readonly string[], ns: string, key: string, _fallbackValue?: string, _updateMissing?: boolean, _options?: any) {
  try {
    const lngStr = Array.isArray(lngs) ? (lngs as string[]).join(',') : String(lngs as any || '');
    const nsStr = String(ns || '');

    _missingI18nKeys.push({lng: lngStr, ns: nsStr, key});
    // expose on window for quick inspection in the browser during QA
    if (typeof window !== 'undefined') {
      // @ts-ignore - attach to window for debugging only
      window.__MISSING_I18N_KEYS__ = window.__MISSING_I18N_KEYS__ || [];
      // @ts-ignore
      window.__MISSING_I18N_KEYS__.push({lng: lngStr, ns: nsStr, key});
    }
    // eslint-disable-next-line no-console
    console.warn('[i18n] missing key', {lng: lngStr, ns: nsStr, key});
  } catch (e) {
    // swallow errors in handler
    // eslint-disable-next-line no-console
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

// Only use the language detector if we don't have a persisted language
const i18nBuilder = initialLang ? i18n : i18n.use(LanguageDetector);

// pass the i18n instance to react-i18next.
i18nBuilder.use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng: 'pt',
    // If an initial language was found in localStorage, use it to initialize i18n.
    // Otherwise, leave i18n to detect the language via LanguageDetector.
    lng: initialLang,
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
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    resources: {
      en: {
        translation: {
          ...en
        }
      },
      es: {
        translation: {
          ...es
        }
      },
      pt: {
        translation: {
          ...pt
        }
      },
      // ensure common Portuguese dialects are available
      'pt-BR': { translation: { ...pt } },
      'pt-PT': { translation: { ...pt } },
    },
    // attach the missing key handler so QA can collect unresolved keys
    missingKeyHandler: missingKeyHandler,
  });

export function getMissingI18nKeys() {
  return _missingI18nKeys.slice();
}

export default i18n;
