export const REFERENCE_THEME_NAMES = ['jam-light', 'jam-dark'] as const

const DAISY_THEMES = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate',
  'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden',
  'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black',
  'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade',
  'night', 'coffee', 'winter',
] as const

export const SELECTABLE_THEMES = [...REFERENCE_THEME_NAMES, ...DAISY_THEMES] as const

export const SEMANTIC_COLOR_ROLES = {
  surfaces: ['--ds-surface-canvas', '--ds-surface-raised', '--ds-surface-sunken', '--ds-surface-overlay'],
  content: ['--ds-content-primary', '--ds-content-secondary', '--ds-content-inverse', '--ds-content-link'],
  borders: ['--ds-border-subtle', '--ds-border-strong', '--ds-border-interactive'],
  actions: ['--ds-action-primary', '--ds-action-primary-content', '--ds-action-secondary', '--ds-action-danger'],
  focus: ['--ds-focus-ring', '--ds-focus-offset'],
  statuses: [
    '--ds-status-info', '--ds-status-info-content',
    '--ds-status-success', '--ds-status-success-content',
    '--ds-status-warning', '--ds-status-warning-content',
    '--ds-status-danger', '--ds-status-danger-content',
  ],
} as const

export const SPACING = {
  related: 4,
  compact: 8,
  control: 12,
  cluster: 16,
  section: 24,
  region: 32,
  layout: 48,
  spacious: 64,
  stage: 96,
} as const

export const CONTROL_SIZES = {
  compactPointer: 36,
  touchTarget: 44,
  comfortable: 48,
  sharedDisplayTarget: 56,
} as const

type Oklch = Readonly<{ lightness: number; chroma: number; hue: number }>

export type ReferenceThemeName = (typeof REFERENCE_THEME_NAMES)[number]

export const REFERENCE_THEMES: Record<ReferenceThemeName, Readonly<{
  base: Oklch
  baseContent: Oklch
  primary: Oklch
  primaryContent: Oklch
  secondary: Oklch
  secondaryContent: Oklch
  info: Oklch
  infoContent: Oklch
  success: Oklch
  successContent: Oklch
  warning: Oklch
  warningContent: Oklch
  error: Oklch
  errorContent: Oklch
  focus: Oklch
}>> = {
  'jam-light': {
    base: { lightness: 0.98, chroma: 0.012, hue: 300 },
    baseContent: { lightness: 0.24, chroma: 0.035, hue: 300 },
    primary: { lightness: 0.43, chroma: 0.2, hue: 300 },
    primaryContent: { lightness: 0.98, chroma: 0.01, hue: 300 },
    secondary: { lightness: 0.54, chroma: 0.14, hue: 330 },
    secondaryContent: { lightness: 0.98, chroma: 0.01, hue: 330 },
    info: { lightness: 0.48, chroma: 0.13, hue: 250 },
    infoContent: { lightness: 0.98, chroma: 0.01, hue: 250 },
    success: { lightness: 0.43, chroma: 0.12, hue: 155 },
    successContent: { lightness: 0.98, chroma: 0.01, hue: 155 },
    warning: { lightness: 0.72, chroma: 0.14, hue: 75 },
    warningContent: { lightness: 0.24, chroma: 0.045, hue: 75 },
    error: { lightness: 0.45, chroma: 0.18, hue: 25 },
    errorContent: { lightness: 0.98, chroma: 0.01, hue: 25 },
    focus: { lightness: 0.43, chroma: 0.2, hue: 300 },
  },
  'jam-dark': {
    base: { lightness: 0.17, chroma: 0.025, hue: 300 },
    baseContent: { lightness: 0.92, chroma: 0.015, hue: 300 },
    primary: { lightness: 0.76, chroma: 0.15, hue: 300 },
    primaryContent: { lightness: 0.2, chroma: 0.04, hue: 300 },
    secondary: { lightness: 0.72, chroma: 0.13, hue: 330 },
    secondaryContent: { lightness: 0.19, chroma: 0.04, hue: 330 },
    info: { lightness: 0.74, chroma: 0.11, hue: 250 },
    infoContent: { lightness: 0.19, chroma: 0.035, hue: 250 },
    success: { lightness: 0.72, chroma: 0.12, hue: 155 },
    successContent: { lightness: 0.18, chroma: 0.03, hue: 155 },
    warning: { lightness: 0.79, chroma: 0.13, hue: 75 },
    warningContent: { lightness: 0.22, chroma: 0.04, hue: 75 },
    error: { lightness: 0.74, chroma: 0.14, hue: 25 },
    errorContent: { lightness: 0.2, chroma: 0.035, hue: 25 },
    focus: { lightness: 0.76, chroma: 0.15, hue: 300 },
  },
}

function relativeLuminance({ lightness, chroma, hue }: Oklch): number {
  const radians = hue * Math.PI / 180
  const a = chroma * Math.cos(radians)
  const b = chroma * Math.sin(radians)

  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b
  const l = lPrime ** 3
  const m = mPrime ** 3
  const s = sPrime ** 3

  const red = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const green = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  const clamp = (channel: number) => Math.min(1, Math.max(0, channel))
  return 0.2126 * clamp(red) + 0.7152 * clamp(green) + 0.0722 * clamp(blue)
}

export function contrastRatio(first: Oklch, second: Oklch): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second))
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second))
  return (lighter + 0.05) / (darker + 0.05)
}
