/**
 * Language configuration
 * Centralized list of supported languages
 */
import {APP_LOCALES, type AppLocale} from '../lib/i18n/applicationLocale'
import type {TranslationKey} from '../locales/catalogue/catalogue'

interface LanguageMetadata {
  label: string
  nameKey: TranslationKey
}

const LANGUAGE_METADATA = {
  'pt-BR': {label: 'PT', nameKey: 'common.language_names.brazilian_portuguese'},
  en: {label: 'EN', nameKey: 'common.language_names.english'},
  es: {label: 'ES', nameKey: 'common.language_names.spanish'},
} as const satisfies Record<AppLocale, LanguageMetadata>

export const SUPPORTED_LANGUAGES = APP_LOCALES.map((code) => ({
  code,
  ...LANGUAGE_METADATA[code],
}))
