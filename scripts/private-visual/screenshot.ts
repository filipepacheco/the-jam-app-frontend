import type { Page } from 'playwright'

import { VISUAL_VIEWPORTS, type VisualMatrixCell } from './matrix.ts'

export const PRIVATE_VISUAL_CAPTURE_ATTRIBUTE = 'data-private-visual-capture'
export const VISUAL_CAPTURE_FONT_FAMILY = 'Nunito Sans'
export const VISUAL_CAPTURE_FONT_WEIGHTS = [400, 500, 600, 700, 800] as const

export const STABLE_CAPTURE_CSS = `
  *, *::before, *::after {
    animation: none !important;
    caret-color: transparent !important;
    font-synthesis: none !important;
    -webkit-font-smoothing: antialiased !important;
    scroll-behavior: auto !important;
    text-rendering: geometricPrecision !important;
    transition: none !important;
  }
`

/** Every capture operation has the same bounded lifecycle budget. */
export const VISUAL_CAPTURE_TIMEOUT_MS = 15_000

/** Do not wait for Storybook/MSW background work that can outlive a rendered story. */
export const CAPTURE_NAVIGATION_OPTIONS = {
  waitUntil: 'load' as const,
  timeout: VISUAL_CAPTURE_TIMEOUT_MS,
}

export const storyFrameUrl = (serverUrl: string, cell: VisualMatrixCell): string => {
  const origin = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl
  return `${origin}/iframe.html?id=${encodeURIComponent(cell.storyId)}&viewMode=story&globals=theme:${cell.theme};reducedMotion:true`
}

/**
 * Keeps the one reviewed waveform cell's decorative randomness stable in its
 * capture document without changing production behaviour or other stories.
 */
export const installDeterministicCaptureEnvironment = async (
  page: Page,
): Promise<void> => {
  await page.addInitScript(() => {
    const storyId = new URLSearchParams(window.location.search).get('id')
    if (storyId === 'domain-public-dashboard-cards-and-display--current-and-next') {
      Math.random = () => 0.5
    }
  })
}

const waitForStableLayout = async (page: Page, selector: string, readySelector?: string): Promise<void> => {
  const target = page.locator(selector).first()
  await target.waitFor({ state: 'visible', timeout: VISUAL_CAPTURE_TIMEOUT_MS })
  await page.evaluate(async ({ timeout, family, weights }) => {
    const fonts = document.fonts?.ready ?? Promise.resolve()
    await Promise.race([
      fonts,
      new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('Font loading did not settle before capture.')), timeout)),
    ])
    const missingWeights = weights.filter((weight) => !document.fonts.check(`${weight} 16px "${family}"`))
    if (missingWeights.length > 0) {
      throw new Error(`Private visual font "${family}" is unavailable for weights: ${missingWeights.join(', ')}.`)
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  }, { timeout: VISUAL_CAPTURE_TIMEOUT_MS, family: VISUAL_CAPTURE_FONT_FAMILY, weights: VISUAL_CAPTURE_FONT_WEIGHTS })
  if (readySelector) {
    await page.waitForFunction(({ targetSelector, readyContentSelector }) => {
      const root = document.querySelector(targetSelector)
      const ready = document.querySelector<HTMLElement>(readyContentSelector)
      if (!root || !ready || !root.contains(ready)) return false
      for (let element: HTMLElement | null = ready; element && element !== root; element = element.parentElement) {
        const style = getComputedStyle(element)
        if (style.display === 'none' || style.visibility === 'hidden' || Number.parseFloat(style.opacity) < 0.99) return false
      }
      return true
    }, { targetSelector: selector, readyContentSelector: readySelector }, { timeout: VISUAL_CAPTURE_TIMEOUT_MS })
  }

  const before = await target.boundingBox()
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  const after = await target.boundingBox()
  if (!before || !after || before.width !== after.width || before.height !== after.height) {
    throw new Error(`Visual target "${selector}" did not settle to a stable CSS-pixel layout.`)
  }
}

/** Captures a precise component or portal region after fonts and layout settle. */
export const captureVisualCell = async (
  page: Page,
  serverUrl: string,
  cell: VisualMatrixCell,
): Promise<Buffer> => {
  const viewport = VISUAL_VIEWPORTS[cell.viewport]
  await page.setViewportSize(viewport)
  await page.goto(storyFrameUrl(serverUrl, cell), CAPTURE_NAVIGATION_OPTIONS)
  await page.evaluate((attribute) => document.documentElement.setAttribute(attribute, ''), PRIVATE_VISUAL_CAPTURE_ATTRIBUTE)
  await page.addStyleTag({ content: STABLE_CAPTURE_CSS })

  if (cell.readySelector) {
    await page.locator(cell.readySelector).first().waitFor({ state: 'visible', timeout: VISUAL_CAPTURE_TIMEOUT_MS })
  }

  if (cell.checkpoint.kind === 'after-click') {
    await page.locator(cell.checkpoint.selector).first().click({ timeout: VISUAL_CAPTURE_TIMEOUT_MS })
    await page.locator(cell.checkpoint.waitFor).first().waitFor({ state: 'visible', timeout: VISUAL_CAPTURE_TIMEOUT_MS })
  }

  await waitForStableLayout(page, cell.target.selector, cell.readySelector)
  await page.evaluate(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  })
  const masks = cell.masks.map((mask) => page.locator(mask.selector))
  return page.locator(cell.target.selector).first().screenshot({
    animations: 'disabled',
    caret: 'hide',
    mask: masks,
    scale: 'css',
    timeout: VISUAL_CAPTURE_TIMEOUT_MS,
  })
}
