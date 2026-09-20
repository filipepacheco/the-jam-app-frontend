// Review-only geometry check. No production consumers or assets are modified.
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 572, height: 238 }, deviceScaleFactor: 1 })
  await page.route(/^https?:/, route => route.abort())
  const svg = readFileSync(new URL('brand-master.trace.svg', import.meta.url), 'utf8')
  await page.setContent('<style>html,body{margin:0;background:white}svg{display:block;width:572px;height:238px}g{fill:black!important}</style>' + svg)
  const rendered = PNG.sync.read(await page.screenshot())
  const source = PNG.sync.read(readFileSync(new URL('references/original-concepts.png', import.meta.url)))
  let union = 0, intersection = 0, differentThresholdPixels = 0, sourceInkPixels = 0
  for (let y = 0; y < 238; y++) {
    for (let x = 0; x < 572; x++) {
      const a = ((y + 397) * source.width + x + 480) * 4
      const b = (y * rendered.width + x) * 4
      const blackA = source.data[a] + source.data[a + 1] + source.data[a + 2] < 384
      const blackB = rendered.data[b] + rendered.data[b + 1] + rendered.data[b + 2] < 384
      if (blackA) sourceInkPixels++
      if (blackA || blackB) union++
      if (blackA && blackB) intersection++
      if (blackA !== blackB) differentThresholdPixels++
    }
  }
  const result = {
    renderer: `Chromium ${browser.version()}`,
    sourceRegion: { x: 480, y: 397, width: 572, height: 238 },
    comparison: 'Monochrome thresholded silhouette at source size; palette fills excluded.',
    sourceInkPixels,
    intersectionOverUnion: intersection / union,
    differentThresholdPixels,
    totalPixels: 572 * 238,
    approval: 'Automated fidelity measurement only; does not replace human SVG approval.',
  }
  writeFileSync(new URL('trace-verification.json', import.meta.url), JSON.stringify(result, null, 2) + '\n')
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  await page.setViewportSize({ width: 1300, height: 1000 })
  await page.goto(new URL('review.html', import.meta.url).href)
  await page.screenshot({ path: '/private/tmp/together-warm-review.png', fullPage: true })
  if (result.intersectionOverUnion < 0.99) throw new Error('Trace silhouette fidelity below 99%')
} finally {
  await browser.close()
}
