import { describe, expect, it } from 'vitest'

import { CAPTURE_NAVIGATION_OPTIONS, VISUAL_CAPTURE_TIMEOUT_MS, storyFrameUrl } from '../../scripts/private-visual/screenshot.ts'
import type { VisualMatrixCell } from '../../scripts/private-visual/matrix.ts'

const cell: VisualMatrixCell = {
  key: 'tracer',
  storyId: 'foundations-action-controls--semantic-variants',
  checkpoint: { kind: 'initial' },
  theme: 'jam-dark',
  viewport: 'phone',
  target: { selector: '[data-workbench-root]' },
  masks: [],
}

describe('private visual screenshot tracer', () => {
  it('uses a stable Storybook frame URL with the reference theme and reduced motion globals', () => {
    expect(storyFrameUrl('http://127.0.0.1:6111/', cell)).toBe(
      'http://127.0.0.1:6111/iframe.html?id=foundations-action-controls--semantic-variants&viewMode=story&globals=theme:jam-dark;reducedMotion:true',
    )
  })

  it('uses an explicit bounded document lifecycle rather than waiting for ambient network idleness', () => {
    expect(CAPTURE_NAVIGATION_OPTIONS).toEqual({ waitUntil: 'load', timeout: VISUAL_CAPTURE_TIMEOUT_MS })
    expect(VISUAL_CAPTURE_TIMEOUT_MS).toBeGreaterThan(0)
  })
})
