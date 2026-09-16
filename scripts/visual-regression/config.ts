import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { isSafeRelativePath } from '../component-catalogue/validate.ts'

export interface VisualRegressionConfig {
  matrix: string
  baselines: string
  artifacts: string
  reports: {json: string; markdown: string}
  maxCells: number
  threshold: {maxDiffPixels: number; maxDiffRatio: number}
  storybook: {port: number; startupTimeoutMs: number}
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const nonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0

const readJson = async <T,>(filename: string): Promise<T> =>
  JSON.parse(await readFile(filename, 'utf8')) as T

export const validateVisualRegressionConfig = (value: unknown): asserts value is VisualRegressionConfig => {
  if (!isRecord(value)) throw new Error('Visual regression configuration must be an object')
  const diagnostics: string[] = []
  for (const field of ['matrix', 'baselines', 'artifacts'] as const) {
    if (!isSafeRelativePath(value[field])) diagnostics.push(`${field} must be a normalized relative path`)
  }
  if (!isRecord(value.reports)) diagnostics.push('reports must be an object')
  else {
    if (!isSafeRelativePath(value.reports.json)) diagnostics.push('reports.json must be a normalized relative path')
    if (!isSafeRelativePath(value.reports.markdown)) diagnostics.push('reports.markdown must be a normalized relative path')
  }
  if (!nonNegativeInteger(value.maxCells) || value.maxCells < 1) diagnostics.push('maxCells must be a positive integer')
  if (!isRecord(value.threshold)) diagnostics.push('threshold must be an object')
  else {
    if (!nonNegativeInteger(value.threshold.maxDiffPixels)) diagnostics.push('threshold.maxDiffPixels must be a non-negative integer')
    if (typeof value.threshold.maxDiffRatio !== 'number' || value.threshold.maxDiffRatio < 0 || value.threshold.maxDiffRatio > 1) diagnostics.push('threshold.maxDiffRatio must be between 0 and 1')
  }
  if (!isRecord(value.storybook)) diagnostics.push('storybook must be an object')
  else {
    if (!Number.isInteger(value.storybook.port) || value.storybook.port < 1 || value.storybook.port > 65_535) diagnostics.push('storybook.port must be a valid TCP port')
    if (!nonNegativeInteger(value.storybook.startupTimeoutMs) || value.storybook.startupTimeoutMs < 1) diagnostics.push('storybook.startupTimeoutMs must be positive')
  }
  if (diagnostics.length > 0) throw new Error(`Visual regression configuration failed:\n- ${diagnostics.join('\n- ')}`)
}

export const loadVisualRegressionConfig = async (cwd = process.cwd()): Promise<VisualRegressionConfig> => {
  const filename = path.resolve(cwd, 'visual-regression.config.json')
  const config = await readJson<unknown>(filename)
  validateVisualRegressionConfig(config)
  return config
}
