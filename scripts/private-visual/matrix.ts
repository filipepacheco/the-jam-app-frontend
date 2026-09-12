export const REFERENCE_VISUAL_THEMES = ['jam-light', 'jam-dark'] as const
export type ReferenceVisualTheme = typeof REFERENCE_VISUAL_THEMES[number]

export const VISUAL_VIEWPORTS = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 },
  venue: { width: 1920, height: 1080 },
} as const
export type VisualViewport = keyof typeof VISUAL_VIEWPORTS

export const MAX_VISUAL_CELLS = 32

export interface VisualMask {
  selector: string
  /** Explains the fixed, dynamic subregion that cannot be made deterministic. */
  reason: string
}

export type VisualCheckpoint =
  | { kind: 'initial' }
  | { kind: 'after-click'; selector: string; waitFor: string }

export interface VisualMatrixCell {
  /** Stable filename key. Changing it deliberately retires a baseline. */
  key: string
  /** Storybook CSF id, verified against the private static build's index. */
  storyId: string
  checkpoint: VisualCheckpoint
  theme: ReferenceVisualTheme
  viewport: VisualViewport
  /** Component canvas or a portal surface; never a whole browser page. */
  target: { selector: string }
  /** Dynamic regions only. Every mask has an explicit review reason. */
  masks: readonly VisualMask[]
}

const canvas = { selector: '[data-workbench-root]' } as const

/**
 * The private review surface is deliberately enumerated. Do not produce a
 * theme × locale × role × viewport product from this list: each row records
 * one high-risk, reviewable reference state.
 */
export const VISUAL_MATRIX = Object.freeze([
  { key: 'foundation-actions-light', storyId: 'foundations-action-controls--semantic-variants', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'desktop', target: canvas, masks: [] },
  { key: 'foundation-actions-loading-dark', storyId: 'foundations-action-controls--loading-and-disabled', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'desktop', target: canvas, masks: [{ selector: '.loading', reason: 'CSS-mask spinner pixels are browser-rasterized while the stable loading label and disabled control remain visible.' }] },
  { key: 'foundation-fields-light', storyId: 'foundations-field-controls--common-states', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'desktop', target: canvas, masks: [] },
  { key: 'foundation-feedback-dark', storyId: 'foundations-interaction-accessibility-and-content--feedback-loading-disabled-and-recovery', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'desktop', target: canvas, masks: [] },
  { key: 'foundation-reduced-motion-light', storyId: 'foundations-interaction-accessibility-and-content--reduced-motion-communicates-the-same-state', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'phone', target: canvas, masks: [] },
  { key: 'foundation-long-content-dark', storyId: 'foundations-interaction-accessibility-and-content--multilingual-expansion-and-content-patterns', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'phone', target: canvas, masks: [] },
  { key: 'foundation-empty-recovery-light', storyId: 'foundations-interaction-accessibility-and-content--actionable-empty-state', checkpoint: { kind: 'after-click', selector: '[data-workbench-root] button', waitFor: '[data-workbench-root] [role="status"]' }, theme: 'jam-light', viewport: 'phone', target: canvas, masks: [] },

  { key: 'overlay-long-modal-light', storyId: 'overlays-canonical-family--modal-keyboard-and-long-scroll', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'phone', target: { selector: '[role="dialog"]' }, masks: [] },
  { key: 'overlay-destructive-submitting-dark', storyId: 'overlays-canonical-family--confirmation-submitting', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'desktop', target: { selector: '[role="alertdialog"]' }, masks: [{ selector: '.loading', reason: 'CSS-mask spinner pixels are browser-rasterized while the submitting label and disabled destructive action remain visible.' }] },
  { key: 'overlay-mobile-drawer-dark', storyId: 'overlays-canonical-family--drawer-and-non-modal-disclosure', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'phone', target: { selector: '[role="dialog"]' }, masks: [] },
  { key: 'navigation-long-tabs-light', storyId: 'navigation-canonical-navigation-and-menus--long-localized-tabs', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'phone', target: canvas, masks: [] },
  { key: 'navigation-permission-menu-dark', storyId: 'navigation-canonical-navigation-and-menus--permission-filtered-overflow', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'desktop', target: canvas, masks: [] },

  { key: 'state-empty-recovery-light', storyId: 'states-empty-state--with-recovery-action', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'phone', target: canvas, masks: [] },
  { key: 'state-loading-region-dark', storyId: 'states-loading--canonical-region-states', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'desktop', target: canvas, masks: [{ selector: '.loading', reason: 'CSS-mask spinner pixels are browser-rasterized while the stable live-region label and skeleton layout remain visible.' }] },

  { key: 'jam-registration-context-light', storyId: 'domain-jam-summary-and-actions--registration-context', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'phone', target: canvas, masks: [] },
  { key: 'jam-timeline-in-progress-dark', storyId: 'domain-jam-performance-timeline--in-progress-permission-state', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'desktop', target: canvas, masks: [] },
  { key: 'music-approved-light', storyId: 'domain-music-library--approved-for-host', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'desktop', target: canvas, masks: [] },
  { key: 'music-suggested-dark', storyId: 'domain-music-library--suggested-for-host', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'desktop', target: canvas, masks: [] },
  { key: 'music-long-viewer-light', storyId: 'domain-music-library--long-content-for-viewer', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'phone', target: canvas, masks: [] },
  { key: 'music-empty-dark', storyId: 'domain-music-library--empty-library-for-host', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'phone', target: canvas, masks: [] },

  { key: 'schedule-pending-light', storyId: 'domain-schedule-registration-and-cards--pending-and-empty-slots', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'phone', target: canvas, masks: [{ selector: '[class*="animate-pulse"]', reason: 'The highlighted availability pulse is dynamic; its surrounding registration context remains under comparison.' }] },
  { key: 'schedule-status-dark', storyId: 'domain-schedule-primitives-and-actions--song-and-status-matrix', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'desktop', target: canvas, masks: [{ selector: '[class*="animate-pulse"]', reason: 'The in-progress status pulse is dynamic; labels, colors, and the rest of the status matrix remain under comparison.' }] },
  { key: 'schedule-disabled-light', storyId: 'domain-schedule-primitives-and-actions--disabled-actions', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'desktop', target: canvas, masks: [{ selector: '.loading', reason: 'CSS-mask spinner pixels are browser-rasterized while every stable loading label and disabled action remains visible.' }] },
  { key: 'dj-playback-dark', storyId: 'domain-dj-control-playback-and-queue--playing-long-content', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'phone', target: canvas, masks: [] },
  { key: 'dj-queue-light', storyId: 'domain-dj-control-playback-and-queue--queue-timeline', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'desktop', target: canvas, masks: [] },
  { key: 'dj-empty-dark', storyId: 'domain-dj-control-playback-and-queue--empty-queue', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'desktop', target: canvas, masks: [] },

  { key: 'dashboard-current-next-light', storyId: 'domain-public-dashboard-cards-and-display--current-and-next', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'venue', target: canvas, masks: [] },
  { key: 'dashboard-offline-dark', storyId: 'domain-public-dashboard-cards-and-display--offline-venue-display', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'venue', target: canvas, masks: [] },
  { key: 'dashboard-live-light', storyId: 'domain-public-dashboard-carousel-and-controls--live-carousel', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'venue', target: canvas, masks: [] },
  { key: 'dashboard-starting-dark', storyId: 'domain-public-dashboard-carousel-and-controls--starting-carousel', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'venue', target: canvas, masks: [] },
  { key: 'dashboard-finished-light', storyId: 'domain-public-dashboard-carousel-and-controls--finished-carousel', checkpoint: { kind: 'initial' }, theme: 'jam-light', viewport: 'venue', target: canvas, masks: [] },
  { key: 'dashboard-panel-matrix-dark', storyId: 'domain-public-dashboard-carousel-and-controls--panel-matrix', checkpoint: { kind: 'initial' }, theme: 'jam-dark', viewport: 'venue', target: canvas, masks: [] },
] as const satisfies readonly VisualMatrixCell[])

export interface VisualMatrixValidationOptions {
  reachableStoryIds: ReadonlySet<string>
}

export const validateVisualMatrix = (
  matrix: readonly VisualMatrixCell[],
  { reachableStoryIds }: VisualMatrixValidationOptions,
): string[] => {
  const diagnostics: string[] = []
  const keys = new Set<string>()

  if (matrix.length === 0) diagnostics.push('visual matrix must contain at least one explicit cell')
  if (matrix.length > MAX_VISUAL_CELLS) diagnostics.push(`visual matrix exceeds its bounded limit of ${MAX_VISUAL_CELLS} cells`)

  for (const cell of matrix) {
    if (keys.has(cell.key)) diagnostics.push(`visual matrix key "${cell.key}" is duplicated`)
    keys.add(cell.key)
    if (!reachableStoryIds.has(cell.storyId)) {
      diagnostics.push(`visual matrix cell "${cell.key}" references unreachable story "${cell.storyId}"`)
    }
    if (!REFERENCE_VISUAL_THEMES.includes(cell.theme)) {
      diagnostics.push(`visual matrix cell "${cell.key}" uses unsupported reference theme "${cell.theme}"`)
    }
    if (!(cell.viewport in VISUAL_VIEWPORTS)) {
      diagnostics.push(`visual matrix cell "${cell.key}" uses unsupported viewport "${cell.viewport}"`)
    }
    if (!cell.target.selector.trim()) diagnostics.push(`visual matrix cell "${cell.key}" requires a precise target selector`)
    if (cell.checkpoint.kind === 'after-click' && (!cell.checkpoint.selector.trim() || !cell.checkpoint.waitFor.trim())) {
      diagnostics.push(`visual matrix cell "${cell.key}" requires an actionable checkpoint selector and settled-state selector`)
    }
    cell.masks.forEach((mask, index) => {
      if (!mask.selector.trim()) diagnostics.push(`visual matrix cell "${cell.key}" mask ${index + 1} requires a selector`)
      if (!mask.reason.trim()) diagnostics.push(`visual matrix cell "${cell.key}" mask ${index + 1} requires a narrow rationale`)
    })
  }
  return diagnostics
}
