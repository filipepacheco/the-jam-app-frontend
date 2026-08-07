/**
 * Pure geometry/array-move functions behind drag-to-reorder interactions.
 * Extracted from LiveJamControlPanel so the touch/mouse/keyboard reorder hooks
 * can share tested logic instead of each reimplementing it.
 */

export interface ItemRect {
  top: number
  bottom: number
}

/**
 * Given the vertical rects of items in order and a pointer's Y position,
 * returns the "gap" index the pointer is hovering over - i.e. where an item
 * would land if dropped now. Splits each item at its midpoint: the top half
 * targets the item's own index, the bottom half targets index + 1.
 *
 * Entries may be null for items with no mounted DOM node; those are skipped
 * rather than treated as a zero-height rect at the top of the page, which
 * would otherwise drag the above-first / below-last fallbacks off target.
 *
 * Returns null when there is nothing to target - no items, or the pointer is
 * in the gap between two items (the list is rendered with vertical spacing).
 */
export function computeDropIndex(
  items: (ItemRect | null | undefined)[],
  pointerY: number,
): number | null {
  let overIndex: number | null = null

  items.forEach((item, index) => {
    if (!item) return
    const middle = item.top + (item.bottom - item.top) / 2
    if (pointerY >= item.top && pointerY <= item.bottom) {
      overIndex = pointerY < middle ? index : index + 1
    }
  })

  if (overIndex !== null) return overIndex

  const first = items.find((item) => item)
  const last = [...items].reverse().find((item) => item)
  if (!first || !last) return null

  if (pointerY < first.top) return 0
  if (pointerY > last.bottom) return items.length
  return null
}

/**
 * Scroll speed (px/frame) for auto-scrolling the page while dragging near a
 * viewport edge. Negative scrolls up, positive scrolls down, 0 outside both
 * edge zones. Magnitude ramps up the closer the pointer is to the edge.
 */
export function computeAutoScrollSpeed(
  pointerY: number,
  viewportHeight: number,
  edgeZone = 80,
  maxSpeed = 16,
): number {
  if (pointerY < edgeZone) {
    return -maxSpeed * (1 - pointerY / edgeZone)
  }
  if (pointerY > viewportHeight - edgeZone) {
    return maxSpeed * (1 - (viewportHeight - pointerY) / edgeZone)
  }
  return 0
}

/**
 * Returns a new array with the item at fromIndex moved to toIndex.
 * Does not mutate the input array.
 */
export function moveItem<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array]
  const [item] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, item)
  return result
}
