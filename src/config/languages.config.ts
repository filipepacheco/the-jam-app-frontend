/**
 * Language configuration
 * Centralized list of supported languages
 */
import type {AppLocale} from '../lib/i18n/applicationLocale'

export const SUPPORTED_LANGUAGES = [
  {code: 'en', label: 'EN', nameKey: 'common.language_names.english'},
  {code: 'es', label: 'ES', nameKey: 'common.language_names.spanish'},
  {code: 'pt-BR', label: 'PT', nameKey: 'common.language_names.brazilian_portuguese'},
] as const satisfies ReadonlyArray<{code: AppLocale; label: string; nameKey: string}>
