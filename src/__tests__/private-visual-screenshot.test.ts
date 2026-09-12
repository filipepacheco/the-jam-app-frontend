import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  CAPTURE_NAVIGATION_OPTIONS,
  PRIVATE_VISUAL_CAPTURE_ATTRIBUTE,
  STABLE_CAPTURE_CSS,
  VISUAL_CAPTURE_FONT_FAMILY,
  VISUAL_CAPTURE_FONT_WEIGHTS,
  VISUAL_CAPTURE_TIMEOUT_MS,
  storyFrameUrl,
} from '../../scripts/private-visual/screenshot.ts'
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

  it('marks the capture document so the private bundled typeface is used without synthetic weights', () => {
    expect(PRIVATE_VISUAL_CAPTURE_ATTRIBUTE).toBe('data-private-visual-capture')
    expect(STABLE_CAPTURE_CSS).toContain('font-synthesis: none')
    expect(STABLE_CAPTURE_CSS).toContain('-webkit-font-smoothing: antialiased')
    expect(VISUAL_CAPTURE_FONT_FAMILY).toBe('Nunito Sans')
    expect(VISUAL_CAPTURE_FONT_WEIGHTS).toEqual([400, 500, 600, 700, 800])
  })

  it('declares local faces for every reviewed font weight instead of a system-font fallback', async () => {
    const styles = await readFile(path.resolve('src/workbench/workbench.css'), 'utf8')
    const screenshotSource = await readFile(path.resolve('scripts/private-visual/screenshot.ts'), 'utf8')

    for (const weight of [400, 500, 600, 700, 800]) {
      expect(styles).toContain(`@fontsource/nunito-sans/${weight}.css`)
    }
    expect(styles).toContain(':root[data-private-visual-capture]')
    expect(screenshotSource).toContain('document.fonts.load')
  })
})
