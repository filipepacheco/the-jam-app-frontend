import { describe, expect, it } from 'vitest'
import { computeDropIndex, computeAutoScrollSpeed, moveItem } from '../../../lib/schedule/reorderGeometry'

describe('computeDropIndex', () => {
  // Three 40px-tall items stacked with no gaps: [0,40), [40,80), [80,120)
  const items = [
    { top: 0, bottom: 40 },
    { top: 40, bottom: 80 },
    { top: 80, bottom: 120 },
  ]

  it('returns the index of the item when touch is in its top half', () => {
    expect(computeDropIndex(items, 10)).toBe(0)
  })

  it('returns index + 1 when touch is in the bottom half of an item', () => {
    expect(computeDropIndex(items, 30)).toBe(1)
  })

  it('returns the middle item’s index when touch is exactly at its top', () => {
    expect(computeDropIndex(items, 40)).toBe(1)
  })

  it('returns 0 when touch is above the first item', () => {
    expect(computeDropIndex(items, -20)).toBe(0)
  })

  it('returns items.length when touch is below the last item', () => {
    expect(computeDropIndex(items, 200)).toBe(3)
  })

  it('returns null for an empty item list', () => {
    expect(computeDropIndex([], 10)).toBeNull()
  })

  it('returns null when the pointer is in the gap between items', () => {
    // The real list renders with space-y-2, so gaps genuinely exist and the
    // caller must treat "no target" as "leave the order alone".
    const spaced = [
      { top: 0, bottom: 40 },
      { top: 48, bottom: 88 },
    ]
    expect(computeDropIndex(spaced, 44)).toBeNull()
  })

  it('skips items with no mounted DOM node instead of treating them as a zero rect', () => {
    // A missing *last* node must not make every pointer position resolve to
    // "drop at the end" - that was the bug a naive {top:0,bottom:0} caused.
    const withMissingLast = [
      { top: 100, bottom: 140 },
      { top: 148, bottom: 188 },
      null,
    ]
    expect(computeDropIndex(withMissingLast, 110)).toBe(0)
    expect(computeDropIndex(withMissingLast, 50)).toBe(0) // above the first real item
    expect(computeDropIndex(withMissingLast, 500)).toBe(3) // below the last real item
  })

  it('ignores a missing first node when testing the above-first fallback', () => {
    const withMissingFirst = [null, { top: 100, bottom: 140 }]
    expect(computeDropIndex(withMissingFirst, 50)).toBe(0)
  })
})

describe('computeAutoScrollSpeed', () => {
  const viewportHeight = 800
  const edgeZone = 80
  const maxSpeed = 16

  it('returns 0 when touch is outside both edge zones', () => {
    expect(computeAutoScrollSpeed(400, viewportHeight, edgeZone, maxSpeed)).toBe(0)
  })

  it('returns a negative speed (scroll up) near the top edge, faster closer to the edge', () => {
    const atEdge = computeAutoScrollSpeed(0, viewportHeight, edgeZone, maxSpeed)
    const nearEdge = computeAutoScrollSpeed(40, viewportHeight, edgeZone, maxSpeed)
    expect(atEdge).toBeLessThan(0)
    expect(Math.abs(atEdge)).toBeGreaterThan(Math.abs(nearEdge))
  })

  it('returns a positive speed (scroll down) near the bottom edge, faster closer to the edge', () => {
    const atEdge = computeAutoScrollSpeed(viewportHeight, viewportHeight, edgeZone, maxSpeed)
    const nearEdge = computeAutoScrollSpeed(viewportHeight - 40, viewportHeight, edgeZone, maxSpeed)
    expect(atEdge).toBeGreaterThan(0)
    expect(atEdge).toBeGreaterThan(nearEdge)
  })

  it('never exceeds maxSpeed in magnitude', () => {
    expect(Math.abs(computeAutoScrollSpeed(0, viewportHeight, edgeZone, maxSpeed))).toBeLessThanOrEqual(maxSpeed)
    expect(Math.abs(computeAutoScrollSpeed(viewportHeight, viewportHeight, edgeZone, maxSpeed))).toBeLessThanOrEqual(maxSpeed)
  })
})

describe('moveItem', () => {
  it('moves an item forward in the array', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('moves an item backward in the array', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('is a no-op when fromIndex equals toIndex', () => {
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c'])
  })

  it('does not mutate the original array', () => {
    const original = ['a', 'b', 'c']
    moveItem(original, 0, 2)
    expect(original).toEqual(['a', 'b', 'c'])
  })
})
