export const APP_LOCALES = ['pt-BR', 'en', 'es'] as const
export const LEGACY_LOCALE_ALIASES = ['pt'] as const

export type AppLocale = (typeof APP_LOCALES)[number]

export const LANGUAGE_STORAGE_KEY = 'i18nextLng'

export interface LocalePreferenceInput {
  search: string
  persisted: string | null
}

export interface LocalePreference {
  locale: AppLocale
  source: 'query' | 'persisted' | 'default'
  shouldPersist: boolean
}

export function normalizeLocale(input: unknown): AppLocale | undefined {
  if (typeof input !== 'string') return undefined

  const normalized = input.trim().replaceAll('_', '-').toLowerCase()
  if (normalized === 'pt' || normalized === 'pt-br') return 'pt-BR'
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en'
  if (normalized === 'es' || normalized.startsWith('es-')) return 'es'
  return undefined
}

function unwrapPersistedLocale(value: string | null): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()

  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (Array.isArray(parsed)) return typeof parsed[0] === 'string' ? parsed[0] : undefined
    if (typeof parsed === 'string') return parsed
  } catch {
    // Older versions stored a plain locale rather than JSON.
  }

  return trimmed
}

export function resolveLocalePreference({search, persisted}: LocalePreferenceInput): LocalePreference {
  const queryLocale = normalizeLocale(new URLSearchParams(search).get('lng'))
  if (queryLocale) return {locale: queryLocale, source: 'query', shouldPersist: true}

  const persistedLocale = normalizeLocale(unwrapPersistedLocale(persisted))
  if (persistedLocale) return {locale: persistedLocale, source: 'persisted', shouldPersist: false}

  return {locale: 'pt-BR', source: 'default', shouldPersist: false}
}

export function resolveBrowserLocalePreference(): AppLocale {
  if (typeof window === 'undefined') return 'pt-BR'

  let persisted: string | null = null
  try {
    persisted = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  } catch {
    // Storage can be unavailable in private browsing or embedded contexts.
  }

  const preference = resolveLocalePreference({search: window.location.search, persisted})
  if (preference.shouldPersist) persistLocale(preference.locale)
  return preference.locale
}

export function persistLocale(locale: AppLocale): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale)
  } catch {
    // The in-memory i18next language remains authoritative for this session.
  }
}

export function syncDocumentLocale(locale: AppLocale): void {
  if (typeof document !== 'undefined') document.documentElement.lang = locale
}

export function toOpenGraphLocale(locale: AppLocale): 'pt_BR' | 'en_US' | 'es_ES' {
  if (locale === 'pt-BR') return 'pt_BR'
  return locale === 'es' ? 'es_ES' : 'en_US'
}

export function formatDateTime(
  value: string | number | Date,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const componentOptions: Array<keyof Intl.DateTimeFormatOptions> = [
    'weekday', 'era', 'year', 'month', 'day', 'dayPeriod', 'hour', 'minute', 'second', 'fractionalSecondDigits',
  ]
  const hasExplicitComponents = componentOptions.some((option) => options[option] !== undefined)
  const resolvedOptions = hasExplicitComponents
    ? options
    : {dateStyle: 'medium', timeStyle: 'short', ...options} satisfies Intl.DateTimeFormatOptions

  return new Intl.DateTimeFormat(locale, resolvedOptions).format(new Date(value))
}

export function formatDate(
  value: string | number | Date,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions = {dateStyle: 'medium'},
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(value))
}

export function formatNumber(
  value: number,
  locale: AppLocale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}
