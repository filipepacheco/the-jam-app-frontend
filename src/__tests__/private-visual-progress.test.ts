import { describe, expect, it } from 'vitest'

import {
  createWorkbenchProgressReport,
  renderWorkbenchProgressMarkdown,
} from '../../scripts/private-visual/progress.ts'

describe('private workbench progress report', () => {
  it('reduces source evidence into deterministic metrics without timestamps', () => {
    const input = {
      catalogue: {
        components: [
          { id: 'ui.action', consumers: ['src/workbench/stories/Foundations/ActionControls.stories.tsx'], metadata: { lifecycle: 'active', canonicalAdoption: { status: 'adopted', family: 'action' } } },
          { id: 'ui.legacy', consumers: [], metadata: { lifecycle: 'legacy', deprecation: { replacement: 'ui.action', removalCondition: 'Remove after all consumers migrate.' } } },
          { id: 'ui.uncertain', consumers: [], metadata: { lifecycle: 'uncertain' } },
        ],
        ignored: [{ source: 'src/workbench/Story.tsx', reason: 'Private story' }],
        coverage: { eligibleSources: 7, representedSources: 6 },
        reviewCandidates: [{ family: 'action', occurrences: [{ id: 'candidate' }] }],
      },
      stories: { files: 2, total: 4, withPlay: 3, strictA11y: 1, todoA11y: 3 },
      reviewedDebt: 2,
      matrix: { cells: 2, baselineFiles: 2, themes: ['jam-dark', 'jam-light'], viewports: ['desktop', 'phone'] },
      ci: { privateCommands: ['visual:privacy', 'visual:compare', 'visual:progress:check'], deterministic: true, externalVisualServices: 0 },
    }

    const first = createWorkbenchProgressReport(input)
    const second = createWorkbenchProgressReport(input)

    expect(second).toEqual(first)
    expect(JSON.stringify(first)).not.toContain('generatedAt')
    expect(first.inventory).toEqual({ discovered: 3, represented: 6, ignored: 1, lifecycle: { active: 1, legacy: 1, uncertain: 1 } })
    expect(first.stories).toMatchObject({ total: 4, playCoverage: 3, reachableCatalogueComponents: 1, visualCells: 2 })
    expect(first.interactions).toEqual({ total: 3, pass: 0, fail: 0, unhandled: 3, evidence: 'declared-play-functions' })
    expect(first.accessibility).toEqual({ strict: 1, todo: 3, reviewedDebt: 2, newViolations: 0 })
    expect(first.visual).toMatchObject({ baselines: 2, pass: 0, change: 0, missing: 0, failure: 0, threshold: 0.0005 })
    expect(first.canonicalAdoption).toEqual({ adopted: { action: 1 }, 'documented-exception': {}, unreviewed: {}, 'not-applicable': {}, notRecorded: 2, inlinePatternCandidates: { action: 1 } })
    expect(first.deprecation).toEqual({ legacy: 1, uncertain: 1, unconsumed: 2, withReplacement: 1, withRemovalCondition: 1 })
    expect(renderWorkbenchProgressMarkdown(first)).toContain('## CI and privacy')
  })
})
