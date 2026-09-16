import { WORKBENCH_VIEWPORTS } from './config'

export const APPROVED_REFERENCE_THEMES = ['jam-light', 'jam-dark'] as const
export type ApprovedReferenceTheme = typeof APPROVED_REFERENCE_THEMES[number]
export type VisualViewportName = keyof typeof WORKBENCH_VIEWPORTS
export type VisualTargetKind = 'component' | 'portal'

export interface VisualTarget {
  kind: VisualTargetKind
  selector: string
}

export interface VisualInteraction {
  action: 'click' | 'press'
  selector: string
  key?: 'Enter' | 'Escape' | 'Space'
}

export interface VisualMatrixCell {
  key: string
  storyId: string
  checkpoint: 'initial' | 'after-interaction'
  theme: ApprovedReferenceTheme
  viewport: VisualViewportName
  target: VisualTarget
  masks: string[]
  interaction?: VisualInteraction
}

/** Keep this number intentionally small: this is a risk sample, not a product Cartesian product. */
export const MAX_VISUAL_MATRIX_CELLS = 32

/**
 * The sole source of visual-regression scope. Each cell is explicit so adding
 * a locale, role, theme, or viewport can never silently multiply the suite.
 */
export const VISUAL_MATRIX = [
  {
    key: 'foundation.action.semantic.jam-light.desktop',
    storyId: 'foundations-action-controls--semantic-variants',
    checkpoint: 'initial',
    theme: 'jam-light',
    viewport: 'desktop',
    target: {kind: 'component', selector: 'main > div.flex'},
    masks: [],
  },
  {
    key: 'foundation.action.loading.jam-dark.phone',
    storyId: 'foundations-action-controls--loading-and-disabled',
    checkpoint: 'initial',
    theme: 'jam-dark',
    viewport: 'phone',
    target: {kind: 'component', selector: 'main > div.flex'},
    masks: [],
  },
  {
    key: 'foundation.fields.common.jam-light.desktop',
    storyId: 'foundations-field-controls--common-states',
    checkpoint: 'initial',
    theme: 'jam-light',
    viewport: 'desktop',
    target: {kind: 'component', selector: 'main > div.grid'},
    masks: [],
  },
  {
    key: 'foundation.fields.localized.jam-dark.phone',
    storyId: 'foundations-field-controls--form-composition',
    checkpoint: 'initial',
    theme: 'jam-dark',
    viewport: 'phone',
    target: {kind: 'component', selector: 'main > form.grid'},
    masks: [],
  },
  {
    key: 'foundation.feedback.reduced-motion.jam-light.phone',
    storyId: 'foundations-interaction-accessibility-content--reduced-motion-communicates-the-same-state',
    checkpoint: 'initial',
    theme: 'jam-light',
    viewport: 'phone',
    target: {kind: 'component', selector: 'main > section.card'},
    masks: [],
  },
  {
    key: 'overlay.destructive.confirmation.jam-dark.phone',
    storyId: 'foundations-interaction-accessibility-content--keyboard-dialog-and-focus-restoration',
    checkpoint: 'after-interaction',
    theme: 'jam-dark',
    viewport: 'phone',
    target: {kind: 'portal', selector: '[role="alertdialog"]'},
    masks: [],
    interaction: {action: 'click', selector: 'button', key: 'Enter'},
  },
  {
    key: 'overlay.navigation.drawer.jam-light.phone',
    storyId: 'navigation-application-navigation--mobile-host-keyboard-dismissal',
    checkpoint: 'after-interaction',
    theme: 'jam-light',
    viewport: 'phone',
    target: {kind: 'portal', selector: '[role="dialog"]'},
    masks: [],
    interaction: {action: 'click', selector: 'button[aria-label*="menu" i]'},
  },
  {
    key: 'recovery.empty-action.jam-light.phone',
    storyId: 'states-empty-state--with-recovery-action',
    checkpoint: 'initial',
    theme: 'jam-light',
    viewport: 'phone',
    target: {kind: 'component', selector: 'main > section.ds-empty-state'},
    masks: [],
  },
  {
    key: 'recovery.loading.jam-dark.desktop',
    storyId: 'states-loading--canonical-region-states',
    checkpoint: 'initial',
    theme: 'jam-dark',
    viewport: 'desktop',
    target: {kind: 'component', selector: 'main > div.grid'},
    masks: [],
  },
  {
    key: 'jam.timeline.full.jam-light.desktop',
    storyId: 'domain-jam-performance-timeline--complete-schedule',
    checkpoint: 'initial',
    theme: 'jam-light',
    viewport: 'desktop',
    target: {kind: 'component', selector: 'main > div.max-w-2xl'},
    masks: [],
  },
  {
    key: 'jam.timeline.empty.jam-dark.phone',
    storyId: 'domain-jam-performance-timeline--empty-schedule',
    checkpoint: 'initial',
    theme: 'jam-dark',
    viewport: 'phone',
    target: {kind: 'component', selector: 'main > div'},
    masks: [],
  },
  {
    key: 'jam.registration.context.jam-light.desktop',
    storyId: 'domain-jam-summary-and-actions--registration-context',
    checkpoint: 'initial',
    theme: 'jam-light',
    viewport: 'desktop',
    target: {kind: 'component', selector: 'main > div'},
    masks: [],
  },
  {
    key: 'music.approved.jam-light.desktop',
    storyId: 'domain-music-library--approved-for-host',
    checkpoint: 'initial',
    theme: 'jam-light',
    viewport: 'desktop',
    target: {kind: 'component', selector: 'main > div.card'},
    masks: [],
  },
  {
    key: 'music.suggested.jam-dark.desktop',
    storyId: 'domain-music-library--suggested-for-host',
    checkpoint: 'initial',
    theme: 'jam-dark',
    viewport: 'desktop',
    target: {kind: 'component', selector: 'main > div.card'},
    masks: [],
  },
  {
    key: 'music.long.localized.jam-light.phone',
    storyId: 'domain-music-library--long-content-for-viewer',
    checkpoint: 'initial',
    theme: 'jam-light',
    viewport: 'phone',
    target: {kind: 'component', selector: 'main > div.card'},
    masks: [],
  },
  {
    key: 'music.empty.jam-dark.phone',
    storyId: 'domain-music-library--empty-filtered-results',
    checkpoint: 'initial',
    theme: 'jam-dark',
    viewport: 'phone',
    target: {kind: 'component', selector: 'main > div'},
    masks: [],
  },
  {
    key: 'schedule.pending.registration.jam-light.phone',
    storyId: 'domain-schedule-registration-and-cards--pending-and-empty-slots',
    checkpoint: 'initial',
    theme: 'jam-light',
    viewport: 'phone',
    target: {kind: 'component', selector: 'main > div'},
    masks: [],
  },
  {
    key: 'schedule.approved.dense.jam-dark.desktop',
    storyId: 'domain-schedule-registration-and-cards--approved-dense-registration-list',
    checkpoint: 'initial',
    theme: 'jam-dark',
    viewport: 'desktop',
    target: {kind: 'component', selector: 'main > div'},
    masks: [],
  },
  {
    key: 'schedule.empty.registration.jam-light.phone',
    storyId: 'domain-schedule-registration-and-cards--empty-registration-list',
    checkpoint: 'initial',
    theme: 'jam-light',
    viewport: 'phone',
    target: {kind: 'component', selector: 'main > div'},
    masks: [],
  },
  {
    key: 'schedule.destructive.disabled.jam-dark.desktop',
    storyId: 'domain-schedule-registration-and-cards--destructive-actions-disabled',
    checkpoint: 'initial',
    theme: 'jam-dark',
    viewport: 'desktop',
    target: {kind: 'component', selector: 'main > div'},
    masks: [],
  },
  {
    key: 'dj.current-next.jam-light.desktop',
    storyId: 'domain-dj-control-playback-and-queue--playing-long-content',
    checkpoint: 'initial',
    theme: 'jam-light',
    viewport: 'desktop',
    target: {kind: 'component', selector: 'main > div'},
    masks: [],
  },
  {
    key: 'dj.suggested-queue.jam-dark.desktop',
    storyId: 'domain-dj-control-playback-and-queue--queue-timeline',
    checkpoint: 'initial',
    theme: 'jam-dark',
    viewport: 'desktop',
    target: {kind: 'component', selector: 'main > div'},
    masks: [],
  },
  {
    key: 'dj.empty-queue.jam-light.phone',
    storyId: 'domain-dj-control-playback-and-queue--empty-queue',
    checkpoint: 'initial',
    theme: 'jam-light',
    viewport: 'phone',
    target: {kind: 'component', selector: 'main > div'},
    masks: [],
  },
  {
    key: 'dashboard.current-next.jam-dark.desktop',
    storyId: 'domain-public-dashboard-cards-and-display--current-and-next',
    checkpoint: 'initial',
    theme: 'jam-dark',
    viewport: 'desktop',
    target: {kind: 'component', selector: 'main > div'},
    masks: [],
  },
  {
    key: 'dashboard.offline.finished.jam-light.venue',
    storyId: 'domain-public-dashboard-cards-and-display--offline-venue-display',
    checkpoint: 'initial',
    theme: 'jam-light',
    viewport: 'venue',
    target: {kind: 'component', selector: 'main > div'},
    masks: [],
  },
] as const satisfies readonly VisualMatrixCell[]

export const visualMatrix = VISUAL_MATRIX
