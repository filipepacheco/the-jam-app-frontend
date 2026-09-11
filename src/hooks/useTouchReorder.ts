/**
 * useTouchReorder Hook
 * Native touch drag-and-drop reordering. Passive listeners only during normal
 * scrolling; a non-passive touchmove is registered dynamically only while a
 * drag is active, then removed when it ends - so normal page scroll is never
 * blocked outside of a drag.
 *
 * Drag activates immediately on touchstart while in reorder mode (the
 * container has touch-action: none) - there is no long-press gesture here.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { computeAutoScrollSpeed, computeDropIndex, moveItem } from '../lib/schedule/reorderGeometry'

export interface UseTouchReorderReturn {
  touchDragItem: string | null
  touchOverIndex: number | null
  isDragActive: boolean
  setupTouchListeners: (node: HTMLDivElement | null) => void
}

const EDGE_ZONE = 80 // px from viewport edge to start auto-scrolling
const MAX_SCROLL_SPEED = 16 // px per frame

export function useTouchReorder<T extends { id: string }>(
  queue: T[],
  isReorderMode: boolean,
  isReordering: boolean,
  onReorder: (newQueue: T[]) => void,
  getItemElement: (id: string) => HTMLElement | null | undefined,
): UseTouchReorderReturn {
  const [touchDragItem, setTouchDragItem] = useState<string | null>(null)
  const [touchOverIndex, setTouchOverIndex] = useState<number | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const touchCleanupRef = useRef<(() => void) | null>(null)

  // Refs for native (non-React) event handlers, to avoid stale closures.
  const touchDragItemRef = useRef<string | null>(null)
  const isDragActiveRef = useRef(false)
  const touchOverIndexRef = useRef<number | null>(null)
  const queueRef = useRef(queue)
  const isReorderModeRef = useRef(isReorderMode)
  const isReorderingRef = useRef(isReordering)
  const onReorderRef = useRef(onReorder)
  const getItemElementRef = useRef(getItemElement)

  queueRef.current = queue
  isReorderModeRef.current = isReorderMode
  isReorderingRef.current = isReordering
  onReorderRef.current = onReorder
  getItemElementRef.current = getItemElement

  const setupTouchListeners = useCallback((node: HTMLDivElement | null) => {
    touchCleanupRef.current?.()
    touchCleanupRef.current = null
    containerRef.current = node
    if (!node) return

    let autoScrollRaf: number | null = null
    let lastTouchY = 0

    const stopAutoScroll = () => {
      if (autoScrollRaf) {
        cancelAnimationFrame(autoScrollRaf)
        autoScrollRaf = null
      }
    }

    const autoScrollTick = () => {
      if (!isDragActiveRef.current) return
      const speed = computeAutoScrollSpeed(lastTouchY, window.innerHeight, EDGE_ZONE, MAX_SCROLL_SPEED)

      if (speed !== 0) {
        // Bypass CSS scroll-behavior: smooth, which throttles scrollBy speed
        document.documentElement.style.scrollBehavior = 'auto'
        window.scrollBy(0, speed)
        document.documentElement.style.scrollBehavior = ''
        autoScrollRaf = requestAnimationFrame(autoScrollTick)
      } else {
        autoScrollRaf = null
      }
    }

    // Non-passive drag move handler - only attached while dragging
    const onDragTouchMove = (e: TouchEvent) => {
      if (!touchDragItemRef.current || !isDragActiveRef.current) return

      e.preventDefault()

      const touch = e.touches[0]
      const touchY = touch.clientY
      lastTouchY = touchY

      // Pass null through for unmounted items - computeDropIndex skips them.
      const items = queueRef.current.map((item) => {
        const rect = getItemElementRef.current(item.id)?.getBoundingClientRect()
        return rect ? { top: rect.top, bottom: rect.bottom } : null
      })
      const newOverIndex = computeDropIndex(items, touchY)

      touchOverIndexRef.current = newOverIndex
      setTouchOverIndex(newOverIndex)

      // Start auto-scroll if near edge (idempotent: won't double-start)
      if (!autoScrollRaf && (touchY < EDGE_ZONE || touchY > window.innerHeight - EDGE_ZONE)) {
        autoScrollRaf = requestAnimationFrame(autoScrollTick)
      }
    }

    const resetTouchState = () => {
      stopAutoScroll()
      // Remove non-passive drag handler when drag ends
      node.removeEventListener('touchmove', onDragTouchMove)
      touchDragItemRef.current = null
      isDragActiveRef.current = false
      touchOverIndexRef.current = null
      setTouchDragItem(null)
      setIsDragActive(false)
      setTouchOverIndex(null)
    }

    const onTouchStart = (e: TouchEvent) => {
      // Only allow drag in reorder mode
      if (!isReorderModeRef.current) return
      if (isReorderingRef.current) return
      const itemEl = (e.target as HTMLElement).closest('[data-schedule-id]') as HTMLElement | null
      if (!itemEl?.dataset.scheduleId) return

      const itemId = itemEl.dataset.scheduleId

      // Drag activates immediately - the container has touch-action: none
      touchDragItemRef.current = itemId
      isDragActiveRef.current = true
      setTouchDragItem(itemId)
      setIsDragActive(true)
      if (navigator.vibrate) navigator.vibrate(30)
      node.addEventListener('touchmove', onDragTouchMove, { passive: false })
    }

    const onTouchEnd = () => {
      const dragItem = touchDragItemRef.current
      const dragActive = isDragActiveRef.current
      const overIndex = touchOverIndexRef.current
      const queue = queueRef.current

      resetTouchState()

      if (!dragItem || !dragActive || overIndex === null) return

      const fromIndex = queue.findIndex((item) => item.id === dragItem)
      if (fromIndex === -1) return

      // overIndex is a "gap" index (0..length); convert to an array target index
      let targetIndex = overIndex
      if (targetIndex > fromIndex) targetIndex -= 1
      if (targetIndex === fromIndex) return

      const newQueue = moveItem(queue, fromIndex, targetIndex)
      onReorderRef.current(newQueue)
    }

    // Only passive listeners on mount - page scroll is never blocked
    node.addEventListener('touchstart', onTouchStart, { passive: true })
    node.addEventListener('touchend', onTouchEnd, { passive: true })
    node.addEventListener('touchcancel', resetTouchState, { passive: true })

    touchCleanupRef.current = () => {
      node.removeEventListener('touchstart', onTouchStart)
      node.removeEventListener('touchmove', onDragTouchMove)
      node.removeEventListener('touchend', onTouchEnd)
      node.removeEventListener('touchcancel', resetTouchState)
    }
  }, []) // Stable: all state access via refs, setState functions are stable

  // Clean up native touch listeners on unmount
  useEffect(() => {
    return () => { touchCleanupRef.current?.() }
  }, [])

  return { touchDragItem, touchOverIndex, isDragActive, setupTouchListeners }
}
