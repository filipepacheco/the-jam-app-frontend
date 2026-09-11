import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ComponentCatalogue } from '../types/componentCatalogue.types'
import { dashboardSongs, publicDashboardCoverage } from '../workbench/publicDashboardFixtures'

describe('Public Dashboard workbench catalogue', () => {
  it('provides realistic current and next venue-display content', () => {
    expect(dashboardSongs.current.musicians).toHaveLength(3)
    expect(dashboardSongs.next.title.length).toBeGreaterThan(50)
  })

  it('resolves every active Public Dashboard record', () => {
    const catalogue = JSON.parse(readFileSync(resolve('docs/design-system/component-catalogue.json'), 'utf8')) as ComponentCatalogue
    const records = catalogue.components.filter(({ metadata }) => metadata.lifecycle === 'active' && metadata.productArea === 'public-dashboard')
    expect(records.map(({ id }) => id).sort()).toEqual([...publicDashboardCoverage].sort())
    expect(records.every(({ metadata }) => ['ready', 'exempt'].includes(metadata.readiness.workbench))).toBe(true)
  })
})
