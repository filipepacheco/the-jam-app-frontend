import type { Page } from 'playwright'

import { VISUAL_VIEWPORTS, type VisualMatrixCell } from './matrix.ts'

const STABLE_CAPTURE_CSS = `
  *, *::before, *::after {
    animation-delay: 0s !important;
    animation-duration: 0s !important;
    caret-color: transparent !important;
    scroll-behavior: auto !important;
    transition-delay: 0s !important;
    transition-duration: 0s !important;
  }
`

export const storyFrameUrl = (serverUrl: string, cell: VisualMatrixCell): string => {
  const origin = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl
  return `${origin}/iframe.html?id=${encodeURIComponent(cell.storyId)}&viewMode=story&globals=theme:${cell.theme};reducedMotion:true`
}

const waitForStableLayout = async (page: Page, selector: string): Promise<void> => {
  await page.locator(selector).first().waitFor({ state: 'visible' })
  await page.evaluate(async () => {
    await document.fonts?.ready
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  })

  const target = page.locator(selector).first()
  const before = await target.boundingBox()
  await page.waitForTimeout(80)
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
  await page.goto(storyFrameUrl(serverUrl, cell), { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: STABLE_CAPTURE_CSS })

  if (cell.checkpoint.kind === 'after-click') {
    await page.locator(cell.checkpoint.selector).first().click()
    await page.locator(cell.checkpoint.waitFor).first().waitFor({ state: 'visible' })
  }

  await waitForStableLayout(page, cell.target.selector)
  await page.evaluate(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  })
  const masks = cell.masks.map((mask) => page.locator(mask.selector).first())
  return page.locator(cell.target.selector).first().screenshot({
    animations: 'disabled',
    caret: 'hide',
    mask: masks,
    scale: 'css',
  })
}
