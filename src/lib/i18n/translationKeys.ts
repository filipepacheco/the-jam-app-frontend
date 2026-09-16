import {catalogue, type TranslationKey} from '../../locales/catalogue/catalogue'

export const DYNAMIC_TRANSLATION_FAMILIES = [
  'feedback.stars',
  'jams.banner',
  'jams.how_it_works',
  'music_library.errors',
  'music_library.feedback',
  'registration.statuses',
  'schedule.instruments',
  'schedule.levels',
  'schedule.statuses',
] as const

export type DynamicTranslationFamily = (typeof DYNAMIC_TRANSLATION_FAMILIES)[number]

function collectKeys(node: object, prefix = ''): TranslationKey[] {
  const keys: TranslationKey[] = []
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && 'kind' in value) {
      keys.push(path as TranslationKey)
    } else if (value && typeof value === 'object') {
      keys.push(...collectKeys(value, path))
    }
  }
  return keys
}

const knownTranslationKeys = new Set<TranslationKey>(collectKeys(catalogue))

export function translationKey(
  family: DynamicTranslationFamily,
  value: string | number,
  fallback: TranslationKey = 'common.unknown',
): TranslationKey {
  const candidate = `${family}.${String(value)}` as TranslationKey
  return knownTranslationKeys.has(candidate) ? candidate : fallback
}
