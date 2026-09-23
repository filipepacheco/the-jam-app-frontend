import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CONTROL_SIZES,
  REFERENCE_THEMES,
  SELECTABLE_THEMES,
  THEME_METADATA,
  SEMANTIC_COLOR_ROLES,
  SPACING,
  contrastRatio,
  resolveThemeName,
  type ReferenceThemeName,
} from '../design-system/foundations'

const foundationCss = readFileSync(
  resolve(process.cwd(), 'src/design-system/foundations.css'),
  'utf8',
)

describe('design-system foundations', () => {
  it('publishes semantic roles for every color responsibility', () => {
    expect(Object.keys(SEMANTIC_COLOR_ROLES)).toEqual([
      'surfaces',
      'content',
      'borders',
      'actions',
      'focus',
      'statuses',
    ])

    for (const tokens of Object.values(SEMANTIC_COLOR_ROLES)) {
      for (const token of tokens) {
        expect(foundationCss).toContain(`${token}:`)
      }
    }
  })

  it('exposes only the Jam light and dark themes', () => {
    expect(SELECTABLE_THEMES).toEqual(['jam-light', 'jam-dark'])
    expect(new Set(SELECTABLE_THEMES).size).toBe(SELECTABLE_THEMES.length)
    expect(foundationCss).toContain('themes: false')
    expect(foundationCss).toContain('name: "jam-light"')
    expect(foundationCss).toContain('name: "jam-dark"')
  })

  it('gives every selectable theme an explicit surrounding-surface brand treatment', () => {
    expect(Object.keys(THEME_METADATA)).toEqual([...SELECTABLE_THEMES])

    for (const theme of SELECTABLE_THEMES) {
      expect(THEME_METADATA[theme].brandSurface).toMatch(/^(light|dark)$/)
    }

    expect(THEME_METADATA['jam-light'].brandSurface).toBe('light')
    expect(THEME_METADATA['jam-dark'].brandSurface).toBe('dark')
  })

  it('validates product theme names with the light fallback', () => {
    expect(resolveThemeName('jam-light')).toBe('jam-light')
    expect(resolveThemeName('jam-dark')).toBe('jam-dark')
    expect(resolveThemeName('stale-theme')).toBe('jam-light')
    expect(resolveThemeName(null)).toBe('jam-light')
  })

  it.each(Object.entries(REFERENCE_THEMES) as [ReferenceThemeName, (typeof REFERENCE_THEMES)[ReferenceThemeName]][])(
    '%s meets text, action, and status contrast thresholds',
    (_name, theme) => {
      expect(contrastRatio(theme.baseContent, theme.base)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(theme.primaryContent, theme.primary)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(theme.secondaryContent, theme.secondary)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(theme.accentContent, theme.accent)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(theme.infoContent, theme.info)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(theme.successContent, theme.success)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(theme.warningContent, theme.warning)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(theme.errorContent, theme.error)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(theme.focus, theme.base)).toBeGreaterThanOrEqual(3)
    },
  )

  it('uses the semantic four-point spacing scale and venue-safe controls', () => {
    expect(Object.values(SPACING)).toEqual([4, 8, 12, 16, 24, 32, 48, 64, 96])
    expect(Object.values(SPACING).every((value) => value % 4 === 0)).toBe(true)
    expect(CONTROL_SIZES.touchTarget).toBeGreaterThanOrEqual(44)
    expect(CONTROL_SIZES.sharedDisplayTarget).toBeGreaterThan(CONTROL_SIZES.touchTarget)
  })

  it('publishes typography, overflow, and context-specific responsive contracts', () => {
    expect(foundationCss).toContain('--ds-text-display: 2rem')
    expect(foundationCss).toContain('--ds-text-body: 1rem')
    expect(foundationCss).toContain('--ds-text-ui: 1rem')
    expect(foundationCss).toContain('--ds-weight-display: 800')
    expect(foundationCss).toContain('--ds-weight-body: 400')
    expect(foundationCss).toContain('--ds-weight-ui: 500')
    expect(foundationCss).toContain('--ds-leading-display: 1.15')
    expect(foundationCss).toContain('--ds-leading-body: 1.55')
    expect(foundationCss).toContain('--ds-leading-ui: 1.35')
    expect(foundationCss).toMatch(/\.ds-type-ui\s*\{[\s\S]*font-size:\s*var\(--ds-text-ui\)[\s\S]*font-weight:\s*var\(--ds-weight-ui\)[\s\S]*line-height:\s*var\(--ds-leading-ui\)/)
    expect(foundationCss).toMatch(/\.ds-truncate-single\s*\{[\s\S]*text-overflow:\s*ellipsis/)
    expect(foundationCss).toMatch(/\.ds-wrap-user-content\s*\{[\s\S]*overflow-wrap:\s*anywhere/)
    expect(foundationCss).toContain('.ds-control--host')
    expect(foundationCss).toContain('.ds-shared-display')
    expect(foundationCss).toContain('.ds-control--shared-display')
    expect(foundationCss).toContain('@media (min-width: 64rem)')
    expect(foundationCss).toContain('@media (min-width: 90rem)')
  })

  it('encodes keyboard focus and reduced-motion behavior in production CSS', () => {
    expect(foundationCss).toMatch(/:focus-visible\s*{/)
    expect(foundationCss).toContain('@media (prefers-reduced-motion: reduce)')
    expect(foundationCss).toContain('animation-duration: 0.01ms !important')
    expect(foundationCss).toContain('transition-duration: 0.01ms !important')
    expect(foundationCss).toContain('scroll-behavior: auto !important')
  })

  it('keeps the shared control utility at the documented touch target', () => {
    expect(foundationCss).toMatch(
      /\.ds-control\s*\{[^}]*min-block-size:\s*var\(--ds-control-touch\)[^}]*min-inline-size:\s*var\(--ds-control-touch\)/s,
    )
    expect(foundationCss).toContain('--ds-control-touch: 2.75rem')
  })
})
