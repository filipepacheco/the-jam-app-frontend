import type { Locator, Page } from 'playwright'

import type { VisualMatrixCell } from '../../src/workbench/visualMatrix.ts'

export const VISUAL_STABILIZATION_CSS = `
  *, *::before, *::after {
    animation-delay: 0s !important;
    animation-duration: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
    scroll-behavior: auto !important;
  }
`

export interface ScreenshotCaptureOptions {
  page: Page
  cell: VisualMatrixCell
}

const waitForAnimationFrame = (page: Page): Promise<void> =>
  page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))

/** Apply only deterministic, non-product styling required for a comparison. */
export async function stabilizeVisualPage(page: Page, target: Locator): Promise<void> {
  await page.addStyleTag({content: VISUAL_STABILIZATION_CSS})
  await page.evaluate(async () => {
    if ('fonts' in document && document.fonts) await document.fonts.ready
  })
  await waitForAnimationFrame(page)

  let previous = ''
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const box = await target.boundingBox()
    const current = box ? `${box.x}:${box.y}:${box.width}:${box.height}` : 'missing'
    if (current === previous && current !== 'missing') return
    previous = current
    await waitForAnimationFrame(page)
  }
  if (previous === 'missing') throw new Error(`Visual target "${target}" never received a layout box`)
}

const requireTarget = async (page: Page, selector: string, label: string): Promise<Locator> => {
  const locator = page.locator(selector).first()
  if (await locator.count() === 0) throw new Error(`${label} selector "${selector}" did not match the story`)
  return locator
}

export async function performVisualInteraction(page: Page, cell: VisualMatrixCell): Promise<void> {
  if (!cell.interaction) return
  const target = await requireTarget(page, cell.interaction.selector, `${cell.key} interaction`)
  if (cell.interaction.action === 'click') {
    await target.click()
    return
  }
  const key = cell.interaction.key
  if (!key) throw new Error(`${cell.key} press interaction is missing a key`)
  await target.press(key === 'Space' ? ' ' : key)
}

export async function captureVisualCell({page, cell}: ScreenshotCaptureOptions): Promise<Buffer> {
  const target = await requireTarget(page, cell.target.selector, `${cell.key} visual target`)
  const masks: Locator[] = []
  for (const selector of cell.masks) {
    const mask = await requireTarget(page, selector, `${cell.key} mask`)
    masks.push(mask)
  }
  await stabilizeVisualPage(page, target)
  return target.screenshot({
    animations: 'disabled',
    caret: 'hide',
    mask: masks,
    maskColor: '#ff00ff',
    scale: 'css',
  })
}

export const stableVisualFilename = (key: string): string => {
  const filename = key.replace(/[^a-zA-Z0-9._-]+/g, '-')
  if (!filename || filename === '.' || filename === '..') throw new Error(`Invalid visual matrix key "${key}"`)
  return `${filename}.png`
}
