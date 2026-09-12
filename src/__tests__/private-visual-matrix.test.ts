import { describe, expect, it } from 'vitest'

import {
  MAX_VISUAL_CELLS,
  VISUAL_MATRIX,
  validateVisualMatrix,
  type VisualMatrixCell,
} from '../../scripts/private-visual/matrix.ts'

const reachableStoryIds = new Set(['foundations-action-controls--semantic-variants'])

const validCell = (): VisualMatrixCell => ({
  key: 'foundation-action-states',
  storyId: 'foundations-action-controls--semantic-variants',
  checkpoint: { kind: 'initial' },
  theme: 'jam-light',
  viewport: 'desktop',
  target: { selector: '[data-workbench-root]' },
  masks: [],
})

describe('private visual matrix', () => {
  it('keeps the reviewed scope explicit and bounded rather than deriving a Cartesian product', () => {
    expect(VISUAL_MATRIX.length).toBeGreaterThan(0)
    expect(VISUAL_MATRIX.length).toBeLessThanOrEqual(MAX_VISUAL_CELLS)
    expect(Object.isFrozen(VISUAL_MATRIX)).toBe(true)
    expect(validateVisualMatrix(VISUAL_MATRIX, { reachableStoryIds: new Set(VISUAL_MATRIX.map(({ storyId }) => storyId)) })).toEqual([])
  })

  it('rejects duplicate keys and unreachable stories', () => {
    const first = validCell()
    const second = { ...validCell(), storyId: 'missing--story' }

    expect(validateVisualMatrix([first, second], { reachableStoryIds })).toEqual(expect.arrayContaining([
      'visual matrix key "foundation-action-states" is duplicated',
      'visual matrix cell "foundation-action-states" references unreachable story "missing--story"',
    ]))
  })

  it('rejects unsupported reference settings and masks without a narrow rationale', () => {
    const cell = {
      ...validCell(),
      theme: 'light',
      viewport: 'television',
      masks: [{ selector: '[data-changing]', reason: '' }],
    } as unknown as VisualMatrixCell

    expect(validateVisualMatrix([cell], { reachableStoryIds })).toEqual(expect.arrayContaining([
      'visual matrix cell "foundation-action-states" uses unsupported reference theme "light"',
      'visual matrix cell "foundation-action-states" uses unsupported viewport "television"',
      'visual matrix cell "foundation-action-states" mask 1 requires a narrow rationale',
    ]))
  })
})
