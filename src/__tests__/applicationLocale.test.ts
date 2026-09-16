import {describe, expect, it} from 'vitest'
import {
  formatDateTime,
  normalizeLocale,
  resolveBrowserLocalePreference,
  resolveLocalePreference,
  toOpenGraphLocale,
} from '../lib/i18n/applicationLocale'

describe('application locale boundary', () => {
  it.each([
    ['pt', 'pt-BR'],
    ['pt_BR', 'pt-BR'],
    ['pt-BR', 'pt-BR'],
    ['en-US', 'en'],
    ['es-ES', 'es'],
  ] as const)('normalizes supported locale input %s to %s', (input, expected) => {
    expect(normalizeLocale(input)).toBe(expected)
  })

  it('rejects unsupported locales rather than advertising a fallback catalogue', () => {
    expect(normalizeLocale('pt-PT')).toBeUndefined()
    expect(normalizeLocale('fr')).toBeUndefined()
  })

  it('lets a valid URL override replace the persisted locale', () => {
    expect(resolveLocalePreference({search: '?lng=es', persisted: 'en'})).toEqual({
      locale: 'es',
      source: 'query',
      shouldPersist: true,
    })
  })

  it('persists the valid URL override at the browser boundary', () => {
    const previousUrl = window.location.href
    window.localStorage.setItem('i18nextLng', 'en')
    window.history.replaceState({}, '', '?lng=es')

    expect(resolveBrowserLocalePreference()).toBe('es')
    expect(window.localStorage.getItem('i18nextLng')).toBe('es')

    window.history.replaceState({}, '', previousUrl)
  })

  it('uses a persisted locale before the Brazilian Portuguese default', () => {
    expect(resolveLocalePreference({search: '?lng=fr', persisted: '["en"]'})).toEqual({
      locale: 'en',
      source: 'persisted',
      shouldPersist: false,
    })
    expect(resolveLocalePreference({search: '', persisted: null})).toEqual({
      locale: 'pt-BR',
      source: 'default',
      shouldPersist: false,
    })
  })

  it('owns Intl and metadata locale mapping', () => {
    expect(formatDateTime('2026-09-15T12:00:00Z', 'en', {timeZone: 'UTC'})).toBe('Sep 15, 2026, 12:00 PM')
    expect(formatDateTime('2026-09-15T12:00:00Z', 'en', {month: 'short', day: 'numeric', timeZone: 'UTC'})).toBe('Sep 15')
    expect(toOpenGraphLocale('pt-BR')).toBe('pt_BR')
    expect(toOpenGraphLocale('es')).toBe('es_ES')
  })
})
