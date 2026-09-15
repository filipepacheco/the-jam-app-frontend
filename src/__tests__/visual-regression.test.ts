import {PNG} from 'pngjs'
import {describe, expect, it} from 'vitest'

import {comparePng} from '../../scripts/visual-regression/compare.ts'
import {validateVisualMatrix} from '../../scripts/visual-regression/matrix.ts'
import {stableVisualFilename} from '../../scripts/visual-regression/screenshot.ts'
import {MAX_VISUAL_MATRIX_CELLS, VISUAL_MATRIX} from '../workbench/visualMatrix.ts'

const png = (colour: [number, number, number, number]): Buffer => {
  const image = new PNG({width: 2, height: 2})
  for (let index = 0; index < image.data.length; index += 4) image.data.set(colour, index)
  return PNG.sync.write(image)
}

describe('private visual matrix', () => {
  it('keeps the explicit matrix bounded and limited to reference themes', () => {
    const result = validateVisualMatrix(VISUAL_MATRIX)
    expect(result.cells.length).toBeLessThanOrEqual(MAX_VISUAL_MATRIX_CELLS)
    expect(result.themes).toEqual(['jam-dark', 'jam-light'])
    expect(result.viewports).toEqual(['desktop', 'phone', 'venue'])
  })

  it('rejects duplicate, unreachable, and implicit-expansion cells', () => {
    expect(() => validateVisualMatrix([
      {...VISUAL_MATRIX[0], key: 'duplicate'},
      {...VISUAL_MATRIX[0], key: 'duplicate'},
    ], {reachableStoryIds: new Set([VISUAL_MATRIX[0].storyId])})).toThrow(/duplicates "duplicate"/)

    expect(() => validateVisualMatrix([
      {...VISUAL_MATRIX[0], key: 'unreachable'},
    ], {reachableStoryIds: new Set()})).toThrow(/not reachable/)

    expect(() => validateVisualMatrix([
      {...VISUAL_MATRIX[0], key: 'implicit', themes: ['jam-light']},
    ] as never[])).toThrow(/implicit expansion/)
  })

  it('uses stable, filesystem-safe keys', () => {
    expect(stableVisualFilename('foundation.action.semantic')).toBe('foundation.action.semantic.png')
    expect(() => stableVisualFilename('..')).toThrow()
  })
})

describe('screenshot matcher seam', () => {
  it('passes identical PNGs and reports a changed pixel with a diff', () => {
    const expected = png([20, 20, 20, 255])
    const actual = png([20, 20, 255, 255])
    expect(comparePng(expected, expected, {maxDiffPixels: 0, maxDiffRatio: 0})).toMatchObject({status: 'pass', diffPixels: 0})
    expect(comparePng(expected, actual, {maxDiffPixels: 0, maxDiffRatio: 0})).toMatchObject({status: 'change', diffPixels: 4})
    expect(comparePng(expected, actual, {maxDiffPixels: 4, maxDiffRatio: 1})).toMatchObject({status: 'pass', diff: undefined})
  })
})
