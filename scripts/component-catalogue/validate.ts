import path from 'node:path'

import {
  AUDIT_STATUSES,
  CATALOGUE_CATEGORIES,
  CATALOGUE_LAYERS,
  COMPONENT_LIFECYCLES,
  PRODUCT_AREAS,
  VIEWPORT_CONTEXTS,
  WORKBENCH_READINESS,
} from '../../src/types/componentCatalogue.types.ts'
import type {
  CatalogueConfig,
  CatalogueMetadataConfig,
  ComponentMetadata,
} from '../../src/types/componentCatalogue.types.ts'

const STABLE_ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/
const GLOB_CHARACTERS = /[*?[]/

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isNonBlankString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const validateEnum = (
  value: unknown,
  values: readonly string[],
  field: string,
  diagnostics: string[],
): void => {
  if (typeof value !== 'string') diagnostics.push(`${field}: expected a string`)
  else if (!values.includes(value)) diagnostics.push(`${field}: invalid value "${value}"`)
}

const validateStringArray = (
  value: unknown,
  field: string,
  diagnostics: string[],
  allowed?: readonly string[],
): void => {
  if (!Array.isArray(value)) {
    diagnostics.push(`${field}: expected an array`)
    return
  }
  value.forEach((item, index) => {
    if (typeof item !== 'string') diagnostics.push(`${field}[${index}]: expected a string`)
    else if (!item.trim()) diagnostics.push(`${field}[${index}]: value must be non-blank`)
    else if (allowed && !allowed.includes(item)) diagnostics.push(`${field}[${index}]: invalid value "${item}"`)
  })
}

export const isExactSource = (source: string): boolean => !GLOB_CHARACTERS.test(source)

export const isSafeRelativePath = (value: unknown): value is string => {
  if (!isNonBlankString(value) || value.includes('\\')) return false
  if (path.posix.isAbsolute(value) || path.posix.normalize(value) !== value) return false
  return value !== '..' && !value.startsWith('../') && !value.split('/').includes('..')
}

const validateMetadataShape = (
  value: unknown,
  field: string,
  candidateFamilies: readonly string[],
  diagnostics: string[],
  partial: boolean,
): void => {
  if (!isRecord(value)) {
    diagnostics.push(`${field}: expected an object`)
    return
  }
  const validatePresentEnum = (key: string, allowed: readonly string[]): void => {
    if (!partial || key in value) validateEnum(value[key], allowed, `${field}.${key}`, diagnostics)
  }
  validatePresentEnum('category', CATALOGUE_CATEGORIES)
  validatePresentEnum('layer', CATALOGUE_LAYERS)
  validatePresentEnum('lifecycle', COMPONENT_LIFECYCLES)
  validatePresentEnum('productArea', PRODUCT_AREAS)
  if (!partial || 'viewportContexts' in value) {
    validateStringArray(value.viewportContexts, `${field}.viewportContexts`, diagnostics, VIEWPORT_CONTEXTS)
  }
  if (!partial || 'uiStates' in value) {
    validateStringArray(value.uiStates, `${field}.uiStates`, diagnostics)
  }
  if (!partial || 'notes' in value) validateStringArray(value.notes, `${field}.notes`, diagnostics)
  if (!partial || 'candidateFamily' in value) {
    const family = value.candidateFamily
    if (family !== null && typeof family !== 'string') {
      diagnostics.push(`${field}.candidateFamily: expected a string or null`)
    } else if (typeof family === 'string' && !candidateFamilies.includes(family)) {
      diagnostics.push(`${field}.candidateFamily: unknown candidate family "${family}"`)
    }
  }

  if (!partial || 'readiness' in value) {
    if (!isRecord(value.readiness)) diagnostics.push(`${field}.readiness: expected an object`)
    else {
      const readiness = value.readiness
      const fields = [
        ['workbench', WORKBENCH_READINESS],
        ['accessibility', AUDIT_STATUSES],
        ['internationalization', AUDIT_STATUSES],
        ['theme', AUDIT_STATUSES],
      ] as const
      for (const [key, allowed] of fields) {
        if (!partial || key in readiness) {
          validateEnum(readiness[key], allowed, `${field}.readiness.${key}`, diagnostics)
        }
      }
    }
  }
  if (!partial) {
    const uncertain = value.lifecycle === 'uncertain' ||
      value.productArea === 'uncertain' ||
      (Array.isArray(value.viewportContexts) && value.viewportContexts.includes('uncertain'))
    const hasNote = Array.isArray(value.notes) && value.notes.some(isNonBlankString)
    if (uncertain && !hasNote) diagnostics.push(`${field}: uncertain classifications require a non-blank note`)
  }
}

export const validateInputs = (
  config: CatalogueConfig,
  metadata: CatalogueMetadataConfig,
): string[] => {
  const diagnostics: string[] = []

  if (!isSafeRelativePath(config.project)) diagnostics.push('project: path must be normalized and stay inside the catalogue root')
  if (!Array.isArray(config.include)) diagnostics.push('include: expected an array')
  else config.include.forEach((item, index) => {
    if (!isSafeRelativePath(item)) diagnostics.push(`include[${index}]: path must be normalized and stay inside the catalogue root`)
  })
  if (!isSafeRelativePath(config.metadata)) diagnostics.push('metadata: path must be normalized and stay inside the catalogue root')
  if (!isSafeRelativePath(config.output?.json)) diagnostics.push('output.json: path must be normalized and stay inside the catalogue root')
  if (!isSafeRelativePath(config.output?.markdown)) diagnostics.push('output.markdown: path must be normalized and stay inside the catalogue root')
  if (config.output?.json === config.output?.markdown) diagnostics.push('output.json and output.markdown must be distinct')

  if (!Array.isArray(metadata.candidateFamilies)) {
    diagnostics.push('candidateFamilies: expected an array')
  } else {
    validateStringArray(metadata.candidateFamilies, 'candidateFamilies', diagnostics)
    const seen = new Set<string>()
    metadata.candidateFamilies.forEach((family, index) => {
      if (seen.has(family)) diagnostics.push(`candidateFamilies[${index}]: duplicate family "${family}"`)
      seen.add(family)
    })
  }
  const families = Array.isArray(metadata.candidateFamilies)
    ? metadata.candidateFamilies.filter(isNonBlankString)
    : []
  validateMetadataShape(metadata.defaults, 'defaults', families, diagnostics, false)

  if (!Array.isArray(metadata.rules)) diagnostics.push('rules: expected an array')
  else metadata.rules.forEach((rule, index) => {
    if (!isRecord(rule)) {
      diagnostics.push(`rules[${index}]: expected an object`)
      return
    }
    if (!isSafeRelativePath(rule.source)) diagnostics.push(`rules[${index}].source: path must be normalized and stay inside the catalogue root`)
    if ('component' in rule && !isNonBlankString(rule.component)) diagnostics.push(`rules[${index}].component: value must be non-blank`)
    validateMetadataShape(rule.metadata, `rules[${index}].metadata`, families, diagnostics, true)
  })

  if (!Array.isArray(metadata.components)) diagnostics.push('components: expected an array')
  else metadata.components.forEach((component, index) => {
    if (!isRecord(component)) {
      diagnostics.push(`components[${index}]: expected an object`)
      return
    }
    if (!isNonBlankString(component.id) || !STABLE_ID.test(component.id)) {
      diagnostics.push(`components[${index}].id: invalid stable identifier; use lowercase dot/dash-separated segments`)
    }
    if (!isSafeRelativePath(component.source)) diagnostics.push(`components[${index}].source: path must be normalized and stay inside the catalogue root`)
    if (!isNonBlankString(component.name)) diagnostics.push(`components[${index}].name: value must be non-blank`)
  })

  if (!Array.isArray(config.ignore)) diagnostics.push('ignore: expected an array')
  else config.ignore.forEach((item, index) => {
    if (!isRecord(item)) {
      diagnostics.push(`ignore[${index}]: expected an object`)
      return
    }
    if (!isSafeRelativePath(item.source)) diagnostics.push(`ignore[${index}].source: path must be normalized and stay inside the catalogue root`)
    if (!isNonBlankString(item.reason)) diagnostics.push(`ignore[${index}].reason: reason must be non-blank`)
  })
  return diagnostics
}

export const validateResolvedMetadata = (
  metadata: ComponentMetadata,
  field: string,
  candidateFamilies: readonly string[],
  diagnostics: string[],
): void => {
  validateMetadataShape(metadata, field, candidateFamilies, diagnostics, false)
}

export const throwDiagnostics = (diagnostics: string[]): void => {
  if (diagnostics.length === 0) return
  throw new Error(`Component catalogue validation failed:\n- ${diagnostics.join('\n- ')}`)
}
