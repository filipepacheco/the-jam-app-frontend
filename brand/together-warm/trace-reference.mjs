/**
 * Reconstruct review-only SVG paths from the exact original #02 raster.
 * This is a contour trace, not a new drawing and not an approved vector master.
 * Run from the repository root: node brand/together-warm/trace-reference.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const here = fileURLToPath(new URL('.', import.meta.url))
const input = readFileSync(`${here}references/original-concepts.png`)
const sourceSha256 = createHash('sha256').update(input).digest('hex')
if (sourceSha256 !== '48397daf36db3e3a9a9ccf579cd60fead24b86d1b6fe28d9820f1d7aa9e57e9b') {
  throw new Error('Original source checksum does not match the approved comparison board')
}
const png = PNG.sync.read(input)
const bounds = { x0: 470, y0: 385, x1: 1080, y1: 645 }
const labels = new Int32Array(png.width * png.height).fill(-1)
const strength = (x, y) => {
  const i = (y * png.width + x) * 4
  return 1 - (png.data[i] + png.data[i + 1] + png.data[i + 2]) / (3 * 255)
}

// Label each separate ink component in the approved middle-row lockup.
const components = []
for (let y = bounds.y0; y < bounds.y1; y++) {
  for (let x = bounds.x0; x < bounds.x1; x++) {
    const start = y * png.width + x
    if (labels[start] >= 0 || strength(x, y) < 0.5) continue
    const id = components.length
    const queue = [[x, y]]
    labels[start] = id
    const c = { x0: x, y0: y, x1: x, y1: y, pixels: 0 }
    while (queue.length) {
      const [cx, cy] = queue.pop()
      c.pixels++
      c.x0 = Math.min(c.x0, cx)
      c.x1 = Math.max(c.x1, cx)
      c.y0 = Math.min(c.y0, cy)
      c.y1 = Math.max(c.y1, cy)
      for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
        if (nx < bounds.x0 || nx >= bounds.x1 || ny < bounds.y0 || ny >= bounds.y1) continue
        const i = ny * png.width + nx
        if (labels[i] >= 0 || strength(nx, ny) < 0.5) continue
        labels[i] = id
        queue.push([nx, ny])
      }
    }
    components.push(c)
  }
}
const significant = components.map((c, id) => ({ ...c, id })).filter(c => c.pixels > 20)
if (significant.length !== 13) throw new Error('Reference changed: expected 13 separate ink components')

const cases = [[], [[0, 3]], [[0, 1]], [[3, 1]], [[1, 2]], [[0, 3], [1, 2]],
  [[0, 2]], [[3, 2]], [[2, 3]], [[0, 2]], [[0, 1], [2, 3]], [[1, 2]],
  [[3, 1]], [[0, 1]], [[0, 3]], []]
const distance = (p, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const t = dx || dy ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy))) : 0
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
}
const simplify = (points, epsilon = 0.18) => {
  if (points.length < 3) return points
  let max = 0, split = 0
  for (let i = 1; i < points.length - 1; i++) {
    const d = distance(points[i], points[0], points.at(-1))
    if (d > max) { max = d; split = i }
  }
  return max > epsilon
    ? [...simplify(points.slice(0, split + 1), epsilon).slice(0, -1), ...simplify(points.slice(split), epsilon)]
    : [points[0], points.at(-1)]
}
const format = n => String(Math.round(n * 1000) / 1000)

function trace(c) {
  const points = new Map(), adjacent = new Map(), segments = []
  const value = (x, y) => labels[y * png.width + x] === c.id ? strength(x, y) : Math.min(strength(x, y), 0.499999)
  for (let y = c.y0 - 1; y <= c.y1; y++) {
    for (let x = c.x0 - 1; x <= c.x1; x++) {
      const v = [value(x, y), value(x + 1, y), value(x + 1, y + 1), value(x, y + 1)]
      const code = v.reduce((sum, n, i) => sum + (n >= 0.5 ? 1 << i : 0), 0)
      const edge = e => {
        const defs = [
          [`h:${x}:${y}`, [x + 0.5, y + 0.5], [x + 1.5, y + 0.5], v[0], v[1]],
          [`v:${x + 1}:${y}`, [x + 1.5, y + 0.5], [x + 1.5, y + 1.5], v[1], v[2]],
          [`h:${x}:${y + 1}`, [x + 0.5, y + 1.5], [x + 1.5, y + 1.5], v[3], v[2]],
          [`v:${x}:${y}`, [x + 0.5, y + 0.5], [x + 0.5, y + 1.5], v[0], v[3]],
        ]
        const [key, a, b, va, vb] = defs[e]
        const t = (0.5 - va) / (vb - va)
        points.set(key, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
        return key
      }
      for (const pair of cases[code]) {
        const keys = pair.map(edge), index = segments.length
        segments.push(keys)
        for (const key of keys) {
          const entries = adjacent.get(key) || []
          entries.push(index)
          adjacent.set(key, entries)
        }
      }
    }
  }
  const seen = new Set(), loops = []
  for (let i = 0; i < segments.length; i++) {
    if (seen.has(i)) continue
    const start = segments[i][0], loop = [points.get(start)]
    let key = start, index = i
    do {
      seen.add(index)
      const segment = segments[index]
      key = segment[0] === key ? segment[1] : segment[0]
      loop.push(points.get(key))
      if (key === start) break
      index = adjacent.get(key).find(n => !seen.has(n))
      if (index === undefined) throw new Error('Open contour in reference trace')
    } while (true)
    const midpoint = Math.floor((loop.length - 1) / 2)
    const reduced = [...simplify(loop.slice(0, midpoint + 1)).slice(0, -1), ...simplify(loop.slice(midpoint)).slice(0, -1)]
    loops.push(`M${reduced.map(p => p.map(format).join(' ')).join('L')}Z`)
  }
  return loops.join('')
}

// Mapping is tied to the checksum-protected original board, in scan order.
const groups = [
  { id: 'performer-top', indices: [0, 1], light: '#7138C9', dark: '#AF83ED' },
  { id: 'performer-right', indices: [6, 9], light: '#F06465', dark: '#F06465' },
  { id: 'performer-left', indices: [7, 8], light: '#EAA12B', dark: '#EAA12B' },
  { id: 'wordmark', indices: [2, 3, 4, 5, 10, 11, 12], light: '#261733' },
]
const paths = significant.map(trace)
function svg({ symbol = false, dark = false } = {}) {
  const selected = groups.filter(g => !symbol || g.id !== 'wordmark')
  const viewBox = symbol ? '480 397 228 238' : '480 397 572 238'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill-rule="evenodd">\n` +
    `  <title>Jam App Together — reconstructed vector candidate</title>\n` +
    `  <metadata>Contour trace of original-concepts.png row 02. SHA-256 ${sourceSha256}. Approval authority remains the raster reference; this SVG requires fidelity review. Threshold 0.5; contour simplification tolerance 0.18 source pixels. Palette B flat production fills.</metadata>\n` +
    selected.map(g => `  <g id="${g.id}" fill="${dark ? g.dark : g.light}">\n` +
      g.indices.map(index => `    <path d="${paths[index]}"/>`).join('\n') + '\n  </g>').join('\n') + '\n</svg>\n'
}
writeFileSync(`${here}brand-master.trace.svg`, svg())
writeFileSync(`${here}symbol-light.trace.svg`, svg({ symbol: true }))
writeFileSync(`${here}symbol-dark.trace.svg`, svg({ symbol: true, dark: true }))
writeFileSync(`${here}trace-provenance.json`, JSON.stringify({ sourceSha256, threshold: 0.5, simplificationTolerance: 0.18, sourceRegion: bounds, lockupViewBox: [480, 397, 572, 238], symbolViewBox: [480, 397, 228, 238], components: significant, groups }, null, 2) + '\n')
process.stdout.write(`Traced ${significant.length} components from original #02. SVG candidates require fidelity review.\n`)
