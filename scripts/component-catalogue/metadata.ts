import type {
  CatalogueMetadataConfig,
  ComponentMetadata,
} from '../../src/types/componentCatalogue.types.ts'
import {isRecord} from './validate.ts'

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
  let metadata = (isRecord(config.defaults) ? structuredClone(config.defaults) : {}) as ComponentMetadata
  for (const rule of config.rules) {
    if (typeof rule.source !== 'string' || !isRecord(rule.metadata)) continue
    if (!globPattern(rule.source).test(component.source)) continue
    if (rule.component && rule.component !== component.name) continue
    metadata = {
      ...metadata,
      ...rule.metadata,
      readiness: {...metadata.readiness, ...(isRecord(rule.metadata.readiness) ? rule.metadata.readiness : {})},
    }
  }
  return metadata
}
