import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ComponentCatalogue } from '../types/componentCatalogue.types'
import { scheduleWorkbenchCoverage, scheduleWorkbenchFixtures } from '../workbench/scheduleFixtures'

describe('Schedule and registration workbench catalogue', () => {
  it('provides deterministic empty, pending, approved and completed states', () => {
    expect(scheduleWorkbenchFixtures.empty.registrations).toEqual([])
    expect(scheduleWorkbenchFixtures.pending.registrations?.[0].status).toBe('PENDING')
    expect(scheduleWorkbenchFixtures.approved.status).toBe('IN_PROGRESS')
    expect(scheduleWorkbenchFixtures.completed.status).toBe('COMPLETED')
  })

  it('resolves every active Schedule and registration record', () => {
    const catalogue = JSON.parse(readFileSync(resolve('docs/design-system/component-catalogue.json'), 'utf8')) as ComponentCatalogue
    const records = catalogue.components.filter(({ metadata }) =>
      metadata.lifecycle === 'active' && ['schedule', 'registration'].includes(metadata.productArea),
    )
    expect(records.map(({ id }) => id).sort()).toEqual(scheduleWorkbenchCoverage.map(({ id }) => id).sort())
    expect(records.every(({ metadata }) => ['ready', 'exempt'].includes(metadata.readiness.workbench))).toBe(true)
    expect(scheduleWorkbenchCoverage.every((entry) => entry.disposition === 'story' || entry.reason.length > 0)).toBe(true)
  })
})
