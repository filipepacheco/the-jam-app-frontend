import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {PNG} from 'pngjs'
import {describe, expect, it} from 'vitest'

describe('generated social brand image', () => {
  it.each(['social-1200x630.png', 'social-hybrid-1200x630.png', 'social-hybrid-1200x630-v2.png'])(
    '%s uses the approved white treatment with open a and p counters', (filename) => {
      const png = PNG.sync.read(readFileSync(resolve('public/brand/v1', filename)))
      const pixel = (x: number, y: number) => {
        const offset = (y * png.width + x) * 4
        return Array.from(png.data.subarray(offset, offset + 4))
      }

      expect([png.width, png.height]).toEqual([1200, 630])
      expect(pixel(0, 0)).toEqual([255, 255, 255, 255])
      // Interior points in the four enclosed letter spaces of the approved
      // fixed lockup: the large a, then a/p/p in the small "app" wordmark.
      for (const [x, y] of [[690, 350], [897, 423], [925, 423], [954, 423]]) {
        expect(pixel(x, y), `letter counter at ${x},${y}`).toEqual([255, 255, 255, 255])
      }
      expect(pixel(650, 350)).toEqual([38, 23, 51, 255])
      expect(pixel(347, 240)).toEqual([113, 56, 201, 255])
    },
  )
})
