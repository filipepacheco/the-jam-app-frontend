import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import {assembleResources} from './locales/catalogue'
import {catalogue} from './locales/catalogue/catalogue'
import {
  normalizeLocale,
  persistLocale,
  resolveBrowserLocalePreference,
  syncDocumentLocale,
} from './lib/i18n/applicationLocale'

const missingI18nKeys: Array<{lng: string; ns: string; key: string}> = []

function missingKeyHandler(lngs: readonly string[], ns: string, key: string) {
  try {
    const lng = Array.isArray(lngs) ? lngs.join(',') : String(lngs || '')
    const entry = {lng, ns: String(ns || ''), key}
    missingI18nKeys.push(entry)

    if (typeof window !== 'undefined') {
      const diagnosticsWindow = window as typeof window & {
        __MISSING_I18N_KEYS__?: Array<{lng: string; ns: string; key: string}>
      }
      diagnosticsWindow.__MISSING_I18N_KEYS__ ??= []
      diagnosticsWindow.__MISSING_I18N_KEYS__.push(entry)
    }

    console.warn('[i18n] missing key', entry)
  } catch (error) {
    console.warn('[i18n] missing key handler error', error)
  }
}

const initialLocale = resolveBrowserLocalePreference()

void i18n
  .use(initReactI18next)
  .init({
    lng: initialLocale,
    fallbackLng: {
      pt: ['pt-BR'],
      default: ['pt-BR'],
    },
    supportedLngs: ['pt-BR', 'en', 'es', 'pt'],
    load: 'currentOnly',
    debug: import.meta.env.DEV,
    ns: ['translation'],
    defaultNS: 'translation',
    keySeparator: '.',
    returnObjects: false,
    interpolation: {escapeValue: false},
    react: {useSuspense: false},
    resources: assembleResources(catalogue),
    missingKeyHandler,
  })

syncDocumentLocale(initialLocale)

i18n.on('languageChanged', (input) => {
  const locale = normalizeLocale(input)
  if (!locale) return
  persistLocale(locale)
  syncDocumentLocale(locale)
})

export default i18n
