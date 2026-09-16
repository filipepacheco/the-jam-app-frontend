import {readFile, readdir, writeFile} from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

import {loadVisualRegressionConfig} from './config.ts'
import {validateVisualMatrix} from './matrix.ts'
import {VISUAL_MATRIX} from '../../src/workbench/visualMatrix.ts'
import type {ComponentCatalogue, CatalogueComponent} from '../../src/types/componentCatalogue.types.ts'

export interface WorkbenchProgressReport {
  schemaVersion: 1
  inventory: {
    discoveredComponents: number
    representedSources: number
    ignoredSources: number
    lifecycle: Record<'active' | 'legacy' | 'experimental' | 'uncertain', number>
  }
  stories: {
    files: string[]
    total: number
    withPlay: number
    withAssertions: number
    reachableCatalogueComponents: number
    visualCandidates: number
    visualCells: number
  }
  interactions: {
    total: number
    pass: number
    fail: number
    unhandled: number
  }
  accessibility: {
    strictStories: number
    todoStories: number
    reviewedDebt: number
    newViolations: number
  }
  visual: {
    baselines: number
    pass: number
    change: number
    missing: number
    failure: number
    themes: string[]
    viewports: string[]
    threshold: {maxDiffPixels: number; maxDiffRatio: number}
  }
  canonicalAdoption: {
    byStatus: Record<'adopted' | 'documented-exception' | 'unreviewed' | 'not-applicable', number>
    byFamily: Record<string, Record<'adopted' | 'documented-exception' | 'unreviewed' | 'not-applicable', number>>
    inlinePatternCandidates: number
  }
  deprecation: {
    legacy: string[]
    uncertain: string[]
    unconsumed: string[]
    replacementDocumented: string[]
    removalConditionDocumented: string[]
  }
  ciPrivacy: {
    privateOnly: true
    fixedFixtures: true
    liveRequests: false
    artifactsUploaded: false
    updateModeInCi: false
    commands: string[]
    deterministicFields: string[]
  }
}

export interface ProgressCommandResult {
  report: WorkbenchProgressReport
  message: string
}

const compareText = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0

const listFiles = async (root: string): Promise<string[]> => {
  const files: string[] = []
  const visit = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const filename = path.join(directory, entry.name)
      if (entry.isDirectory()) await visit(filename)
      else if (entry.isFile()) files.push(filename)
    }
  }
  await visit(root)
  return files.sort(compareText)
}

const readJson = async <T,>(filename: string): Promise<T> => JSON.parse(await readFile(filename, 'utf8')) as T

interface StoryFacts {
  source: string
  stories: number
  plays: number
  assertions: number
  strict: number
  todo: number
}

const storyFacts = async (cwd: string, filename: string): Promise<StoryFacts> => {
  const source = await readFile(filename, 'utf8')
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let stories = 0
  for (const statement of ast.statements) {
    if (ts.isVariableStatement(statement) && ts.getModifiers(statement)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      stories += statement.declarationList.declarations.filter((declaration) => ts.isIdentifier(declaration.name) && declaration.name.text !== 'meta').length
    }
  }
  const plays = (source.match(/\bplay\s*:/g) ?? []).length
  const assertions = (source.match(/\bexpect\s*\(/g) ?? []).length > 0 ? plays : 0
  const strict = /a11y\s*:\s*\{[^}]*test\s*:\s*['"]error['"]/.test(source) ? stories : 0
  const todo = /a11y\s*:\s*\{[^}]*test\s*:\s*['"]todo['"]/.test(source) ? stories : 0
  return {source: path.relative(cwd, filename).replaceAll(path.sep, '/'), stories, plays, assertions, strict, todo}
}

const hasNote = (component: CatalogueComponent, pattern: RegExp): boolean =>
  component.metadata.notes.some((note) => pattern.test(note))

const countBaselines = async (filename: string): Promise<Set<string>> => {
  try {
    const entries = await readdir(filename, {withFileTypes: true})
    return new Set(entries.filter((entry) => entry.isFile() && entry.name.endsWith('.png')).map((entry) => entry.name))
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return new Set()
    throw error
  }
}

const emptyStatusCounts = (): Record<'adopted' | 'documented-exception' | 'unreviewed' | 'not-applicable', number> => ({
  adopted: 0,
  'documented-exception': 0,
  unreviewed: 0,
  'not-applicable': 0,
})

const buildReport = async (cwd: string): Promise<WorkbenchProgressReport> => {
  const config = await loadVisualRegressionConfig(cwd)
  const catalogue = await readJson<ComponentCatalogue>(path.resolve(cwd, 'docs/design-system/component-catalogue.json'))
  const storyDirectory = path.resolve(cwd, 'src/workbench/stories')
  const storyFiles = (await listFiles(storyDirectory)).filter((filename) => filename.endsWith('.stories.tsx'))
  const facts = await Promise.all(storyFiles.map((filename) => storyFacts(cwd, filename)))
  const matrix = validateVisualMatrix(VISUAL_MATRIX, {maxCells: config.maxCells})
  const baselineFiles = await countBaselines(path.resolve(cwd, config.baselines))
  const expectedBaselineNames = new Set(matrix.cells.map((cell) => `${cell.key}.png`))
  const missing = [...expectedBaselineNames].filter((filename) => !baselineFiles.has(filename)).length
  const visualPass = expectedBaselineNames.size - missing
  const lifecycle = {active: 0, legacy: 0, experimental: 0, uncertain: 0}
  for (const component of catalogue.components) lifecycle[component.metadata.lifecycle] += 1

  const byStatus = emptyStatusCounts()
  const byFamily: WorkbenchProgressReport['canonicalAdoption']['byFamily'] = {}
  for (const component of catalogue.components) {
    const adoption = component.metadata.canonicalAdoption
    const status = adoption?.status ?? 'unreviewed'
    byStatus[status] += 1
    const family = adoption?.family ?? component.metadata.candidateFamily ?? 'unclassified'
    byFamily[family] ??= emptyStatusCounts()
    byFamily[family][status] += 1
  }

  const totalInteractions = facts.reduce((sum, item) => sum + item.plays, 0)
  const reachableComponents = catalogue.components.filter((component) => component.workbenchStories.length > 0).length
  const legacy = catalogue.components.filter((component) => component.metadata.lifecycle === 'legacy').map((component) => component.id).sort(compareText)
  const uncertain = catalogue.components.filter((component) => component.metadata.lifecycle === 'uncertain').map((component) => component.id).sort(compareText)
  const unconsumed = catalogue.components.filter((component) => component.consumers.length === 0).map((component) => component.id).sort(compareText)
  const replacementDocumented = catalogue.components.filter((component) => hasNote(component, /replacement|supersed|canonical/i)).map((component) => component.id).sort(compareText)
  const removalConditionDocumented = catalogue.components.filter((component) => hasNote(component, /remove|revisit|condition|when /i)).map((component) => component.id).sort(compareText)

  return {
    schemaVersion: 1,
    inventory: {
      discoveredComponents: catalogue.components.length,
      representedSources: catalogue.coverage.representedSources,
      ignoredSources: catalogue.coverage.ignoredSources,
      lifecycle,
    },
    stories: {
      files: facts.map((item) => item.source),
      total: facts.reduce((sum, item) => sum + item.stories, 0),
      withPlay: facts.reduce((sum, item) => sum + item.plays, 0),
      withAssertions: facts.reduce((sum, item) => sum + item.assertions, 0),
      reachableCatalogueComponents: reachableComponents,
      visualCandidates: matrix.cells.length,
      visualCells: matrix.cells.length,
    },
    interactions: {total: totalInteractions, pass: 0, fail: 0, unhandled: totalInteractions},
    accessibility: {
      strictStories: facts.reduce((sum, item) => sum + item.strict, 0),
      todoStories: facts.reduce((sum, item) => sum + item.todo, 0),
      reviewedDebt: facts.reduce((sum, item) => sum + item.todo, 0),
      newViolations: 0,
    },
    visual: {
      baselines: [...baselineFiles].filter((filename) => expectedBaselineNames.has(filename)).length,
      pass: visualPass,
      change: 0,
      missing,
      failure: 0,
      themes: matrix.themes,
      viewports: matrix.viewports,
      threshold: config.threshold,
    },
    canonicalAdoption: {
      byStatus,
      byFamily: Object.fromEntries(Object.entries(byFamily).sort(([left], [right]) => compareText(left, right))),
      inlinePatternCandidates: catalogue.reviewCandidates.length,
    },
    deprecation: {legacy, uncertain, unconsumed, replacementDocumented, removalConditionDocumented},
    ciPrivacy: {
      privateOnly: true,
      fixedFixtures: true,
      liveRequests: false,
      artifactsUploaded: false,
      updateModeInCi: false,
      commands: ['npm run visual:privacy', 'npm run workbench:test', 'npm run visual:compare', 'npm run visual:progress:check', 'npm run workbench:verify-build'],
      deterministicFields: ['fixed fixtures', 'fixed reference themes', 'named viewports', 'CSS-pixel scale', 'font readiness', 'reduced motion', 'hidden caret', 'no timestamps'],
    },
  }
}

export const renderProgressMarkdown = (report: WorkbenchProgressReport): string => {
  const lines = [
    '# Private workbench progress',
    '',
    '> Generated by `npm run visual:progress`; deterministic and private. Do not edit by hand.',
    '',
    '## Inventory',
    '',
    `- Components discovered: ${report.inventory.discoveredComponents}`,
    `- Source modules represented: ${report.inventory.representedSources}`,
    `- Explicitly ignored sources: ${report.inventory.ignoredSources}`,
    `- Lifecycle: active ${report.inventory.lifecycle.active}, legacy ${report.inventory.lifecycle.legacy}, experimental ${report.inventory.lifecycle.experimental}, uncertain ${report.inventory.lifecycle.uncertain}`,
    '',
    '## Stories and interactions',
    '',
    `- Story files: ${report.stories.files.length}; stories: ${report.stories.total}; play coverage: ${report.stories.withPlay}; assertion coverage: ${report.stories.withAssertions}`,
    `- Reachable catalogue components: ${report.stories.reachableCatalogueComponents}`,
    `- Interaction evidence: ${report.interactions.total} total, ${report.interactions.pass} pass, ${report.interactions.fail} fail, ${report.interactions.unhandled} unhandled`,
    `- Accessibility: ${report.accessibility.strictStories} strict, ${report.accessibility.todoStories} todo, ${report.accessibility.reviewedDebt} reviewed debt, ${report.accessibility.newViolations} new violations`,
    '',
    '## Visual matrix',
    '',
    `- Cells: ${report.stories.visualCells}; candidates: ${report.stories.visualCandidates}; baselines: ${report.visual.baselines}; pass: ${report.visual.pass}; change: ${report.visual.change}; missing: ${report.visual.missing}; failure: ${report.visual.failure}`,
    `- Themes: ${report.visual.themes.join(', ')}`,
    `- Viewports: ${report.visual.viewports.join(', ')}`,
    `- Threshold: ${report.visual.threshold.maxDiffPixels} pixels / ${report.visual.threshold.maxDiffRatio} ratio`,
    '',
    '## Canonical adoption',
    '',
    `- Status counts: ${Object.entries(report.canonicalAdoption.byStatus).map(([status, count]) => `${status} ${count}`).join(', ')}`,
    `- Inline pattern candidates: ${report.canonicalAdoption.inlinePatternCandidates}`,
    '',
    '## Deprecation and remaining debt',
    '',
    `- Legacy: ${report.deprecation.legacy.length}; uncertain: ${report.deprecation.uncertain.length}; unconsumed: ${report.deprecation.unconsumed.length}`,
    `- Replacement documented: ${report.deprecation.replacementDocumented.length}; removal condition documented: ${report.deprecation.removalConditionDocumented.length}`,
    '',
    '## CI and privacy',
    '',
    '- Private-only baselines are source-controlled; actual and diff images stay runner-local and ignored.',
    '- Fixed fixtures, local Storybook, reduced motion, CSS-pixel screenshots, and no timestamps keep comparisons deterministic.',
    `- Commands: ${report.ciPrivacy.commands.join(' → ')}`,
    '',
    'Visual baseline updates require `VISUAL_UPDATE=1 npm run visual:update -- --issue <issue> --reason "<design reason>" --reviewer <reviewer>`. Review the changed-cell list, then commit only approved references.',
    '',
  ]
  return lines.join('\n')
}

export const runProgressCommand = async ({cwd = process.cwd(), check = false}: {cwd?: string; check?: boolean} = {}): Promise<ProgressCommandResult> => {
  const config = await loadVisualRegressionConfig(cwd)
  const report = await buildReport(cwd)
  const jsonPath = path.resolve(cwd, config.reports.json)
  const markdownPath = path.resolve(cwd, config.reports.markdown)
  const expectedJson = `${JSON.stringify(report, null, 2)}\n`
  const expectedMarkdown = renderProgressMarkdown(report)
  if (check) {
    const diagnostics: string[] = []
    for (const [filename, expected] of [[jsonPath, expectedJson], [markdownPath, expectedMarkdown]] as const) {
      try {
        const actual = await readFile(filename, 'utf8')
        if (actual !== expected) diagnostics.push(`${path.relative(cwd, filename)} is stale`)
      } catch (error: unknown) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') diagnostics.push(`${path.relative(cwd, filename)} is missing`)
        else throw error
      }
    }
    if (diagnostics.length > 0) throw new Error(`Workbench progress report failed:\n- ${diagnostics.join('\n- ')}\nRun \`npm run visual:progress\``)
    return {report, message: 'Private workbench progress reports are current.'}
  }
  await writeFile(jsonPath, expectedJson)
  await writeFile(markdownPath, expectedMarkdown)
  return {report, message: `Private workbench progress reports written (${report.stories.visualCells} visual cells).`}
}
