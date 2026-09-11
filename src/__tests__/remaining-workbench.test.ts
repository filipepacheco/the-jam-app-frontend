import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ComponentCatalogue } from '../types/componentCatalogue.types'
import { remainingActiveCoverage } from '../workbench/remainingFixtures'

describe('remaining visual catalogue wave', () => {
  it('accounts for the remaining active records from the Phase 3 baseline', () => {
    const catalogue = JSON.parse(readFileSync(resolve('docs/design-system/component-catalogue.json'), 'utf8')) as ComponentCatalogue
    const ids = new Set(remainingActiveCoverage.map(({ id }) => id))
    const records = catalogue.components.filter(({ id }) => ids.has(id))
    expect(records.map(({ id }) => id).sort()).toEqual([...ids].sort())
    expect(records.every(({ metadata }) => ['ready', 'exempt'].includes(metadata.readiness.workbench))).toBe(true)
    expect(remainingActiveCoverage.every((entry) => entry.disposition === 'story' || entry.reason.length > 0)).toBe(true)
  })

  it('leaves no active visual record in needs-review', () => {
    const catalogue = JSON.parse(readFileSync(resolve('docs/design-system/component-catalogue.json'), 'utf8')) as ComponentCatalogue
    const unresolved = catalogue.components.filter(({ metadata }) => metadata.lifecycle === 'active' && metadata.readiness.workbench === 'needs-review')
    expect(unresolved).toEqual([])
  })
})
