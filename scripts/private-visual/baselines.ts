import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

import type { VisualMatrixCell } from './matrix.ts'

export const VISUAL_BASELINE_DIRECTORY = 'private-visual-baselines/baselines'
export const VISUAL_ACTUAL_DIRECTORY = 'private-visual-baselines/actual'
export const VISUAL_DIFF_DIRECTORY = 'private-visual-baselines/diff'
export const VISUAL_PIXEL_THRESHOLD = 0.1
export const VISUAL_MAX_DIFF_RATIO = 0.0005

export interface VisualCapture {
  cell: VisualMatrixCell
  png: Buffer
}

export interface VisualComparisonCellResult {
  key: string
  status: 'passed' | 'changed' | 'missing'
  diffPixels: number
  diffRatio: number
}

export interface VisualComparisonResult {
  passed: number
  changed: number
  missing: number
  unexpected: number
  failed: number
  updated: number
  cells: VisualComparisonCellResult[]
}

export interface VisualComparisonOptions {
  root: string
  mode: 'compare' | 'update'
  allowUpdate?: boolean
}

const pngPath = (root: string, directory: string, key: string): string =>
  path.join(root, directory, `${key}.png`)

const pngNames = async (directory: string): Promise<string[]> => {
  try {
    return (await readdir(directory))
      .filter((entry) => entry.endsWith('.png'))
      .map((entry) => entry.slice(0, -4))
      .sort()
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

const readPng = async (filename: string): Promise<PNG | undefined> => {
  try {
    return PNG.sync.read(await readFile(filename))
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

const comparePng = (reference: PNG, actual: PNG): { diff: Buffer; pixels: number; ratio: number } => {
  if (reference.width !== actual.width || reference.height !== actual.height) {
    const pixels = Math.max(reference.width * reference.height, actual.width * actual.height)
    return { diff: PNG.sync.write(actual), pixels, ratio: 1 }
  }
  const diff = new PNG({ width: actual.width, height: actual.height })
  const pixels = pixelmatch(reference.data, actual.data, diff.data, actual.width, actual.height, {
    threshold: VISUAL_PIXEL_THRESHOLD,
  })
  return { diff: PNG.sync.write(diff), pixels, ratio: pixels / (actual.width * actual.height) }
}

/**
 * Stores generated evidence only under ignored runner-local folders. The
 * approved references are the sole source-controlled image files.
 */
export const compareCapturedVisuals = async (
  captures: readonly VisualCapture[],
  { root, mode, allowUpdate = false }: VisualComparisonOptions,
): Promise<VisualComparisonResult> => {
  if (mode === 'update' && !allowUpdate) {
    throw new Error('VISUAL_BASELINE_UPDATE=1 is required before private visual references can be updated.')
  }

  const expectedKeys = new Set(captures.map(({ cell }) => cell.key))
  if (expectedKeys.size !== captures.length) throw new Error('Visual captures must have unique stable matrix keys.')

  const actualDirectory = path.join(root, VISUAL_ACTUAL_DIRECTORY)
  const diffDirectory = path.join(root, VISUAL_DIFF_DIRECTORY)
  const baselineDirectory = path.join(root, VISUAL_BASELINE_DIRECTORY)
  await Promise.all([mkdir(actualDirectory, { recursive: true }), mkdir(diffDirectory, { recursive: true })])

  const result: VisualComparisonResult = {
    passed: 0,
    changed: 0,
    missing: 0,
    unexpected: 0,
    failed: 0,
    updated: 0,
    cells: [],
  }

  if (mode === 'update') await mkdir(baselineDirectory, { recursive: true })

  for (const capture of captures) {
    const actualPath = pngPath(root, VISUAL_ACTUAL_DIRECTORY, capture.cell.key)
    await writeFile(actualPath, capture.png)

    if (mode === 'update') {
      await writeFile(pngPath(root, VISUAL_BASELINE_DIRECTORY, capture.cell.key), capture.png)
      result.updated += 1
      result.cells.push({ key: capture.cell.key, status: 'passed', diffPixels: 0, diffRatio: 0 })
      continue
    }

    const reference = await readPng(pngPath(root, VISUAL_BASELINE_DIRECTORY, capture.cell.key))
    if (!reference) {
      result.missing += 1
      result.cells.push({ key: capture.cell.key, status: 'missing', diffPixels: 0, diffRatio: 0 })
      continue
    }

    const actual = PNG.sync.read(capture.png)
    const comparison = comparePng(reference, actual)
    if (comparison.ratio > VISUAL_MAX_DIFF_RATIO) {
      result.changed += 1
      await writeFile(pngPath(root, VISUAL_DIFF_DIRECTORY, capture.cell.key), comparison.diff)
      result.cells.push({
        key: capture.cell.key,
        status: 'changed',
        diffPixels: comparison.pixels,
        diffRatio: comparison.ratio,
      })
    } else {
      result.passed += 1
      result.cells.push({ key: capture.cell.key, status: 'passed', diffPixels: comparison.pixels, diffRatio: comparison.ratio })
    }
  }

  const unexpectedKeys = (await pngNames(baselineDirectory)).filter((key) => !expectedKeys.has(key))
  result.unexpected = unexpectedKeys.length
  result.failed = result.changed + result.missing + result.unexpected
  return result
}
