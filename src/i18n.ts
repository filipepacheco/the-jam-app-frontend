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

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng: 'pt',
    lng: 'pt',
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
      }
    },
    // attach the missing key handler so QA can collect unresolved keys
    missingKeyHandler: missingKeyHandler,
  });

export function getMissingI18nKeys() {
  return _missingI18nKeys.slice();
}

export default i18n;
