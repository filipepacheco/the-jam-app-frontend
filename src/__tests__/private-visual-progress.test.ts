import { describe, expect, it } from 'vitest'

import {
  createWorkbenchProgressReport,
  renderWorkbenchProgressMarkdown,
  workbenchStoryKey,
} from '../../scripts/private-visual/progress.ts'

describe('private workbench progress report', () => {
  it('normalizes Storybook result paths across canonical and host runners', () => {
    expect(workbenchStoryKey('/work/src/workbench/stories/JamComponents.stories.tsx')).toBe(
      'src/workbench/stories/JamComponents.stories.tsx',
    )
    expect(workbenchStoryKey('C:\\repo\\src\\workbench\\stories\\JamComponents.stories.tsx')).toBe(
      'src/workbench/stories/JamComponents.stories.tsx',
    )
  })

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
      interactions: { pass: 2, fail: 1, unhandled: 0 },
      accessibility: { strictReports: 1, missingReports: 0, newViolations: 1 },
      visual: { passed: 2, changed: 1, missing: 0, failed: 1 },
      matrix: { cells: 2, baselineFiles: 2, themes: ['jam-dark', 'jam-light'], viewports: ['desktop', 'phone'] },
      ci: { privateCommands: ['visual:privacy', 'visual:compare', 'visual:progress:check'], deterministic: true, externalVisualServices: 0 },
    }

    const first = createWorkbenchProgressReport(input)
    const second = createWorkbenchProgressReport(input)

    expect(second).toEqual(first)
    expect(JSON.stringify(first)).not.toContain('generatedAt')
    expect(first.inventory).toEqual({ discovered: 3, represented: 6, ignored: 1, lifecycle: { active: 1, legacy: 1, uncertain: 1 } })
    expect(first.stories).toMatchObject({ total: 4, playCoverage: 3, reachableCatalogueComponents: 1, visualCells: 2 })
    expect(first.interactions).toEqual({ total: 3, pass: 2, fail: 1, unhandled: 0, evidence: 'workbench-json-results' })
    expect(first.accessibility).toEqual({
      strict: 1,
      todo: 3,
      reviewedDebt: 2,
      reports: 1,
      missingEvidence: 0,
      newViolations: 1,
    })
    expect(first.visual).toMatchObject({ baselines: 2, pass: 2, change: 1, missing: 0, failure: 1, threshold: 0.0005 })
    expect(first.canonicalAdoption).toEqual({ adopted: { action: 1 }, 'documented-exception': {}, unreviewed: {}, 'not-applicable': {}, notRecorded: 2, inlinePatternCandidates: { action: 1 } })
    expect(first.deprecation).toEqual({ legacy: 1, uncertain: 1, unconsumed: 2, withReplacement: 1, withRemovalCondition: 1 })
    expect(renderWorkbenchProgressMarkdown(first)).toContain('## CI and privacy')
  })
})
