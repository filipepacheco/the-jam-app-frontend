import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ComponentCatalogue } from '../types/componentCatalogue.types'
import { djWorkbenchCoverage, liveStateFixture } from '../workbench/djFixtures'

describe('DJ control workbench catalogue', () => {
  it('uses deterministic live-state transitions', () => {
    expect(liveStateFixture.previousSongs[0].status).toBe('COMPLETED')
    expect(liveStateFixture.currentSong?.status).toBe('IN_PROGRESS')
    expect(liveStateFixture.nextSongs[0].status).toBe('SCHEDULED')
    expect(liveStateFixture.suggestedSongs[0].status).toBe('SUGGESTED')
  })

  it('resolves every active DJ control record and owned live-control child', () => {
    const catalogue = JSON.parse(readFileSync(resolve('docs/design-system/component-catalogue.json'), 'utf8')) as ComponentCatalogue
    const ownedIds = new Set(djWorkbenchCoverage.map(({ id }) => id))
    const records = catalogue.components.filter(({ id, metadata }) =>
      (metadata.lifecycle === 'active' && metadata.productArea === 'dj-control') || ownedIds.has(id),
    )
    expect(records.map(({ id }) => id).sort()).toEqual([...ownedIds].sort())
    expect(records.every(({ metadata }) => ['ready', 'exempt'].includes(metadata.readiness.workbench))).toBe(true)
    expect(djWorkbenchCoverage.every((entry) => entry.disposition === 'story' || entry.reason.length > 0)).toBe(true)
  })
})
