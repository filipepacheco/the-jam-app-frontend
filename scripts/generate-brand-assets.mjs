/**
 * Generate the approved Jam App hybrid v1 asset bundle.
 *
 * Authority: Together #2 symbol geometry is imported from its protected
 * contour trace; the In The Groove #3 wordmark is contour-traced from the
 * checked-in source raster. This is intentionally a build-time tool only.
 *
 * Run from the repository root: node scripts/generate-brand-assets.mjs
 */
import { createHash } from 'node:crypto'
import { readFileSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('..', import.meta.url))
const sourceDirectory = `${root}brand/jam-hybrid-v1`
const outputDirectory = `${root}public/brand/v1`
const wordmarkSource = `${sourceDirectory}/references/in-the-groove-wordmark-source.png`
const togetherSymbol = `${root}brand/together-warm/symbol-light.trace.svg`
const togetherSource = `${root}brand/together-warm/references/original-concepts.png`
const warmSymbolSha256 = '48397daf36db3e3a9a9ccf579cd60fead24b86d1b6fe28d9820f1d7aa9e57e9b'
const wordmarkSourceSha256 = 'ad6a3c6010891cab21c5a65e7c2a8a1bc0c582c14ba1dcef515acf53c5e17af1'
const warm = { violet: '#7138C9', violetLight: '#AF83ED', coral: '#F06465', amber: '#EAA12B', plum: '#261733' }

const sha256 = value => createHash('sha256').update(value).digest('hex')
const write = (path, data) => writeFileSync(path, data)
const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

mkdirSync(`${sourceDirectory}/references`, { recursive: true })
mkdirSync(outputDirectory, { recursive: true })

if (sha256(readFileSync(togetherSource)) !== warmSymbolSha256) {
  throw new Error('Together #2 reference checksum does not match the approved raster board')
}
if (sha256(readFileSync(wordmarkSource)) !== wordmarkSourceSha256) {
  throw new Error('In The Groove #3 wordmark reference checksum does not match the approved source')
}

const wordmarkPng = PNG.sync.read(readFileSync(wordmarkSource))
const wordmarkBounds = { x0: 150, y0: 80, x1: 600, y1: 300 }
const isInk = (x, y) => {
  const i = (y * wordmarkPng.width + x) * 4
  return wordmarkPng.data[i] + wordmarkPng.data[i + 1] + wordmarkPng.data[i + 2] < 650
}

// The top lockup is deliberately cropped away from the reference label and
// dark sample. Four-connected components preserve each visible glyph exactly.
const labels = new Int32Array(wordmarkPng.width * wordmarkPng.height).fill(-1)
const components = []
for (let y = wordmarkBounds.y0; y < wordmarkBounds.y1; y++) {
  for (let x = wordmarkBounds.x0; x < wordmarkBounds.x1; x++) {
    const start = y * wordmarkPng.width + x
    if (labels[start] >= 0 || !isInk(x, y)) continue
    const component = { x0: x, x1: x, y0: y, y1: y, pixels: 0, id: components.length }
    const queue = [[x, y]]
    labels[start] = component.id
    for (let index = 0; index < queue.length; index++) {
      const [cx, cy] = queue[index]
      component.pixels++
      component.x0 = Math.min(component.x0, cx); component.x1 = Math.max(component.x1, cx)
      component.y0 = Math.min(component.y0, cy); component.y1 = Math.max(component.y1, cy)
      for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
        const target = ny * wordmarkPng.width + nx
        if (nx < wordmarkBounds.x0 || nx >= wordmarkBounds.x1 || ny < wordmarkBounds.y0 || ny >= wordmarkBounds.y1 || labels[target] >= 0 || !isInk(nx, ny)) continue
        labels[target] = component.id
        queue.push([nx, ny])
      }
    }
    components.push(component)
  }
}
const significant = components.filter(component => component.pixels > 10).sort((a, b) => a.x0 - b.x0 || a.y0 - b.y0)
if (significant.length !== 7) throw new Error(`In The Groove source changed: expected seven wordmark components, found ${significant.length}`)

const cases = [[], [[0, 3]], [[0, 1]], [[3, 1]], [[1, 2]], [[0, 3], [1, 2]], [[0, 2]], [[3, 2]], [[2, 3]], [[0, 2]], [[0, 1], [2, 3]], [[1, 2]], [[3, 1]], [[0, 1]], [[0, 3]], []]
const distance = (point, start, end) => {
  const dx = end[0] - start[0], dy = end[1] - start[1]
  const t = dx || dy ? Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy))) : 0
  return Math.hypot(point[0] - start[0] - t * dx, point[1] - start[1] - t * dy)
}
const simplify = (points, tolerance = 0.18) => {
  if (points.length < 3) return points
  let maximum = 0, split = 0
  for (let index = 1; index < points.length - 1; index++) {
    const current = distance(points[index], points[0], points.at(-1))
    if (current > maximum) { maximum = current; split = index }
  }
  return maximum > tolerance
    ? [...simplify(points.slice(0, split + 1), tolerance).slice(0, -1), ...simplify(points.slice(split), tolerance)]
    : [points[0], points.at(-1)]
}
const format = value => String(Math.round(value * 1000) / 1000)
function trace(component) {
  const points = new Map(), adjacent = new Map(), segments = []
  const value = (x, y) => labels[y * wordmarkPng.width + x] === component.id ? (isInk(x, y) ? 1 : 0) : 0
  for (let y = component.y0 - 1; y <= component.y1; y++) {
    for (let x = component.x0 - 1; x <= component.x1; x++) {
      const values = [value(x, y), value(x + 1, y), value(x + 1, y + 1), value(x, y + 1)]
      const code = values.reduce((sum, current, index) => sum + (current >= 0.5 ? 1 << index : 0), 0)
      const edge = edgeIndex => {
        const definitions = [
          [`h:${x}:${y}`, [x + 0.5, y + 0.5], [x + 1.5, y + 0.5], values[0], values[1]],
          [`v:${x + 1}:${y}`, [x + 1.5, y + 0.5], [x + 1.5, y + 1.5], values[1], values[2]],
          [`h:${x}:${y + 1}`, [x + 0.5, y + 1.5], [x + 1.5, y + 1.5], values[3], values[2]],
          [`v:${x}:${y}`, [x + 0.5, y + 0.5], [x + 0.5, y + 1.5], values[0], values[3]],
        ]
        const [key, start, end, from, to] = definitions[edgeIndex]
        const interpolation = (0.5 - from) / (to - from)
        points.set(key, [start[0] + (end[0] - start[0]) * interpolation, start[1] + (end[1] - start[1]) * interpolation])
        return key
      }
      for (const pair of cases[code]) {
        const keys = pair.map(edge), segmentIndex = segments.length
        segments.push(keys)
        for (const key of keys) adjacent.set(key, [...(adjacent.get(key) || []), segmentIndex])
      }
    }
  }
  const seen = new Set(), loops = []
  for (let index = 0; index < segments.length; index++) {
    if (seen.has(index)) continue
    const start = segments[index][0], loop = [points.get(start)]
    let key = start, segmentIndex = index
    do {
      seen.add(segmentIndex)
      const segment = segments[segmentIndex]
      key = segment[0] === key ? segment[1] : segment[0]
      loop.push(points.get(key))
      if (key === start) break
      segmentIndex = adjacent.get(key).find(candidate => !seen.has(candidate))
      if (segmentIndex === undefined) throw new Error('Open contour in In The Groove wordmark trace')
    } while (true)
    const midpoint = Math.floor((loop.length - 1) / 2)
    const reduced = [...simplify(loop.slice(0, midpoint + 1)).slice(0, -1), ...simplify(loop.slice(midpoint)).slice(0, -1)]
    loops.push(`M${reduced.map(point => point.map(format).join(' ')).join('L')}Z`)
  }
  return loops.join('')
}

const wordmarkPaths = significant.map(trace)
const symbolGroups = readFileSync(togetherSymbol, 'utf8')
  .match(/<g id="performer-top"[\s\S]*?<\/g>\n  <g id="performer-right"[\s\S]*?<\/g>\n  <g id="performer-left"[\s\S]*?<\/g>/)?.[0]
if (!symbolGroups) throw new Error('Could not locate the approved Together #2 symbol groups')
const wordmarkGroups = `  <g id="wordmark" fill="${warm.plum}">\n${wordmarkPaths.map(path => `    <path d="${path}"/>`).join('\n')}\n  </g>`
const wordmarkTrace = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="170 90 405 200" fill-rule="evenodd">\n  <title>Jam App In The Groove wordmark</title>\n  <metadata>Approved 2026-09-20. Contour trace of in-the-groove-wordmark-source.png. SHA-256 ${wordmarkSourceSha256}. The upper 03 / In The Groove jam app lockup governs lettering.</metadata>\n${wordmarkGroups}\n</svg>\n`
const symbolSvg = ({ dark = false } = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="480 397 228 238" fill-rule="evenodd">\n  <title>Jam App Together symbol</title>\n  <metadata>Approved 2026-09-20. Exact Together #2 symbol geometry imported from the checksum-protected Warm source trace.</metadata>\n${symbolGroups.replace(warm.violet, dark ? warm.violetLight : warm.violet)}\n</svg>\n`
const masterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 300" fill="none" fill-rule="evenodd">\n  <title>Jam App hybrid lockup</title>\n  <metadata>Approved 2026-09-20. Exact Together #2 symbol geometry and traced In The Groove #3 rounded jam app lettering. Sources: original-concepts.png SHA-256 ${warmSymbolSha256}; in-the-groove-wordmark-source.png SHA-256 ${wordmarkSourceSha256}. Warm palette flat fills.</metadata>\n  <g id="symbol" transform="translate(-462 -366)">\n${symbolGroups}\n  </g>\n  <g id="wordmark" transform="translate(100 -42)" fill="${warm.plum}">\n${wordmarkPaths.map(path => `    <path d="${path}"/>`).join('\n')}\n  </g>\n</svg>\n`

write(`${sourceDirectory}/wordmark.trace.svg`, wordmarkTrace)
write(`${sourceDirectory}/symbol-light.svg`, symbolSvg())
write(`${sourceDirectory}/symbol-dark.svg`, symbolSvg({ dark: true }))
write(`${sourceDirectory}/brand-master.svg`, masterSvg)
write(`${outputDirectory}/logo.svg`, masterSvg)
write(`${outputDirectory}/symbol.svg`, symbolSvg())
write(`${outputDirectory}/favicon.svg`, symbolSvg())

const htmlFor = (svg, width, height, background = 'transparent') => `<!doctype html><style>html,body{margin:0;width:100%;height:100%;background:${background}}svg{display:block;width:${width}px;height:${height}px}</style>${svg}`
const pngFromSvg = async (browser, svg, width, height, background = 'transparent') => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await page.route(/^https?:/, route => route.abort())
  await page.setContent(htmlFor(svg, width, height, background))
  const png = await page.screenshot({ omitBackground: background === 'transparent', type: 'png' })
  await page.close()
  return png
}
const iconSvg = (size, padding, maskable = false) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${warm.plum}"/>${maskable ? '' : `<rect x="${padding}" y="${padding}" width="${size - padding * 2}" height="${size - padding * 2}" rx="${Math.round(size * 0.17)}" fill="#fff"/>`}<svg x="${padding + (maskable ? 0 : 8)}" y="${padding + (maskable ? 0 : 8)}" width="${size - (padding + (maskable ? 0 : 8)) * 2}" height="${size - (padding + (maskable ? 0 : 8)) * 2}" viewBox="480 397 228 238">${symbolGroups}</svg></svg>`
const socialSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${warm.plum}"/><g transform="translate(190 165) scale(1.17)">${masterSvg.replace(/^<svg[^>]*>|<\/svg>$/g, '').replaceAll(warm.violet, warm.violetLight).replaceAll(warm.plum, warm.violetLight)}</g></svg>`

const browser = await chromium.launch({ headless: true })
try {
  const transparentFaviconSizes = [16, 32, 96]
  const pngs = new Map()
  for (const size of transparentFaviconSizes) {
    const png = await pngFromSvg(browser, symbolSvg(), size, size)
    pngs.set(size, png)
    write(`${outputDirectory}/favicon-${size}.png`, png)
  }
  for (const [name, size, padding, maskable] of [['apple-touch-icon.png', 180, 18, false], ['icon-192.png', 192, 20, false], ['icon-512.png', 512, 52, false], ['icon-maskable-512.png', 512, 74, true]]) {
    write(`${outputDirectory}/${name}`, await pngFromSvg(browser, iconSvg(size, padding, maskable), size, size, warm.plum))
  }
  write(`${outputDirectory}/social-1200x630.png`, await pngFromSvg(browser, socialSvg, 1200, 630, warm.plum))
  const icoImages = [16, 32].map(size => ({ size, data: pngs.get(size) }))
  const header = Buffer.alloc(6 + icoImages.length * 16)
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(icoImages.length, 4)
  let offset = header.length
  icoImages.forEach(({ size, data }, index) => {
    const entry = 6 + index * 16
    header.writeUInt8(size === 256 ? 0 : size, entry); header.writeUInt8(size === 256 ? 0 : size, entry + 1)
    header.writeUInt8(0, entry + 2); header.writeUInt8(0, entry + 3); header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(data.length, entry + 8); header.writeUInt32LE(offset, entry + 12); offset += data.length
  })
  write(`${root}public/favicon.ico`, Buffer.concat([header, ...icoImages.map(image => image.data)]))
} finally {
  await browser.close()
}

const outputs = [
  'brand-master.svg', 'symbol-light.svg', 'symbol-dark.svg', 'wordmark.trace.svg',
  '../public/brand/v1/logo.svg', '../public/brand/v1/symbol.svg', '../public/brand/v1/favicon.svg',
  '../public/brand/v1/favicon-16.png', '../public/brand/v1/favicon-32.png', '../public/brand/v1/favicon-96.png', '../public/brand/v1/apple-touch-icon.png',
  '../public/brand/v1/icon-192.png', '../public/brand/v1/icon-512.png', '../public/brand/v1/icon-maskable-512.png',
  '../public/brand/v1/social-1200x630.png', '../public/favicon.ico',
]
const digest = path => sha256(readFileSync(path.startsWith('../') ? `${root}${path.slice(2)}` : `${sourceDirectory}/${path}`))
const provenance = {
  version: 'v1',
  generator: 'scripts/generate-brand-assets.mjs',
  inputs: {
    togetherSymbolReference: { path: 'brand/together-warm/references/original-concepts.png', sha256: warmSymbolSha256 },
    inTheGrooveWordmarkReference: { path: 'brand/jam-hybrid-v1/references/in-the-groove-wordmark-source.png', sha256: wordmarkSourceSha256, crop: wordmarkBounds },
  },
  trace: { connectedComponents: significant.map(({ id, ...component }) => component), threshold: 'rgb channel sum < 650', simplificationTolerance: 0.18 },
  palette: warm,
  outputs: Object.fromEntries(outputs.map(path => [path.replace(/^\.\.\/public\//, 'public/'), digest(path)])),
}
write(`${sourceDirectory}/provenance.json`, `${JSON.stringify(provenance, null, 2)}\n`)
process.stdout.write(`Generated Jam App hybrid v1 assets (${outputs.length} outputs).\n`)
