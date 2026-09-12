import { VISUAL_MAX_DIFF_RATIO } from './baselines.ts'
import type {
  CanonicalAdoption,
  CanonicalAdoptionStatus,
  ComponentLifecycle,
  DeprecationRecord,
} from '../../src/types/componentCatalogue.types.ts'

interface ProgressComponent {
  id: string
  consumers: readonly string[]
  metadata: {
    lifecycle: ComponentLifecycle
    canonicalAdoption?: Pick<CanonicalAdoption, 'status' | 'family'>
    deprecation?: DeprecationRecord
  }
}

export interface WorkbenchProgressInput {
  catalogue: {
    components: readonly ProgressComponent[]
    ignored: readonly { source: string; reason: string }[]
    coverage: { eligibleSources: number; representedSources: number }
    reviewCandidates: readonly { family: string; occurrences: readonly unknown[] }[]
  }
  stories: {
    files: number
    total: number
    withPlay: number
    strictA11y: number
    todoA11y: number
  }
  reviewedDebt: number
  interactions: {
    pass: number
    fail: number
    unhandled: number
  }
  accessibility: {
    newViolations: number
  }
  visual: {
    passed: number
    changed: number
    missing: number
    failed: number
  }
  matrix: {
    cells: number
    baselineFiles: number
    themes: readonly string[]
    viewports: readonly string[]
  }
  ci: {
    privateCommands: readonly string[]
    deterministic: boolean
    externalVisualServices: number
  }
}

export interface WorkbenchProgressReport {
  schemaVersion: 1
  inventory: {
    discovered: number
    represented: number
    ignored: number
    lifecycle: Record<string, number>
  }
  stories: {
    files: number
    total: number
    playCoverage: number
    reachableCatalogueComponents: number
    visualCandidates: number
    visualCells: number
  }
  interactions: {
    total: number
    pass: number
    fail: number
    unhandled: number
    evidence: 'workbench-json-results'
  }
  accessibility: {
    strict: number
    todo: number
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
    threshold: number
  }
  canonicalAdoption: Record<CanonicalAdoptionStatus, Record<string, number>> & {
    notRecorded: number
    inlinePatternCandidates: Record<string, number>
  }
  deprecation: {
    legacy: number
    uncertain: number
    unconsumed: number
    withReplacement: number
    withRemovalCondition: number
  }
  ci: {
    privateCommands: string[]
    deterministic: boolean
    externalVisualServices: number
  }
}

const countBy = <T>(values: readonly T[], valueFor: (value: T) => string): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const value of values) {
    const key = valueFor(value)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)))
}

const initialAdoptionCounts = (): Record<CanonicalAdoptionStatus, Record<string, number>> => ({
  adopted: {},
  'documented-exception': {},
  unreviewed: {},
  'not-applicable': {},
})

/** Reduces static and runner evidence to stable counts; timestamps never enter the checked-in report. */
export const createWorkbenchProgressReport = (input: WorkbenchProgressInput): WorkbenchProgressReport => {
  const components = input.catalogue.components
  const lifecycle = countBy(components, (component) => component.metadata.lifecycle)
  const adoption = initialAdoptionCounts()
  let notRecorded = 0

  for (const component of components) {
    const recorded = component.metadata.canonicalAdoption
    if (!recorded) {
      notRecorded += 1
      continue
    }
    const family = recorded.family ?? 'unspecified'
    adoption[recorded.status][family] = (adoption[recorded.status][family] ?? 0) + 1
  }

  const inlinePatternCandidates = countBy(input.catalogue.reviewCandidates, (candidate) => candidate.family)
  const deprecated = components.filter((component) => component.metadata.deprecation)

  return {
    schemaVersion: 1,
    inventory: {
      discovered: components.length,
      represented: input.catalogue.coverage.representedSources,
      ignored: input.catalogue.ignored.length,
      lifecycle,
    },
    stories: {
      files: input.stories.files,
      total: input.stories.total,
      playCoverage: input.stories.withPlay,
      reachableCatalogueComponents: components.filter((component) => component.consumers.some((source) => source.endsWith('.stories.tsx'))).length,
      visualCandidates: input.stories.total,
      visualCells: input.matrix.cells,
    },
    interactions: {
      total: input.stories.withPlay,
      pass: input.interactions.pass,
      fail: input.interactions.fail,
      unhandled: input.interactions.unhandled,
      evidence: 'workbench-json-results',
    },
    accessibility: {
      strict: input.stories.strictA11y,
      todo: input.stories.todoA11y,
      reviewedDebt: input.reviewedDebt,
      newViolations: input.accessibility.newViolations,
    },
    visual: {
      baselines: input.matrix.baselineFiles,
      pass: input.visual.passed,
      change: input.visual.changed,
      missing: input.visual.missing,
      failure: input.visual.failed,
      themes: [...input.matrix.themes].sort(),
      viewports: [...input.matrix.viewports].sort(),
      threshold: VISUAL_MAX_DIFF_RATIO,
    },
    canonicalAdoption: {
      ...adoption,
      notRecorded,
      inlinePatternCandidates,
    },
    deprecation: {
      legacy: lifecycle.legacy ?? 0,
      uncertain: lifecycle.uncertain ?? 0,
      unconsumed: components.filter((component) => component.consumers.length === 0).length,
      withReplacement: deprecated.filter((component) => component.metadata.deprecation?.replacement).length,
      withRemovalCondition: deprecated.filter((component) => component.metadata.deprecation?.removalCondition.trim()).length,
    },
    ci: {
      privateCommands: [...input.ci.privateCommands].sort(),
      deterministic: input.ci.deterministic,
      externalVisualServices: input.ci.externalVisualServices,
    },
  }
}

export const renderWorkbenchProgressJson = (report: WorkbenchProgressReport): string =>
  `${JSON.stringify(report, null, 2)}\n`

export const renderWorkbenchProgressMarkdown = (report: WorkbenchProgressReport): string => {
  const lifecycle = Object.entries(report.inventory.lifecycle).map(([status, count]) => `${status}: ${count}`).join('; ')
  const adoption = Object.entries(report.canonicalAdoption.adopted).map(([family, count]) => `${family}: ${count}`).join('; ') || 'none recorded'
  const inline = Object.entries(report.canonicalAdoption.inlinePatternCandidates).map(([family, count]) => `${family}: ${count}`).join('; ') || 'none'
  return [
    '# Private workbench progress',
    '',
    '> Deterministic checked-in counts reduced from private runner-local workbench and visual evidence; timestamps and artefacts are intentionally excluded.',
    '',
    '## Inventory',
    '',
    `Discovered: ${report.inventory.discovered}; represented sources: ${report.inventory.represented}; ignored sources: ${report.inventory.ignored}.`,
    '',
    `Lifecycle: ${lifecycle}.`,
    '',
    '## Stories and interactions',
    '',
    `Story files: ${report.stories.files}; stories: ${report.stories.total}; declared play functions: ${report.stories.playCoverage}; reachable catalogue components: ${report.stories.reachableCatalogueComponents}; visual candidates/cells: ${report.stories.visualCandidates}/${report.stories.visualCells}.`,
    '',
    `Interaction evidence: total ${report.interactions.total}; pass ${report.interactions.pass}; fail ${report.interactions.fail}; unhandled ${report.interactions.unhandled} (${report.interactions.evidence}).`,
    '',
    '## Accessibility and visual baselines',
    '',
    `Accessibility modes — strict: ${report.accessibility.strict}; todo: ${report.accessibility.todo}; reviewed debt: ${report.accessibility.reviewedDebt}; new violations: ${report.accessibility.newViolations}.`,
    '',
    `Visual baselines: ${report.visual.baselines}; pass/change/missing/failure: ${report.visual.pass}/${report.visual.change}/${report.visual.missing}/${report.visual.failure}; themes: ${report.visual.themes.join(', ')}; viewports: ${report.visual.viewports.join(', ')}; max differing-pixel ratio: ${report.visual.threshold}.`,
    '',
    '## Canonical adoption and deprecation',
    '',
    `Recorded adopted families: ${adoption}. Not recorded: ${report.canonicalAdoption.notRecorded}. Inline-pattern candidates: ${inline}.`,
    '',
    `Deprecation — legacy: ${report.deprecation.legacy}; uncertain: ${report.deprecation.uncertain}; unconsumed: ${report.deprecation.unconsumed}; replacements: ${report.deprecation.withReplacement}; removal conditions: ${report.deprecation.withRemovalCondition}.`,
    '',
    '## CI and privacy',
    '',
    `Private commands: ${report.ci.privateCommands.join(', ')}. Deterministic: ${report.ci.deterministic ? 'yes' : 'no'}. External visual services: ${report.ci.externalVisualServices}.`,
    '',
  ].join('\n')
}
