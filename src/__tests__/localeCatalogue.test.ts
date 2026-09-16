import {describe, expect, it} from 'vitest'
import type {TFunction} from 'i18next'
import {assembleResources, message, plural, validateCatalogue} from '../locales/catalogue'
import {translateDynamicValue} from '../lib/i18n/translationKeys'

describe('key-first locale catalogue', () => {
  it('assembles messages and plural forms into the existing i18next namespace', () => {
    const resources = assembleResources({
      common: {
        greeting: message({'pt-BR': 'Olá, {{name}}', en: 'Hello, {{name}}', es: 'Hola, {{name}}'}),
        item_count: plural({
          'pt-BR': {one: '{{count}} item', other: '{{count}} itens'},
          en: {one: '{{count}} item', other: '{{count}} items'},
          es: {one: '{{count}} elemento', other: '{{count}} elementos'},
        }),
      },
    })

    expect(resources.en.translation).toEqual({
      common: {
        greeting: 'Hello, {{name}}',
        item_count_one: '{{count}} item',
        item_count_other: '{{count}} items',
      },
    })
    expect(resources['pt-BR'].translation.common.greeting).toBe('Olá, {{name}}')
  })

  it('reports empty translations and incompatible interpolation variables', () => {
    const issues = validateCatalogue({
      greeting: message({'pt-BR': 'Olá, {{name}}', en: 'Hello, {{person}}', es: ''}),
    })

    expect(issues).toEqual([
      'greeting: interpolation variables differ for en',
      'greeting: es translation is empty',
      'greeting: interpolation variables differ for es',
    ])
  })

  it('rejects plural categories that the locale does not use', () => {
    const issues = validateCatalogue({
      item_count: plural({
        'pt-BR': {one: '{{count}} item', other: '{{count}} itens'},
        en: {one: '{{count}} item', few: '{{count}} items', other: '{{count}} items'},
        es: {one: '{{count}} elemento', other: '{{count}} elementos'},
      }),
    })

    expect(issues).toContain('item_count: en plural form few is invalid for this locale')
  })

  it('requires every plural category that a locale can select', () => {
    const issues = validateCatalogue({
      item_count: plural({
        'pt-BR': {one: '{{count}} item', other: '{{count}} itens'},
        en: {one: '{{count}} item', other: '{{count}} items'},
        es: {one: '{{count}} elemento', other: '{{count}} elementos'},
      }),
    })

    expect(issues).toContain('item_count: pt-BR plural form many is missing or empty')
    expect(issues).toContain('item_count: es plural form many is missing or empty')
  })

  it('preserves an unknown dynamic value instead of replacing it with generic copy', () => {
    const t = ((key: string) => `translated:${key}`) as unknown as TFunction

    expect(translateDynamicValue(t, 'schedule.instruments', 'theremin')).toBe('theremin')
    expect(translateDynamicValue(t, 'schedule.instruments', 'vocals')).toBe(
      'translated:schedule.instruments.vocals',
    )
  })
})
