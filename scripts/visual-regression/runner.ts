import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {spawn, type ChildProcess} from 'node:child_process'
import {chromium, type Browser, type Page} from 'playwright'

import {loadVisualRegressionConfig} from './config.ts'
import {comparePng, type PixelComparison} from './compare.ts'
import {validateVisualMatrix} from './matrix.ts'
import {captureVisualCell, performVisualInteraction, stableVisualFilename} from './screenshot.ts'
import {VISUAL_MATRIX, type VisualMatrixCell} from '../../src/workbench/visualMatrix.ts'
import {WORKBENCH_VIEWPORTS} from '../../src/workbench/config.ts'

export type VisualRunMode = 'compare' | 'update'

export interface VisualRunOptions {
  mode: VisualRunMode
  cwd?: string
  issue?: string
  reason?: string
  reviewer?: string
  storybookUrl?: string
}

export interface VisualCellResult {
  key: string
  storyId: string
  baseline: 'present' | 'missing' | 'written'
  status: 'pass' | 'change' | 'missing' | 'failure' | 'updated'
  diffPixels: number
  diffRatio: number
  message?: string
}

export interface VisualRunResult {
  mode: VisualRunMode
  cells: VisualCellResult[]
  summary: {
    baselineCount: number
    pass: number
    change: number
    missing: number
    failure: number
    updated: number
  }
}

interface StorybookIndex {
  entries?: Record<string, {type?: string}>
}

const parseDimension = (value: string): number => {
  const match = /^(\d+)px$/.exec(value)
  if (!match) throw new Error(`Unsupported workbench viewport dimension "${value}"`)
  return Number(match[1])
}

const wait = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds))

const isLocalStorybookUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') &&
      ['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname)
  } catch {
    return false
  }
}

const waitForStorybook = async (baseUrl: string, timeoutMs: number): Promise<StorybookIndex> => {
  const deadline = Date.now() + timeoutMs
  let lastError = 'not started'
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/index.json`)
      if (response.ok) return await response.json() as StorybookIndex
      lastError = `HTTP ${response.status}`
    } catch (error: unknown) {
      lastError = error instanceof Error ? error.message : String(error)
    }
    await wait(250)
  }
  throw new Error(`Storybook did not become ready within ${timeoutMs}ms: ${lastError}`)
}

const startStorybook = (cwd: string, port: number): ChildProcess => {
  const dispatcher = path.join(cwd, 'node_modules/storybook/dist/bin/dispatcher.js')
  return spawn(process.execPath, [dispatcher, 'dev', '-p', String(port), '--no-open', '--disable-telemetry'], {
    cwd,
    stdio: 'ignore',
  })
}

const stopStorybook = (processHandle: ChildProcess | undefined): void => {
  if (!processHandle || processHandle.exitCode !== null) return
  processHandle.kill('SIGTERM')
}

const storyUrl = (baseUrl: string, cell: VisualMatrixCell): string => {
  const query = new URLSearchParams({
    id: cell.storyId,
    viewMode: 'story',
    globals: `theme:${cell.theme};locale:pt;authRole:host;route:/;reducedMotion:true`,
  })
  return `${baseUrl}/iframe.html?${query.toString()}`
}

const loadBaseline = async (filename: string): Promise<Buffer | undefined> => {
  try {
    return await readFile(filename)
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return undefined
    throw error
  }
}

const writeArtifacts = async (
  artifactsRoot: string,
  filename: string,
  actual: Buffer,
  comparison: PixelComparison | undefined,
): Promise<void> => {
  await mkdir(artifactsRoot, {recursive: true})
  await writeFile(path.join(artifactsRoot, 'actual', filename), actual)
  if (comparison?.diff) await writeFile(path.join(artifactsRoot, 'diff', filename), comparison.diff)
}

const createContextPage = async (browser: Browser, cell: VisualMatrixCell): Promise<Page> => {
  const viewport = WORKBENCH_VIEWPORTS[cell.viewport]
  const context = await browser.newContext({
    viewport: {
      width: parseDimension(viewport.styles.width),
      height: parseDimension(viewport.styles.height),
    },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  return context.newPage()
}

export const runVisualRegression = async (options: VisualRunOptions): Promise<VisualRunResult> => {
  const cwd = options.cwd ?? process.cwd()
  const config = await loadVisualRegressionConfig(cwd)
  if (options.mode === 'update') {
    if (process.env.VISUAL_UPDATE !== '1') throw new Error('Visual baseline updates require VISUAL_UPDATE=1')
    if (process.env.CI === 'true' || process.env.CI === '1') throw new Error('Visual baseline updates are forbidden in CI')
    if (!options.issue || !options.reason || !options.reviewer) throw new Error('Visual baseline updates require --issue, --reason, and --reviewer')
  }

  const matrix = validateVisualMatrix(VISUAL_MATRIX, {maxCells: config.maxCells})
  const suppliedUrl = options.storybookUrl ?? process.env.VISUAL_STORYBOOK_URL
  if (suppliedUrl && !isLocalStorybookUrl(suppliedUrl)) throw new Error('VISUAL_STORYBOOK_URL must point to localhost')
  const baseUrl = suppliedUrl?.replace(/\/$/, '') ?? `http://127.0.0.1:${config.storybook.port}`
  let storybook: ChildProcess | undefined
  let browser: Browser | undefined
  const cellResults: VisualCellResult[] = []

  try {
    if (!suppliedUrl) storybook = startStorybook(cwd, config.storybook.port)
    const index = await waitForStorybook(baseUrl, config.storybook.startupTimeoutMs)
    const reachableStoryIds = new Set(Object.entries(index.entries ?? {}).filter(([, entry]) => entry.type === 'story').map(([id]) => id))
    validateVisualMatrix(VISUAL_MATRIX, {maxCells: config.maxCells, reachableStoryIds})

    browser = await chromium.launch({headless: true})
    for (const cell of matrix.cells) {
      const filename = stableVisualFilename(cell.key)
      const baselinePath = path.resolve(cwd, config.baselines, filename)
      const page = await createContextPage(browser, cell)
      let actual: Buffer | undefined
      try {
        await page.goto(storyUrl(baseUrl, cell), {waitUntil: 'domcontentloaded'})
        await performVisualInteraction(page, cell)
        const target = page.locator(cell.target.selector).first()
        await target.waitFor({state: 'visible', timeout: 20_000})
        actual = await captureVisualCell({page, cell})
      } finally {
        await page.context().close()
      }

      const baseline = await loadBaseline(baselinePath)
      if (options.mode === 'update') {
        const comparison = baseline ? comparePng(baseline, actual!, config.threshold) : undefined
        const changed = !baseline || comparison?.status !== 'pass'
        if (changed) await mkdir(path.dirname(baselinePath), {recursive: true}), await writeFile(baselinePath, actual!)
        if (changed) await writeArtifacts(path.resolve(cwd, config.artifacts), filename, actual!, comparison)
        cellResults.push({
          key: cell.key,
          storyId: cell.storyId,
          baseline: changed ? 'written' : 'present',
          status: changed ? 'updated' : 'pass',
          diffPixels: comparison?.diffPixels ?? 0,
          diffRatio: comparison?.diffRatio ?? 0,
        })
        continue
      }

      if (!baseline) {
        await writeArtifacts(path.resolve(cwd, config.artifacts), filename, actual!, undefined)
        cellResults.push({key: cell.key, storyId: cell.storyId, baseline: 'missing', status: 'missing', diffPixels: 0, diffRatio: 1, message: `Missing baseline ${filename}`})
        continue
      }
      const comparison = comparePng(baseline, actual!, config.threshold)
      if (comparison.status !== 'pass') await writeArtifacts(path.resolve(cwd, config.artifacts), filename, actual!, comparison)
      cellResults.push({
        key: cell.key,
        storyId: cell.storyId,
        baseline: 'present',
        status: comparison.status,
        diffPixels: comparison.diffPixels,
        diffRatio: comparison.diffRatio,
        message: comparison.message,
      })
    }
  } finally {
    await browser?.close()
    stopStorybook(storybook)
  }

  const summary = {
    baselineCount: cellResults.filter((result) => result.baseline === 'present').length,
    pass: cellResults.filter((result) => result.status === 'pass').length,
    change: cellResults.filter((result) => result.status === 'change').length,
    missing: cellResults.filter((result) => result.status === 'missing').length,
    failure: cellResults.filter((result) => result.status === 'failure').length,
    updated: cellResults.filter((result) => result.status === 'updated').length,
  }
  const artifactsRoot = path.resolve(cwd, config.artifacts)
  await mkdir(artifactsRoot, {recursive: true})
  await writeFile(path.join(artifactsRoot, 'visual-results.json'), `${JSON.stringify({mode: options.mode, cells: cellResults, summary}, null, 2)}\n`)
  return {mode: options.mode, cells: cellResults, summary}
}
