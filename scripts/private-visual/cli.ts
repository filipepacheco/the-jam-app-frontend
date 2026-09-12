#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { once } from 'node:events'
import path from 'node:path'

import { chromium, type BrowserContext } from 'playwright'

import {
  VISUAL_ACTUAL_DIRECTORY,
  VISUAL_DIFF_DIRECTORY,
  compareCapturedVisuals,
  planVisualBaselineUpdate,
  type VisualComparisonResult,
} from './baselines.ts'
import { VISUAL_MATRIX, validateVisualMatrix } from './matrix.ts'
import { validatePrivateVisualPolicy } from './policy.ts'
import {
  createWorkbenchProgressReport,
  renderWorkbenchProgressJson,
  renderWorkbenchProgressMarkdown,
} from './progress.ts'
import { captureVisualCell, installDeterministicCaptureEnvironment } from './screenshot.ts'

type VisualCommand = 'compare' | 'update' | 'privacy' | 'progress'

interface CommandArguments {
  command: VisualCommand
  check: boolean
}

interface SourceStoryMetrics {
  files: number
  total: number
  withPlay: number
  strictA11y: number
  todoA11y: number
  playTitlesByFile: ReadonlyMap<string, ReadonlySet<string>>
  strictA11yFiles: ReadonlySet<string>
}

interface RuntimeWorkbenchEvidence {
  interactions: {
    pass: number
    fail: number
    unhandled: number
  }
  accessibility: {
    newViolations: number
  }
}

// Restart Chromium periodically so Storybook/MSW state cannot accumulate across
// the complete matrix while still avoiding one expensive launch per cell.
const VISUAL_BROWSER_BATCH_SIZE = 4

const runtimeDirectory = (root: string): string =>
  path.join(root, 'private-visual-baselines/.runtime/storybook')

const baselineDirectory = (root: string): string => path.join(root, 'private-visual-baselines/baselines')

const workbenchTestResultsPath = (root: string): string =>
  path.join(root, VISUAL_ACTUAL_DIRECTORY, 'workbench-test-results.json')

const visualComparisonSummaryPath = (root: string): string =>
  path.join(root, VISUAL_ACTUAL_DIRECTORY, 'summary.json')

const listFiles = async (directory: string, predicate: (filename: string) => boolean): Promise<string[]> => {
  const files: string[] = []
  const visit = async (current: string): Promise<void> => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const filename = path.join(current, entry.name)
      if (entry.isDirectory()) await visit(filename)
      else if (entry.isFile() && predicate(filename)) files.push(filename)
    }
  }
  await visit(directory)
  return files.sort()
}

const readWorkflowSources = async (root: string): Promise<Array<{ path: string; contents: string }>> => {
  const filenames = await listFiles(
    path.join(root, '.github/workflows'),
    (filename) => filename.endsWith('.yml') || filename.endsWith('.yaml'),
  )
  return Promise.all(filenames.map(async (filename) => ({
    path: path.relative(root, filename),
    contents: await readFile(filename, 'utf8'),
  })))
}

const parseArguments = (args: string[]): CommandArguments => {
  const allowed = new Set(['--compare', '--update', '--privacy', '--progress', '--check'])
  const unknown = args.find((argument) => !allowed.has(argument))
  if (unknown) throw new Error(`Unknown private visual argument: ${unknown}`)
  const commands = args.filter((argument) => argument !== '--check')
  if (commands.length !== 1) {
    throw new Error('Usage: private-visual --compare | --update | --privacy | --progress [--check]')
  }
  return { command: commands[0].slice(2) as VisualCommand, check: args.includes('--check') }
}

const mimeType = (filename: string): string => {
  const extension = path.extname(filename)
  return ({
    '.css': 'text/css',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.map': 'application/json',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
  } as Record<string, string>)[extension] ?? 'application/octet-stream'
}

const serveStaticDirectory = async (directory: string): Promise<{ url: string; close: () => Promise<void> }> => {
  const server = createServer(async (request, response) => {
    const requestPath = new URL(request.url ?? '/', 'http://127.0.0.1').pathname
    const relative = requestPath === '/' ? 'index.html' : decodeURIComponent(requestPath).replace(/^\/+/, '')
    const filename = path.resolve(directory, relative)
    if (!filename.startsWith(`${directory}${path.sep}`) && filename !== path.join(directory, 'index.html')) {
      response.writeHead(403).end()
      return
    }
    try {
      const contents = await readFile(filename)
      response.writeHead(200, { 'content-type': mimeType(filename), 'cache-control': 'no-store' })
      response.end(contents)
    } catch {
      if (!response.headersSent) response.writeHead(404)
      response.end()
    }
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Private visual server did not expose a local port.')
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: async () => {
      // Storybook's iframe can retain a service-worker connection briefly.
      // No capture may keep the private local server alive after its browser closes.
      server.closeAllConnections()
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    },
  }
}

const buildStaticWorkbench = async (root: string): Promise<string> => {
  const output = runtimeDirectory(root)
  await rm(output, { recursive: true, force: true })
  await mkdir(path.dirname(output), { recursive: true })
  const storybookCli = path.join(root, 'node_modules/storybook/dist/bin/dispatcher.js')
  const build = spawnSync(process.execPath, [storybookCli, 'build', '--output-dir', output, '--disable-telemetry', '--quiet'], {
    cwd: root,
    encoding: 'utf8',
  })
  if (build.status !== 0) throw new Error(`Private workbench static build failed.\n${build.stdout}${build.stderr}`)
  return output
}

const staticStoryIds = async (staticDirectory: string): Promise<Set<string>> => {
  const raw = JSON.parse(await readFile(path.join(staticDirectory, 'index.json'), 'utf8')) as {
    entries?: Record<string, { id?: string; type?: string }>
  }
  return new Set(Object.values(raw.entries ?? {})
    .filter((entry) => entry.type === 'story' && typeof entry.id === 'string')
    .map((entry) => entry.id!))
}

const verifyUpdateProtocol = (): { reason: string; reviewer: string; removalReason?: string } => {
  if (process.env.VISUAL_BASELINE_UPDATE !== '1') {
    throw new Error('VISUAL_BASELINE_UPDATE=1 is required before private visual references can be updated.')
  }
  const reason = process.env.VISUAL_BASELINE_REASON?.trim() ?? ''
  const reviewer = process.env.VISUAL_BASELINE_REVIEWER?.trim() ?? ''
  if (!reason || !reviewer) {
    throw new Error('VISUAL_BASELINE_REASON and VISUAL_BASELINE_REVIEWER are required for an intentional reference update.')
  }
  if (!/(?:#\d+|https?:\/\/\S+|(?:docs|design)\/[\w./-]+|\badr[- #:]+\d+)/i.test(reason)) {
    throw new Error('VISUAL_BASELINE_REASON must link an issue or design record (for example, "Issue #123: ...").')
  }
  const removalReason = process.env.VISUAL_BASELINE_REMOVAL_REASON?.trim()
  return { reason, reviewer, removalReason: removalReason || undefined }
}

const writeComparisonSummary = async (root: string, summary: VisualComparisonResult): Promise<void> => {
  const directory = path.join(root, VISUAL_ACTUAL_DIRECTORY)
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
}

/** A fresh page prevents Storybook globals, listeners, and portal state leaking between matrix cells. */
const captureVisualCellInFreshPage = async (
  context: BrowserContext,
  serverUrl: string,
  cell: typeof VISUAL_MATRIX[number],
): Promise<Buffer> => {
  const page = await context.newPage()
  try {
    await installDeterministicCaptureEnvironment(page)
    return await captureVisualCell(page, serverUrl, cell)
  } finally {
    await page.close()
  }
}

const runVisualCapture = async (root: string, mode: 'compare' | 'update'): Promise<void> => {
  const update = mode === 'update' ? verifyUpdateProtocol() : undefined
  await Promise.all([
    rm(path.join(root, VISUAL_DIFF_DIRECTORY), { recursive: true, force: true }),
    rm(path.join(root, 'private-visual-baselines/failures'), { recursive: true, force: true }),
  ])
  const staticDirectory = await buildStaticWorkbench(root)
  try {
    const storyIds = await staticStoryIds(staticDirectory)
    const matrixDiagnostics = validateVisualMatrix(VISUAL_MATRIX, { reachableStoryIds: storyIds })
    if (matrixDiagnostics.length > 0) throw new Error(`Private visual matrix is invalid:\n- ${matrixDiagnostics.join('\n- ')}`)

    const server = await serveStaticDirectory(staticDirectory)
    try {
      const captures = []
      const failures: Array<{ key: string; message: string }> = []
      for (let start = 0; start < VISUAL_MATRIX.length; start += VISUAL_BROWSER_BATCH_SIZE) {
        const browser = await chromium.launch({ headless: true })
        try {
          const context = await browser.newContext()
          try {
            for (const cell of VISUAL_MATRIX.slice(start, start + VISUAL_BROWSER_BATCH_SIZE)) {
              try {
                captures.push({ cell, png: await captureVisualCellInFreshPage(context, server.url, cell) })
              } catch (error: unknown) {
                failures.push({ key: cell.key, message: error instanceof Error ? error.message : String(error) })
              }
            }
          } finally {
            await context.close()
          }
        } finally {
          await browser.close()
        }
      }
      if (failures.length > 0) {
        const directory = path.join(root, 'private-visual-baselines/failures')
        await mkdir(directory, { recursive: true })
        await Promise.all(failures.map(({ key, message }) => writeFile(path.join(directory, `${key}.txt`), `${message}\n`)))
        throw new Error(`Private visual capture failed for ${failures.map(({ key }) => key).join(', ')}.`)
      }

      const updatePlan = mode === 'update' ? await planVisualBaselineUpdate(captures, root) : undefined
      if (updatePlan && updatePlan.changedCells.length === 0 && updatePlan.removedCells.length === 0) {
        throw new Error('Private visual update found no changed or removed reference cells; keep the existing update record.')
      }
      if (updatePlan?.removedCells.length && !update?.removalReason) {
        throw new Error('VISUAL_BASELINE_REMOVAL_REASON is required when an update removes matrix reference cells.')
      }
      const result = await compareCapturedVisuals(captures, {
        root,
        mode,
        allowUpdate: Boolean(update),
      })
      await writeComparisonSummary(root, result)

      if (mode === 'update' && update) {
        await writeFile(path.join(root, 'private-visual-baselines/update-record.json'), `${JSON.stringify({
          reason: update.reason,
          reviewer: update.reviewer,
          addedCells: updatePlan?.addedCells ?? [],
          changedCells: updatePlan?.changedCells ?? [],
          removedCells: updatePlan?.removedCells ?? [],
          removalReason: updatePlan?.removedCells.length ? update.removalReason : undefined,
          matrixCells: VISUAL_MATRIX.map(({ key }) => key),
        }, null, 2)}\n`)
        console.log(`Updated ${result.updated} private visual baselines. Added cells: ${updatePlan?.addedCells.join(', ') || 'none'}. Changed cells: ${updatePlan?.changedCells.join(', ') || 'none'}. Removed cells: ${updatePlan?.removedCells.join(', ') || 'none'}.`)
        return
      }

      console.log(`Private visual comparison: ${result.passed} passed, ${result.changed} changed, ${result.missing} missing, ${result.unexpected} unexpected.`)
      if (result.failed > 0) {
        const changed = result.cells.filter((cell) => cell.status !== 'passed').map((cell) => cell.key)
        throw new Error(`Private visual comparison failed for: ${changed.join(', ') || 'unexpected reference files'}.`)
      }
    } finally {
      await server.close()
    }
  } finally {
    await rm(staticDirectory, { recursive: true, force: true })
  }
}

const storyTitleFor = (exportName: string): string => exportName
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')

const sourceStoryMetrics = async (root: string): Promise<SourceStoryMetrics> => {
  const files = await listFiles(path.join(root, 'src/workbench/stories'), (filename) => filename.endsWith('.stories.tsx'))
  let total = 0
  let withPlay = 0
  let strictA11y = 0
  let todoA11y = 0
  const playTitlesByFile = new Map<string, ReadonlySet<string>>()
  const strictA11yFiles = new Set<string>()
  for (const filename of files) {
    const story = await readFile(filename, 'utf8')
    const count = [...story.matchAll(/export const [A-Za-z][A-Za-z0-9_]*\s*:\s*Story\s*=/g)].length
    total += count
    const storyBlocks = story.split(/(?=export const [A-Za-z][A-Za-z0-9_]*\s*:\s*Story\s*=)/)
    const playTitles = new Set(storyBlocks.flatMap((block) => {
      const exportName = block.match(/^export const ([A-Za-z][A-Za-z0-9_]*)\s*:\s*Story\s*=/)?.[1]
      return exportName && /\bplay\s*:\s*async\b/.test(block) ? [storyTitleFor(exportName)] : []
    }))
    playTitlesByFile.set(filename, playTitles)
    withPlay += playTitles.size
    if (/a11y\s*:\s*\{\s*test\s*:\s*'error'/.test(story)) {
      strictA11y += count
      strictA11yFiles.add(filename)
    }
    else todoA11y += count
  }
  return { files: files.length, total, withPlay, strictA11y, todoA11y, playTitlesByFile, strictA11yFiles }
}

interface WorkbenchAssertionResult {
  title?: unknown
  status?: unknown
  meta?: {
    reports?: Array<{
      type?: unknown
      result?: { violations?: unknown[] }
    }>
  }
}

interface WorkbenchTestSuiteResult {
  name?: unknown
  assertionResults?: WorkbenchAssertionResult[]
}

const runtimeWorkbenchEvidence = async (
  root: string,
  stories: SourceStoryMetrics,
): Promise<RuntimeWorkbenchEvidence> => {
  let parsed: { testResults?: WorkbenchTestSuiteResult[] }
  try {
    parsed = JSON.parse(await readFile(workbenchTestResultsPath(root), 'utf8')) as { testResults?: WorkbenchTestSuiteResult[] }
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error('Private workbench progress requires runner-local workbench-test-results.json. Run npm run workbench:test first.')
    }
    throw error
  }
  if (!Array.isArray(parsed.testResults)) throw new Error('Private workbench test result is missing testResults evidence.')

  const suites = new Map(parsed.testResults.flatMap((suite) =>
    typeof suite.name === 'string' ? [[suite.name, suite] as const] : [],
  ))
  let pass = 0
  let fail = 0
  let unhandled = 0
  let strictA11yReports = 0
  let newViolations = 0

  for (const [filename, playTitles] of stories.playTitlesByFile) {
    const assertions = suites.get(filename)?.assertionResults ?? []
    for (const title of playTitles) {
      const status = assertions.find((assertion) => assertion.title === title)?.status
      if (status === 'passed') pass += 1
      else if (status === 'failed') fail += 1
      else unhandled += 1
    }
  }

  for (const filename of stories.strictA11yFiles) {
    for (const assertion of suites.get(filename)?.assertionResults ?? []) {
      for (const report of assertion.meta?.reports ?? []) {
        if (report.type !== 'a11y') continue
        strictA11yReports += 1
        newViolations += Array.isArray(report.result?.violations) ? report.result.violations.length : 0
      }
    }
  }
  if (strictA11yReports !== stories.strictA11y) {
    throw new Error(`Private workbench a11y evidence is incomplete: expected ${stories.strictA11y} strict reports, found ${strictA11yReports}.`)
  }
  return { interactions: { pass, fail, unhandled }, accessibility: { newViolations } }
}

const runtimeVisualEvidence = async (root: string): Promise<Pick<VisualComparisonResult, 'passed' | 'changed' | 'missing' | 'failed'>> => {
  let parsed: Partial<VisualComparisonResult>
  try {
    parsed = JSON.parse(await readFile(visualComparisonSummaryPath(root), 'utf8')) as Partial<VisualComparisonResult>
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error('Private workbench progress requires a runner-local visual summary. Run npm run visual:compare first.')
    }
    throw error
  }
  for (const key of ['passed', 'changed', 'missing', 'failed'] as const) {
    if (!Number.isInteger(parsed[key]) || parsed[key]! < 0) {
      throw new Error(`Private visual comparison summary has invalid ${key} evidence.`)
    }
  }
  return { passed: parsed.passed!, changed: parsed.changed!, missing: parsed.missing!, failed: parsed.failed! }
}

const generateProgress = async (root: string, check: boolean): Promise<void> => {
  const [catalogueSource, debtSource, packageSource, workflow, workflows, gitignore, stories, baselineFiles] = await Promise.all([
    readFile(path.join(root, 'docs/design-system/component-catalogue.json'), 'utf8'),
    readFile(path.join(root, 'docs/design-system/reviewed-governance-baseline.json'), 'utf8'),
    readFile(path.join(root, 'package.json'), 'utf8'),
    readFile(path.join(root, '.github/workflows/private-workbench.yml'), 'utf8'),
    readWorkflowSources(root),
    readFile(path.join(root, '.gitignore'), 'utf8'),
    sourceStoryMetrics(root),
    listFiles(baselineDirectory(root), (filename) => filename.endsWith('.png')).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw error
    }),
  ])
  const catalogue = JSON.parse(catalogueSource) as Parameters<typeof createWorkbenchProgressReport>[0]['catalogue']
  const debt = JSON.parse(debtSource) as { reviewedDebt?: unknown[] }
  const packageJson = JSON.parse(packageSource)
  const policy = validatePrivateVisualPolicy({ packageJson, workflows, workflow, gitignore })
  if (policy.length > 0) throw new Error(`Private visual policy failed:\n- ${policy.join('\n- ')}`)
  const [workbenchEvidence, visualEvidence] = await Promise.all([
    runtimeWorkbenchEvidence(root, stories),
    runtimeVisualEvidence(root),
  ])
  const report = createWorkbenchProgressReport({
    catalogue,
    stories,
    reviewedDebt: debt.reviewedDebt?.length ?? 0,
    interactions: workbenchEvidence.interactions,
    accessibility: workbenchEvidence.accessibility,
    visual: visualEvidence,
    matrix: {
      cells: VISUAL_MATRIX.length,
      baselineFiles: baselineFiles.length,
      themes: [...new Set(VISUAL_MATRIX.map(({ theme }) => theme))],
      viewports: [...new Set(VISUAL_MATRIX.map(({ viewport }) => viewport))],
    },
    ci: {
      privateCommands: ['visual:privacy', 'visual:compare', 'visual:progress:check'],
      deterministic: true,
      externalVisualServices: 0,
    },
  })
  const output = [
    { filename: path.join(root, 'docs/design-system/workbench-progress.json'), contents: renderWorkbenchProgressJson(report) },
    { filename: path.join(root, 'docs/design-system/workbench-progress.md'), contents: renderWorkbenchProgressMarkdown(report) },
  ]
  const stale = await Promise.all(output.map(async ({ filename, contents }) => {
    try {
      return (await readFile(filename, 'utf8')) !== contents ? filename : undefined
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return filename
      throw error
    }
  }))
  const staleFiles = stale.filter((filename): filename is string => Boolean(filename))
  if (check) {
    if (staleFiles.length > 0) throw new Error(`Private workbench progress is stale: ${staleFiles.map((filename) => path.relative(root, filename)).join(', ')}. Run npm run visual:progress.`)
    console.log('Private workbench progress is deterministic and up to date.')
    return
  }
  await Promise.all(output.map(({ filename, contents }) => writeFile(filename, contents)))
  console.log('Generated deterministic private workbench progress report.')
}

const runPrivacyPolicy = async (root: string): Promise<void> => {
  const [packageSource, workflow, workflows, gitignore] = await Promise.all([
    readFile(path.join(root, 'package.json'), 'utf8'),
    readFile(path.join(root, '.github/workflows/private-workbench.yml'), 'utf8'),
    readWorkflowSources(root),
    readFile(path.join(root, '.gitignore'), 'utf8'),
  ])
  const diagnostics = validatePrivateVisualPolicy({ packageJson: JSON.parse(packageSource), workflows, workflow, gitignore })
  if (diagnostics.length > 0) throw new Error(`Private visual policy failed:\n- ${diagnostics.join('\n- ')}`)
  console.log('Private visual policy is enforced: no public service, upload, or CI baseline update path.')
}

const main = async (): Promise<void> => {
  const { command, check } = parseArguments(process.argv.slice(2))
  const root = process.cwd()
  if (command === 'privacy') return runPrivacyPolicy(root)
  if (command === 'progress') return generateProgress(root, check)
  if (check) throw new Error('--check only applies to --progress')
  return runVisualCapture(root, command)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
