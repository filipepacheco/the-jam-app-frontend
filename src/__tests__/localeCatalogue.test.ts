import {describe, expect, it} from 'vitest'
import {assembleResources, message, plural, validateCatalogue} from '../locales/catalogue'

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
})
