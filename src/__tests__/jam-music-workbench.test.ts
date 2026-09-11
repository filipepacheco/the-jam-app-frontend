import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'
import type { ComponentCatalogue } from '../types/componentCatalogue.types'
import {
  jamMusicWorkbenchCoverage,
  musicFixtures,
  scheduleFixtures,
} from '../workbench/jamMusicFixtures'

describe('Jam and Music workbench catalogue', () => {
  it('uses deterministic, realistic fixtures for the principal content states', () => {
    expect(musicFixtures.approved).toMatchObject({
      title: 'Psycho Killer',
      artist: 'Talking Heads',
      status: 'APPROVED',
    })
    expect(musicFixtures.longContent.title.length).toBeGreaterThan(60)
    expect(scheduleFixtures.map((schedule) => schedule.status)).toEqual([
      'SCHEDULED',
      'IN_PROGRESS',
      'COMPLETED',
      'SUGGESTED',
    ])
  })

  it('records a reviewed story or a reasoned exemption for every active Jam and Music record', () => {
    const catalogue = JSON.parse(
      readFileSync(resolve(process.cwd(), 'docs/design-system/component-catalogue.json'), 'utf8'),
    ) as ComponentCatalogue
    const records = catalogue.components.filter((component) =>
      component.metadata.lifecycle === 'active'
      && (
        component.metadata.productArea === 'jam'
        || component.metadata.productArea === 'music'
        || ['JamCard', 'JamCardSkeleton', 'JamContextDisplay'].includes(component.name)
      ),
    )

    expect(records.length).toBeGreaterThan(0)
    expect(records.map(({ id }) => id).sort()).toEqual(
      jamMusicWorkbenchCoverage.map(({ id }) => id).sort(),
    )
    expect(records.every(({ metadata }) => ['ready', 'exempt'].includes(metadata.readiness.workbench))).toBe(true)
    expect(jamMusicWorkbenchCoverage.every(({ disposition, reason }) =>
      disposition === 'story'
        ? reason === undefined
        : Boolean(reason?.trim()),
    )).toBe(true)
  })
})
