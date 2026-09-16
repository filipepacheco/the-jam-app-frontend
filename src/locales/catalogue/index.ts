import {APP_LOCALES, type AppLocale} from '../../lib/i18n/applicationLocale'

export type LocaleValues<T> = Readonly<Record<AppLocale, T>>
export type PluralForm = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'
export type PluralForms = Readonly<Partial<Record<PluralForm, string>> & Pick<Record<PluralForm, string>, 'one' | 'other'>>

export interface MessageLeaf {
  readonly kind: 'message'
  readonly values: LocaleValues<string>
}

export interface PluralLeaf {
  readonly kind: 'plural'
  readonly values: LocaleValues<PluralForms>
}

export type CatalogueLeaf = MessageLeaf | PluralLeaf
export type CatalogueTree = {readonly [key: string]: CatalogueTree | CatalogueLeaf}
export type TranslationResource<T> = T extends CatalogueLeaf
  ? string
  : T extends object
    ? {[K in keyof T]: TranslationResource<T[K]>}
    : never

export type CatalogueKey<T, Prefix extends string = ''> = {
  [Key in keyof T & string]: T[Key] extends CatalogueLeaf
    ? `${Prefix}${Key}`
    : T[Key] extends object
      ? CatalogueKey<T[Key], `${Prefix}${Key}.`>
      : never
}[keyof T & string]

export function message(values: LocaleValues<string>): MessageLeaf {
  return {kind: 'message', values}
}

export function plural(values: LocaleValues<PluralForms>): PluralLeaf {
  return {kind: 'plural', values}
}

function isLeaf(value: CatalogueTree | CatalogueLeaf): value is CatalogueLeaf {
  return 'kind' in value
}

export function collectCatalogueKeys<TCatalogue extends CatalogueTree>(tree: TCatalogue): Array<CatalogueKey<TCatalogue>> {
  const keys: string[] = []

  function visit(node: CatalogueTree, prefix = ''): void {
    for (const [key, value] of Object.entries(node)) {
      const path = prefix ? `${prefix}.${key}` : key
      if (isLeaf(value)) keys.push(path)
      else visit(value, path)
    }
  }

  visit(tree)
  return keys as Array<CatalogueKey<TCatalogue>>
}

function interpolationVariables(value: string): string[] {
  return [...value.matchAll(/{{\s*([\w.]+)(?:\s*,[^}]*)?\s*}}/g)]
    .map((match) => match[1])
    .sort()
}

function variablesMatch(reference: string, candidate: string): boolean {
  return JSON.stringify(interpolationVariables(reference)) === JSON.stringify(interpolationVariables(candidate))
}

export function validateCatalogue(tree: CatalogueTree): string[] {
  const issues: string[] = []

  function visit(node: CatalogueTree, prefix = ''): void {
    for (const [key, value] of Object.entries(node)) {
      const path = prefix ? `${prefix}.${key}` : key
      if (!isLeaf(value)) {
        visit(value, path)
        continue
      }

      if (value.kind === 'message') {
        const reference = value.values['pt-BR']
        for (const locale of APP_LOCALES) {
          const translation = value.values[locale]
          if (typeof translation !== 'string') {
            issues.push(`${path}: ${locale} translation is missing`)
            continue
          }
          if (translation.trim() === '') issues.push(`${path}: ${locale} translation is empty`)
          if (locale !== 'pt-BR' && !variablesMatch(reference, translation)) {
            issues.push(`${path}: interpolation variables differ for ${locale}`)
          }
        }
        continue
      }

      const reference = value.values['pt-BR']
      for (const locale of APP_LOCALES) {
        const forms = value.values[locale]
        if (!forms) {
          issues.push(`${path}: ${locale} plural is missing`)
          continue
        }
        const pluralCategories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories
        const requiredCategories = new Set<PluralForm>(['one', 'other', ...pluralCategories])
        for (const required of requiredCategories) {
          if (typeof forms[required] !== 'string' || forms[required].trim() === '') {
            issues.push(`${path}: ${locale} plural form ${required} is missing or empty`)
          }
        }
        const localeCategories = new Set<string>([
          'zero',
          ...pluralCategories,
        ])
        for (const form of Object.keys(forms) as PluralForm[]) {
          if (!localeCategories.has(form)) {
            issues.push(`${path}: ${locale} plural form ${form} is invalid for this locale`)
          }
          const translation = forms[form]
          const referenceTranslation = reference?.[form]
          if (locale !== 'pt-BR' && translation && referenceTranslation && !variablesMatch(referenceTranslation, translation)) {
            issues.push(`${path}.${form}: interpolation variables differ for ${locale}`)
          }
        }
      }
    }
  }

  visit(tree)
  return issues
}

type I18nextTree = {[key: string]: string | I18nextTree}

function assembleTree(tree: CatalogueTree, locale: AppLocale): I18nextTree {
  const result: I18nextTree = {}

  for (const [key, value] of Object.entries(tree)) {
    if (!isLeaf(value)) {
      result[key] = assembleTree(value, locale)
      continue
    }

    if (value.kind === 'message') {
      result[key] = value.values[locale]
      continue
    }

    for (const [form, translation] of Object.entries(value.values[locale])) {
      result[`${key}_${form}`] = translation
    }
  }

  return result
}

export function assembleResources<TCatalogue extends CatalogueTree>(
  catalogue: TCatalogue,
): Record<AppLocale, {translation: I18nextTree}> {
  return Object.fromEntries(APP_LOCALES.map((locale) => [
    locale,
    {translation: assembleTree(catalogue, locale)},
  ])) as Record<AppLocale, {translation: I18nextTree}>
}
