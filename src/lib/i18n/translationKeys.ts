import {catalogue, type TranslationKey} from '../../locales/catalogue/catalogue'
import {collectCatalogueKeys} from '../../locales/catalogue'
import type {TFunction} from 'i18next'

export const DYNAMIC_TRANSLATION_FAMILIES = [
  'feedback.stars',
  'jams.banner',
  'jams.how_it_works',
  'music_library.errors',
  'music_library.feedback',
  'registration.statuses',
  'roles',
  'schedule.instruments',
  'schedule.levels',
  'schedule.statuses',
] as const

export type DynamicTranslationFamily = (typeof DYNAMIC_TRANSLATION_FAMILIES)[number]

const knownTranslationKeys = new Set<TranslationKey>(collectCatalogueKeys(catalogue))

function resolveTranslationKey(family: DynamicTranslationFamily, value: string | number): TranslationKey | undefined {
  const candidate = `${family}.${String(value)}` as TranslationKey
  return knownTranslationKeys.has(candidate) ? candidate : undefined
}

export function translationKey(
  family: DynamicTranslationFamily,
  value: string | number,
  fallback: TranslationKey = 'common.unknown',
): TranslationKey {
  return resolveTranslationKey(family, value) ?? fallback
}

export function translateDynamicValue(
  t: TFunction,
  family: DynamicTranslationFamily,
  value: string | number,
): string {
  const key = resolveTranslationKey(family, value)
  return key ? t(key) : String(value)
}
