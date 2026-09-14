import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ComponentCatalogue } from '../types/componentCatalogue.types'

const read = (path: string) => readFileSync(resolve(path), 'utf8')

describe('architecture program closeout evidence', () => {
  it('records every deferred backend contract with a stable debt identifier', () => {
    const debt = read('docs/backend-debt.md')

    expect(debt).toContain('backend.guest-musicians')
    expect(debt).toContain('backend.performance-language')
    expect(debt).toContain('backend.live-queue-revisions')
    expect(debt).toContain('backend.music-server-filtering')
  })

  it.each([
    ['src/pages/tabs/ScheduleTab.tsx', 'useHostScheduleController', 'src/__tests__/hostScheduleController.test.ts'],
    ['src/components/schedule/LiveJamControlPanel.tsx', 'useLiveQueueController', 'src/__tests__/liveQueueController.test.ts'],
    ['src/pages/MusicPage.tsx', 'useMusicLibraryController', 'src/__tests__/musicLibraryController.test.ts'],
    ['src/pages/tabs/JamDetailPageV2.tsx', 'useJamParticipationController', 'src/__tests__/jamParticipationController.test.ts'],
  ])('keeps %s and its deterministic suite on the %s production interface', (consumer, hook, suite) => {
    expect(read(consumer)).toContain(hook)
    expect(read(suite)).toMatch(/create(?:HostSchedule|LiveQueue|MusicLibrary|JamParticipation)Controller/)
  })

  it('replaces the closeout exemptions with direct workbench evidence', () => {
    const catalogue = JSON.parse(read('docs/design-system/component-catalogue.json')) as ComponentCatalogue
    const closeoutIds = ['ui.0041', 'ui.0042', 'ui.0104', 'ui.0105', 'ui.0106', 'ui.0117', 'ui.0125']
    const records = closeoutIds.map((id) => catalogue.components.find((component) => component.id === id))

    expect(records.every((record) => record?.metadata.readiness.workbench === 'ready')).toBe(true)
    expect(read('src/workbench/stories/ArchitectureCloseout.stories.tsx')).toContain("a11y: { test: 'error' }")
  })

  it('retains the accepted naming and verified dead-code dispositions', () => {
    const metadata = JSON.parse(read('component-catalogue.metadata.json')) as {
      inlinePatternGovernance: { candidates: Array<{ disposition: { status: string } }> }
      retiredComponents: Array<{ id: string }>
    }

    expect(metadata.inlinePatternGovernance.candidates).toHaveLength(1)
    expect(metadata.inlinePatternGovernance.candidates[0].disposition.status).toBe('intentionally-distinct')
    expect(metadata.retiredComponents).toContainEqual(expect.objectContaining({ id: 'ui.0064' }))
  })
})
