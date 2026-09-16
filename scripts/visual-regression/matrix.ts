import { APPROVED_REFERENCE_THEMES, MAX_VISUAL_MATRIX_CELLS, type VisualMatrixCell } from '../../src/workbench/visualMatrix.ts'
import { WORKBENCH_VIEWPORTS } from '../../src/workbench/config.ts'

export interface MatrixValidationOptions {
  maxCells?: number
  reachableStoryIds?: ReadonlySet<string>
}

export interface MatrixValidationResult {
  cells: readonly VisualMatrixCell[]
  themes: string[]
  viewports: string[]
}

const CELL_KEYS = new Set([
  'key',
  'storyId',
  'checkpoint',
  'theme',
  'viewport',
  'target',
  'masks',
  'interaction',
])

const VALID_CHECKPOINTS = new Set(['initial', 'after-interaction'])
const INVALID_ROOT_SELECTORS = /^(?:html|body|main|document|window|\*|:root)$/i

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isNonBlankString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isTheme = (value: unknown): value is VisualMatrixCell['theme'] =>
  typeof value === 'string' && (APPROVED_REFERENCE_THEMES as readonly string[]).includes(value)

const isViewport = (value: unknown): value is VisualMatrixCell['viewport'] =>
  typeof value === 'string' && value in WORKBENCH_VIEWPORTS

const validateTarget = (value: unknown, field: string, diagnostics: string[]): void => {
  if (!isRecord(value)) {
    diagnostics.push(`${field} must be an object`)
    return
  }
  if (value.kind !== 'component' && value.kind !== 'portal') {
    diagnostics.push(`${field}.kind must be component or portal`)
  }
  if (!isNonBlankString(value.selector)) diagnostics.push(`${field}.selector must be non-blank`)
  else if (INVALID_ROOT_SELECTORS.test(value.selector.trim())) diagnostics.push(`${field}.selector must target a precise region, not the document root`)
}

const validateInteraction = (value: unknown, field: string, diagnostics: string[]): void => {
  if (!isRecord(value)) {
    diagnostics.push(`${field} must be an object`)
    return
  }
  if (value.action !== 'click' && value.action !== 'press') diagnostics.push(`${field}.action must be click or press`)
  if (!isNonBlankString(value.selector)) diagnostics.push(`${field}.selector must be non-blank`)
  if (value.action === 'press' && !['Enter', 'Escape', 'Space'].includes(String(value.key))) {
    diagnostics.push(`${field}.key must be Enter, Escape, or Space for press interactions`)
  }
}

/** Validate the explicit matrix before any browser is started. */
export const validateVisualMatrix = (
  matrix: readonly VisualMatrixCell[],
  options: MatrixValidationOptions = {},
): MatrixValidationResult => {
  const diagnostics: string[] = []
  const maxCells = options.maxCells ?? MAX_VISUAL_MATRIX_CELLS
  if (!Number.isInteger(maxCells) || maxCells < 1) diagnostics.push('maxCells must be a positive integer')
  if (matrix.length > maxCells) diagnostics.push(`matrix contains ${matrix.length} cells; maximum is ${maxCells}`)

  const keys = new Set<string>()
  const signatures = new Set<string>()
  const themes = new Set<string>()
  const viewports = new Set<string>()

  matrix.forEach((cell, index) => {
    const field = `matrix[${index}]`
    if (!isRecord(cell)) {
      diagnostics.push(`${field} must be an object`)
      return
    }
    for (const key of Object.keys(cell)) {
      if (!CELL_KEYS.has(key)) diagnostics.push(`${field}.${key} is not supported; add one explicit cell instead of an implicit expansion`)
    }
    if (!isNonBlankString(cell.key)) diagnostics.push(`${field}.key must be a non-blank string`)
    else {
      if (keys.has(cell.key)) diagnostics.push(`${field}.key duplicates "${cell.key}"`)
      keys.add(cell.key)
    }
    if (!isNonBlankString(cell.storyId)) diagnostics.push(`${field}.storyId must be a non-blank string`)
    else if (options.reachableStoryIds && !options.reachableStoryIds.has(cell.storyId)) diagnostics.push(`${field}.storyId "${cell.storyId}" is not reachable from the Storybook index`)
    if (!VALID_CHECKPOINTS.has(cell.checkpoint)) diagnostics.push(`${field}.checkpoint must be initial or after-interaction`)
    if (!isTheme(cell.theme)) diagnostics.push(`${field}.theme must be one of ${APPROVED_REFERENCE_THEMES.join(', ')}`)
    else themes.add(cell.theme)
    if (!isViewport(cell.viewport)) diagnostics.push(`${field}.viewport must be one of ${Object.keys(WORKBENCH_VIEWPORTS).join(', ')}`)
    else viewports.add(cell.viewport)
    validateTarget(cell.target, `${field}.target`, diagnostics)
    if (!Array.isArray(cell.masks)) diagnostics.push(`${field}.masks must be an array`)
    else {
      const masks = new Set<string>()
      cell.masks.forEach((mask, maskIndex) => {
        if (!isNonBlankString(mask)) diagnostics.push(`${field}.masks[${maskIndex}] must be a non-blank selector`)
        else if (masks.has(mask)) diagnostics.push(`${field}.masks duplicates "${mask}"`)
        else masks.add(mask)
      })
    }
    if (cell.interaction !== undefined) validateInteraction(cell.interaction, `${field}.interaction`, diagnostics)
    if (cell.checkpoint === 'after-interaction' && cell.interaction === undefined) diagnostics.push(`${field} uses after-interaction but declares no interaction`)
    if (cell.checkpoint === 'initial' && cell.interaction !== undefined) diagnostics.push(`${field} declares an interaction but checkpoint is initial`)

    const signature = JSON.stringify([
      cell.storyId,
      cell.checkpoint,
      cell.theme,
      cell.viewport,
      cell.target,
      cell.masks,
      cell.interaction,
    ])
    if (signatures.has(signature)) diagnostics.push(`${field} duplicates an existing story/state/theme/viewport target`)
    signatures.add(signature)
  })

  if (diagnostics.length > 0) {
    throw new Error(`Visual matrix validation failed:\n- ${diagnostics.join('\n- ')}`)
  }
  return {cells: matrix, themes: [...themes].sort(), viewports: [...viewports].sort()}
}
