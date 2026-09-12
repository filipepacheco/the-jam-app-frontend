import {execFileSync} from 'node:child_process'
import {readFile, readdir} from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

import {runCatalogueCommand} from '../component-catalogue/cli.ts'
import {activeReusableVisualComponents} from '../component-catalogue/coverage.ts'
import {globPattern} from '../component-catalogue/metadata.ts'
import {isSafeRelativePath} from '../component-catalogue/validate.ts'

import type {ComponentCatalogue} from '../../src/types/componentCatalogue.types.ts'

const DEBT_KINDS = ['component-exemption', 'story-accessibility', 'story-interaction'] as const
type DebtKind = typeof DEBT_KINDS[number]

export interface DesignSystemCheckArguments {
  base: string
  configPath: string
  warningOnly: boolean
}

interface DesignSystemCheckConfig {
  catalogueConfig: string
  catalogueOutput: string
  stories: string[]
  baseline: string
}

interface ReviewedDebt {
  id: string
  kind: DebtKind
  scope: string
  reason: string
  owner: string
  record: string
  removeWhen: string
}

interface GovernanceBaseline {
  schemaVersion: 1
  reviewedDebt: ReviewedDebt[]
}

interface StoryEvidence {
  source: string
  name: string
  play: PlayEvidence
  a11yTest: string | undefined
  interaction: InteractionEvidence | undefined
}

interface PlayEvidence {
  callable: boolean
  hasAssertion: boolean
  hasAccessibleQuery: boolean
}

interface InteractionEvidence {
  status: string | undefined
  rationale: string | undefined
}

interface PolicyFinding {
  kind: DebtKind
  target: string
  message: string
  impactedBy?: string
}

export interface DesignSystemCheckResult {
  base: string
  warnings: Array<{debt: ReviewedDebt; finding: PolicyFinding}>
  failures: PolicyFinding[]
}

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isNonBlankString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const readJson = async <T,>(filename: string): Promise<T> =>
  JSON.parse(await readFile(filename, 'utf8')) as T

const runGit = (root: string, args: string[]): string => {
  try {
    return execFileSync('git', args, {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim()
  } catch (error: unknown) {
    const details = error as {stderr?: string; message?: string}
    throw new Error(`Git command failed (git ${args.join(' ')}): ${(details.stderr ?? details.message ?? '').trim()}`)
  }
}

const parseArguments = (args: string[]): DesignSystemCheckArguments => {
  const configIndex = args.indexOf('--config')
  const baseIndex = args.indexOf('--base')
  if (configIndex === -1 || !args[configIndex + 1] || baseIndex === -1 || !args[baseIndex + 1]) {
    throw new Error('Usage: design-system-check --config <path> --base <commit> [--warning]')
  }
  const supported = new Set(['--config', args[configIndex + 1], '--base', args[baseIndex + 1], '--warning'])
  const unknown = args.find((argument) => !supported.has(argument))
  if (unknown) throw new Error(`Unknown argument: ${unknown}`)
  return {
    configPath: args[configIndex + 1],
    base: args[baseIndex + 1],
    warningOnly: args.includes('--warning'),
  }
}

const validateConfig = (config: unknown): asserts config is DesignSystemCheckConfig => {
  if (!isRecord(config)) throw new Error('Design-system check configuration must be an object')
  const diagnostics: string[] = []
  for (const field of ['catalogueConfig', 'catalogueOutput', 'baseline'] as const) {
    if (!isSafeRelativePath(config[field])) diagnostics.push(`${field} must be a normalized relative path`)
  }
  if (!Array.isArray(config.stories) || config.stories.length === 0) {
    diagnostics.push('stories must be a non-empty array')
  } else {
    config.stories.forEach((story, index) => {
      if (!isSafeRelativePath(story)) diagnostics.push(`stories[${index}] must be a normalized relative path`)
    })
  }
  if (diagnostics.length > 0) throw new Error(`Design-system check configuration failed:\n- ${diagnostics.join('\n- ')}`)
}

const validateBaseline = (baseline: unknown): GovernanceBaseline => {
  const diagnostics: string[] = []
  if (!isRecord(baseline)) {
    throw new Error('Governance baseline must be an object')
  }
  if (baseline.schemaVersion !== 1) diagnostics.push('schemaVersion must be 1')
  if (!Array.isArray(baseline.reviewedDebt)) {
    diagnostics.push('reviewedDebt must be an array')
  } else {
    const ids = new Set<string>()
    baseline.reviewedDebt.forEach((entry, index) => {
      if (!isRecord(entry)) {
        diagnostics.push(`reviewedDebt[${index}] must be an object`)
        return
      }
      for (const field of ['id', 'scope', 'reason', 'owner', 'record', 'removeWhen']) {
        if (!isNonBlankString(entry[field])) diagnostics.push(`reviewedDebt[${index}].${field} must be a non-blank string`)
      }
      if (!DEBT_KINDS.includes(entry.kind as DebtKind)) {
        diagnostics.push(`reviewedDebt[${index}].kind must be one of ${DEBT_KINDS.join(', ')}`)
      }
      if (typeof entry.id === 'string') {
        if (ids.has(entry.id)) diagnostics.push(`reviewedDebt[${index}].id duplicates "${entry.id}"`)
        ids.add(entry.id)
      }
    })
  }
  if (diagnostics.length > 0) throw new Error(`Governance baseline validation failed:\n- ${diagnostics.join('\n- ')}`)
  return baseline as GovernanceBaseline
}

const relativePath = (root: string, filename: string): string =>
  path.relative(root, filename).split(path.sep).join('/')

const listFiles = async (root: string): Promise<string[]> => {
  const files: string[] = []
  const visit = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue
      const absolute = path.join(directory, entry.name)
      if (entry.isDirectory()) await visit(absolute)
      else if (entry.isFile()) files.push(relativePath(root, absolute))
    }
  }
  await visit(root)
  return files.sort(compareText)
}

const unwrapExpression = (expression: ts.Expression): ts.Expression => {
  if (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression) || ts.isParenthesizedExpression(expression)) {
    return unwrapExpression(expression.expression)
  }
  return expression
}

const propertyName = (property: ts.ObjectLiteralElementLike): string | undefined => {
  if (!ts.isPropertyAssignment(property) && !ts.isMethodDeclaration(property)) return undefined
  if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) return property.name.text
  return undefined
}

const objectProperty = (object: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined => {
  const property = object.properties.find((candidate) => propertyName(candidate) === name)
  return property && ts.isPropertyAssignment(property) ? unwrapExpression(property.initializer) : undefined
}

const stringValue = (expression: ts.Expression | undefined): string | undefined =>
  expression && (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression))
    ? expression.text
    : undefined

const objectValue = (expression: ts.Expression | undefined): ts.ObjectLiteralExpression | undefined => {
  const unwrapped = expression && unwrapExpression(expression)
  return unwrapped && ts.isObjectLiteralExpression(unwrapped) ? unwrapped : undefined
}

const parametersFor = (expression: ts.Expression | undefined): ts.ObjectLiteralExpression | undefined => {
  const object = objectValue(expression)
  return object && objectValue(objectProperty(object, 'parameters'))
}

const a11yFor = (parameters: ts.ObjectLiteralExpression | undefined): string | undefined => {
  const a11y = parameters && objectValue(objectProperty(parameters, 'a11y'))
  return a11y ? stringValue(objectProperty(a11y, 'test')) : undefined
}

const interactionFor = (parameters: ts.ObjectLiteralExpression | undefined): InteractionEvidence | undefined => {
  const designSystem = parameters && objectValue(objectProperty(parameters, 'designSystem'))
  const interaction = designSystem && objectValue(objectProperty(designSystem, 'interaction'))
  if (!interaction) return undefined
  return {
    status: stringValue(objectProperty(interaction, 'status')),
    rationale: stringValue(objectProperty(interaction, 'rationale')),
  }
}

const isExported = (node: ts.Node): boolean =>
  Boolean(ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))

const containsExpectation = (node: ts.Node): boolean => {
  let found = false
  const visit = (child: ts.Node): void => {
    if (
      ts.isCallExpression(child) &&
      ts.isIdentifier(child.expression) &&
      child.expression.text === 'expect'
    ) {
      found = true
      return
    }
    if (!found) ts.forEachChild(child, visit)
  }
  visit(node)
  return found
}

const ACCESSIBLE_QUERY_NAMES = new Set([
  'findAllByLabelText',
  'findAllByRole',
  'findByLabelText',
  'findByRole',
  'getAllByLabelText',
  'getAllByRole',
  'getByLabelText',
  'getByRole',
  'queryAllByLabelText',
  'queryAllByRole',
  'queryByLabelText',
  'queryByRole',
])

const containsAccessibleQuery = (node: ts.Node): boolean => {
  let found = false
  const visit = (child: ts.Node): void => {
    if (
      ts.isCallExpression(child) &&
      ts.isPropertyAccessExpression(child.expression) &&
      ACCESSIBLE_QUERY_NAMES.has(child.expression.name.text)
    ) {
      found = true
      return
    }
    if (!found) ts.forEachChild(child, visit)
  }
  visit(node)
  return found
}

const playEvidenceFor = (
  story: ts.ObjectLiteralExpression | undefined,
  declarations: Map<string, ts.Expression | undefined>,
): PlayEvidence => {
  const configured = story && objectProperty(story, 'play')
  const expression = configured && ts.isIdentifier(configured)
    ? declarations.get(configured.text) ?? configured
    : configured
  if (!expression || (!ts.isArrowFunction(expression) && !ts.isFunctionExpression(expression))) {
    return {callable: false, hasAssertion: false, hasAccessibleQuery: false}
  }
  return {
    callable: true,
    hasAssertion: containsExpectation(expression.body),
    hasAccessibleQuery: containsAccessibleQuery(expression.body),
  }
}

const metaExpression = (sourceFile: ts.SourceFile): ts.Expression | undefined => {
  const identifiers = new Map<string, ts.Expression>()
  let defaultExport: ts.Expression | undefined
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.initializer) {
          identifiers.set(declaration.name.text, unwrapExpression(declaration.initializer))
        }
      }
    }
    if (ts.isExportAssignment(statement)) defaultExport = unwrapExpression(statement.expression)
  }
  return defaultExport && ts.isIdentifier(defaultExport) ? identifiers.get(defaultExport.text) : defaultExport
}

const discoverStoryEvidence = async (root: string, storyPatterns: string[]): Promise<StoryEvidence[]> => {
  const patterns = storyPatterns.map(globPattern)
  const files = (await listFiles(root)).filter((filename) => patterns.some((pattern) => pattern.test(filename)))
  const stories: StoryEvidence[] = []
  for (const source of files) {
    const sourceFile = ts.createSourceFile(
      source,
      await readFile(path.join(root, source), 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    const declarations = new Map<string, ts.Expression | undefined>()
    for (const statement of sourceFile.statements) {
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) declarations.set(declaration.name.text, declaration.initializer)
        }
      } else if (ts.isFunctionDeclaration(statement) && statement.name) {
        declarations.set(statement.name.text, undefined)
      }
    }
    const metaParameters = parametersFor(metaExpression(sourceFile))
    const exportedStories = new Map<string, ts.Expression | undefined>()
    const addStory = (name: string, expression: ts.Expression | undefined): void => {
      if (!exportedStories.has(name)) exportedStories.set(name, expression)
    }
    for (const statement of sourceFile.statements) {
      if (ts.isVariableStatement(statement) && isExported(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) addStory(declaration.name.text, declaration.initializer)
        }
      } else if (ts.isFunctionDeclaration(statement) && statement.name && isExported(statement)) {
        addStory(statement.name.text, undefined)
      } else if (
        ts.isExportDeclaration(statement) &&
        !statement.moduleSpecifier &&
        statement.exportClause &&
        ts.isNamedExports(statement.exportClause)
      ) {
        for (const element of statement.exportClause.elements) {
          if (element.isTypeOnly) continue
          const localName = element.propertyName?.text ?? element.name.text
          addStory(element.name.text, declarations.get(localName))
        }
      }
    }
    for (const [name, expression] of exportedStories) {
      const story = objectValue(expression)
      const parameters = (story && parametersFor(story)) ?? metaParameters
      stories.push({
        source,
        name,
        play: playEvidenceFor(story, declarations),
        a11yTest: a11yFor(parameters),
        interaction: interactionFor(parameters),
      })
    }
  }
  return stories.sort((left, right) => compareText(`${left.source}#${left.name}`, `${right.source}#${right.name}`))
}

const catalogueAtBase = (root: string, base: string, output: string): ComponentCatalogue => {
  const json = runGit(root, ['show', `${base}:${output}`])
  return JSON.parse(json) as ComponentCatalogue
}

const changedSources = (root: string, base: string): Set<string> => {
  const names = runGit(root, ['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`])
  return new Set(names.split('\n').filter(Boolean))
}

const baselineFor = (
  baseline: GovernanceBaseline,
  kind: DebtKind,
  scope: string,
): ReviewedDebt | undefined => baseline.reviewedDebt.find((entry) => entry.kind === kind && entry.scope === scope)

const componentIdentity = (component: ComponentCatalogue['components'][number]): string =>
  `${component.source}#${component.name}`

const storyTarget = (story: StoryEvidence): string => `${story.source}#${story.name}`

const isReasonedStaticRationale = (rationale: string | undefined): boolean =>
  isNonBlankString(rationale) && /\bstatic\b|\bno\s+(?:user|interaction)|\bdisplay-only\b|\bread-only\b/i.test(rationale)

const interactionFinding = (story: StoryEvidence): PolicyFinding | undefined => {
  if (story.play.callable && story.play.hasAssertion && story.play.hasAccessibleQuery) return undefined
  if (story.interaction?.status === 'not-applicable') {
    if (isReasonedStaticRationale(story.interaction.rationale)) return undefined
    return {
      kind: 'story-interaction',
      target: storyTarget(story),
      message: 'requires a rationale explaining why the story is static and has no user-operated behavior',
    }
  }
  const classificationProblem = !story.play.callable
    ? 'requires a callable play function or interaction: not-applicable with rationale'
    : !story.play.hasAssertion
      ? 'requires a user-observable assertion in its play function or interaction: not-applicable with rationale'
      : 'requires an accessible role or label query in its play assertion or interaction: not-applicable with rationale'
  return {kind: 'story-interaction', target: storyTarget(story), message: classificationProblem}
}

const accessibilityFinding = (story: StoryEvidence): PolicyFinding | undefined =>
  story.a11yTest === 'error'
    ? undefined
    : {kind: 'story-accessibility', target: storyTarget(story), message: 'requires a11y.test: error'}

const storyFindings = (story: StoryEvidence): PolicyFinding[] =>
  [accessibilityFinding(story), interactionFinding(story)].filter((finding): finding is PolicyFinding => Boolean(finding))

export const runDesignSystemCheck = async (
  args: string[],
  cwd = process.cwd(),
): Promise<DesignSystemCheckResult> => {
  const {base: specifiedBase, configPath: configuredPath} = parseArguments(args)
  const configPath = path.resolve(cwd, configuredPath)
  const config = await readJson<unknown>(configPath)
  validateConfig(config)
  const base = runGit(cwd, ['rev-parse', '--verify', `${specifiedBase}^{commit}`])
  runGit(cwd, ['merge-base', '--is-ancestor', base, 'HEAD'])
  await runCatalogueCommand(['--config', config.catalogueConfig, '--check'], cwd)

  const root = path.dirname(configPath)
  const baseline = validateBaseline(await readJson<unknown>(path.resolve(root, config.baseline)))
  const currentCatalogue = await readJson<ComponentCatalogue>(path.resolve(root, config.catalogueOutput))
  const baseCatalogue = catalogueAtBase(root, base, config.catalogueOutput)
  const changed = changedSources(root, base)
  const stories = await discoverStoryEvidence(root, config.stories)
  const storiesBySource = new Map<string, StoryEvidence[]>()
  for (const story of stories) {
    const values = storiesBySource.get(story.source) ?? []
    values.push(story)
    storiesBySource.set(story.source, values)
  }

  const baseComponents = new Set(baseCatalogue.components.map(componentIdentity))
  const failures: PolicyFinding[] = []
  const warnings: Array<{debt: ReviewedDebt; finding: PolicyFinding}> = []
  const active = activeReusableVisualComponents(currentCatalogue.components)
  const changedComponentSources = new Set(active.filter((component) => changed.has(component.source)).map((component) => component.source))
  const impactedStories = new Map<string, Set<string>>()
  for (const source of changed) {
    if (storiesBySource.has(source)) impactedStories.set(source, new Set())
  }

  for (const component of active) {
    const identity = componentIdentity(component)
    const isNew = !baseComponents.has(identity)
    const isChanged = changedComponentSources.has(component.source)
    const exemption = baselineFor(baseline, 'component-exemption', `component:${component.id}`)
    const inheritedExemption = baselineFor(baseline, 'component-exemption', 'unchanged-at-base')
    if (component.metadata.readiness.workbench === 'exempt') {
      const finding: PolicyFinding = {
        kind: 'component-exemption',
        target: component.id,
        message: `${component.source} is exempt from direct story evidence`,
      }
      if (exemption) warnings.push({debt: exemption, finding})
      else if (!isNew && !isChanged && inheritedExemption) warnings.push({debt: inheritedExemption, finding})
      else failures.push({
        ...finding,
        message: `${component.source} is exempt but has no reviewed component-exemption entry`,
      })
      continue
    }
    const hasMeaningfulReachableStory = component.workbenchStories.some(
      (source) => (storiesBySource.get(source)?.length ?? 0) > 0,
    )
    if (isNew && !hasMeaningfulReachableStory) {
      failures.push({
        kind: 'story-interaction',
        target: component.id,
        message: 'is missing a meaningful reachable story',
      })
    }
    if (!isChanged) continue
    for (const source of component.workbenchStories) {
      const sources = impactedStories.get(source) ?? new Set<string>()
      sources.add(component.source)
      impactedStories.set(source, sources)
    }
  }

  for (const story of stories) {
    const impactSources = impactedStories.get(story.source)
    const findings = storyFindings(story)
    for (const finding of findings) {
      if (impactSources && impactSources.size > 0) {
        const sourceList = [...impactSources].sort(compareText).join(', ')
        failures.push({
          ...finding,
          impactedBy: sourceList,
          message: `${finding.message}; is impacted by changed component source ${sourceList}`,
        })
        continue
      }
      if (changed.has(story.source)) {
        failures.push(finding)
        continue
      }
      const debt = baselineFor(baseline, finding.kind, 'unchanged-at-base')
      if (debt) warnings.push({debt, finding})
      else failures.push(finding)
    }
  }

  return {base, warnings, failures}
}

export const formatResult = (result: DesignSystemCheckResult, warningOnly: boolean): string => {
  const warningGroups = new Map<string, {debt: ReviewedDebt; findings: PolicyFinding[]}>()
  for (const warning of result.warnings) {
    const group = warningGroups.get(warning.debt.id) ?? {debt: warning.debt, findings: []}
    group.findings.push(warning.finding)
    warningGroups.set(warning.debt.id, group)
  }
  const lines = [`Compared against base ${result.base}.`]
  for (const {debt, findings} of [...warningGroups.values()].sort((left, right) => compareText(left.debt.id, right.debt.id))) {
    lines.push(`warning [${debt.id}] ${findings.length} reviewed ${debt.kind} finding(s): ${debt.reason}`)
  }
  for (const failure of result.failures) {
    const level = warningOnly ? 'warning' : 'error'
    lines.push(`${level} [${failure.kind}] ${failure.target} ${failure.message}`)
  }
  if (result.failures.length === 0) lines.push('Design-system progressive enforcement passed.')
  else if (warningOnly) lines.push('Design-system progressive warning stage completed without blocking.')
  return `${lines.join('\n')}\n`
}

export {parseArguments}
