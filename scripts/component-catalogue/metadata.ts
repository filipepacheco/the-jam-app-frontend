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
  CatalogueMetadataConfig,
  ComponentMetadata,
} from '../../src/types/componentCatalogue.types.ts'

export interface MetadataComponent {
  key: string
  name: string
  source: string
}

const toPosix = (value: string): string => value.replaceAll('\\', '/')

export const globPattern = (pattern: string): RegExp => {
  const normalized = toPosix(pattern)
  let expression = ''
  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index]
    if (character === '*' && normalized[index + 1] === '*') {
      if (normalized[index + 2] === '/') {
        expression += '(?:.*/)?'
        index += 2
      } else {
        expression += '.*'
        index += 1
      }
    } else if (character === '*') expression += '[^/]*'
    else if (character === '?') expression += '[^/]'
    else expression += character.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${expression}$`)
}

export const matchesAny = (value: string, patterns: string[]): boolean =>
  patterns.some((pattern) => globPattern(pattern).test(value))

export const metadataFor = (
  component: MetadataComponent,
  config: CatalogueMetadataConfig,
): ComponentMetadata => {
  let metadata: ComponentMetadata = structuredClone(config.defaults)
  for (const rule of config.rules) {
    if (!globPattern(rule.source).test(component.source)) continue
    if (rule.component && rule.component !== component.name) continue
    metadata = {
      ...metadata,
      ...rule.metadata,
      readiness: {...metadata.readiness, ...rule.metadata.readiness},
    }
  }
  return metadata
}

export const validateMetadata = (
  metadata: ComponentMetadata,
  component: MetadataComponent,
): void => {
  const valid = (value: string, values: readonly string[], field: string): void => {
    if (!values.includes(value)) throw new Error(`${component.key}: invalid ${field} "${value}"`)
  }
  valid(metadata.category, CATALOGUE_CATEGORIES, 'category')
  valid(metadata.layer, CATALOGUE_LAYERS, 'layer')
  valid(metadata.lifecycle, COMPONENT_LIFECYCLES, 'lifecycle')
  valid(metadata.productArea, PRODUCT_AREAS, 'productArea')
  for (const viewport of metadata.viewportContexts) {
    valid(viewport, VIEWPORT_CONTEXTS, 'viewportContexts')
  }
  valid(metadata.readiness.workbench, WORKBENCH_READINESS, 'readiness.workbench')
  for (const field of ['accessibility', 'internationalization', 'theme'] as const) {
    valid(metadata.readiness[field], AUDIT_STATUSES, `readiness.${field}`)
  }
}
