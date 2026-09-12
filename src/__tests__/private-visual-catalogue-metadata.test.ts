import { describe, expect, it } from 'vitest'

import { validateInputs } from '../../scripts/component-catalogue/validate.ts'
import type { CatalogueConfig, CatalogueMetadataConfig } from '../types/componentCatalogue.types.ts'

const config: CatalogueConfig = {
  project: '.',
  include: ['src/**/*.tsx'],
  metadata: 'catalogue.metadata.json',
  ignore: [],
  output: { json: 'generated/catalogue.json', markdown: 'generated/catalogue.md' },
}

const metadata = (ruleMetadata: Record<string, unknown>): CatalogueMetadataConfig => ({
  candidateFamilies: ['action'],
  defaults: {
    category: 'product-ui',
    layer: 'primitive',
    lifecycle: 'active',
    productArea: 'shared',
    viewportContexts: ['desktop'],
    readiness: { workbench: 'ready', accessibility: 'verified', internationalization: 'verified', theme: 'verified' },
    uiStates: [],
    candidateFamily: null,
    notes: [],
  },
  rules: [{ source: 'src/Action.tsx', metadata: ruleMetadata }],
  components: [],
} as unknown as CatalogueMetadataConfig)

describe('catalogue visual reporting metadata', () => {
  it('requires a machine-readable family for adoption and an explicit record for exceptions', () => {
    const diagnostics = validateInputs(config, metadata({
      canonicalAdoption: { status: 'adopted' },
    }))

    expect(diagnostics).toContain('rules[0].metadata.canonicalAdoption.family: adopted status requires a non-blank family')
  })

  it('requires a replacement decision and removal condition whenever deprecation is recorded', () => {
    const diagnostics = validateInputs(config, metadata({
      lifecycle: 'legacy',
      deprecation: { replacement: 'ui.action' },
    }))

    expect(diagnostics).toEqual(expect.arrayContaining([
      'rules[0].metadata.deprecation.removalCondition: expected a non-blank string',
    ]))
  })

  it('requires documented-exception replacements to be explicit stable identifiers', () => {
    const diagnostics = validateInputs(config, metadata({
      canonicalAdoption: {
        status: 'documented-exception',
        family: 'action',
        note: 'The legacy composite is retained until its replacement split is complete.',
        replacements: ['ui.0011', 'ui.0011'],
      },
    }))

    expect(diagnostics).toEqual(expect.arrayContaining([
      'rules[0].metadata.canonicalAdoption.replacements[1]: duplicate replacement "ui.0011"',
    ]))
  })
})
