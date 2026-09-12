import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { PNG } from 'pngjs'
import { afterEach, describe, expect, it } from 'vitest'

import {
  compareCapturedVisuals,
  type VisualCapture,
} from '../../scripts/private-visual/baselines.ts'
import type { VisualMatrixCell } from '../../scripts/private-visual/matrix.ts'

const temporaryRoots: string[] = []

const createRoot = async (): Promise<string> => {
  const root = await mkdtemp(path.join(tmpdir(), 'jamapp-private-visual-'))
  temporaryRoots.push(root)
  return root
}

const image = (red: number): Buffer => {
  const png = new PNG({ width: 1, height: 1 })
  png.data.set([red, 20, 30, 255])
  return PNG.sync.write(png)
}

const cell: VisualMatrixCell = {
  key: 'foundation-action-states',
  storyId: 'foundations-action-controls--semantic-variants',
  checkpoint: { kind: 'initial' },
  theme: 'jam-light',
  viewport: 'desktop',
  target: { selector: '[data-workbench-root]' },
  masks: [],
}

const capture = (png = image(10)): VisualCapture => ({ cell, png })

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('private visual baselines', () => {
  it('keeps comparison non-mutating by default and reports a missing committed reference', async () => {
    const root = await createRoot()

    const result = await compareCapturedVisuals([capture()], { root, mode: 'compare' })

    expect(result).toMatchObject({ passed: 0, missing: 1, changed: 0, failed: 1 })
    await expect(writeFile(path.join(root, 'private-visual-baselines/baselines/foundation-action-states.png'), image(10))).rejects.toThrow()
  })

  it('requires an explicit opt-in before it writes a reference baseline', async () => {
    const root = await createRoot()

    await expect(compareCapturedVisuals([capture()], { root, mode: 'update', allowUpdate: false })).rejects.toThrow(
      'VISUAL_BASELINE_UPDATE=1 is required',
    )

    const updated = await compareCapturedVisuals([capture()], { root, mode: 'update', allowUpdate: true })
    expect(updated).toMatchObject({ updated: 1, failed: 0 })
    const compared = await compareCapturedVisuals([capture()], { root, mode: 'compare' })
    expect(compared).toMatchObject({ passed: 1, changed: 0, missing: 0, failed: 0 })
  })

  it('writes actual and diff output only to ignored runner-local paths and rejects stale references', async () => {
    const root = await createRoot()
    await compareCapturedVisuals([capture()], { root, mode: 'update', allowUpdate: true })
    await mkdir(path.join(root, 'private-visual-baselines/baselines'), { recursive: true })
    await writeFile(path.join(root, 'private-visual-baselines/baselines/unexpected.png'), image(10))

    const result = await compareCapturedVisuals([capture(image(99))], { root, mode: 'compare' })

    expect(result).toMatchObject({ changed: 1, unexpected: 1, failed: 2 })
    await expect(writeFile(path.join(root, 'private-visual-baselines/actual/foundation-action-states.png'), image(99))).resolves.toBeUndefined()
    await expect(writeFile(path.join(root, 'private-visual-baselines/diff/foundation-action-states.png'), image(99))).resolves.toBeUndefined()
  })
})
