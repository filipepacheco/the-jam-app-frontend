/**
 * useMouseReorder Hook
 * HTML5 drag-and-drop reordering for mouse input.
 *
 * Only usable while the caller has drag enabled (typically gated to an
 * explicit reorder mode) - onReorder always applies a local reorder; there is
 * no separate "commit immediately" path, since dragging never starts outside
 * that gated state in this app's usage.
 */

import { useCallback, useState } from 'react'
import { moveItem } from '../lib/schedule/reorderGeometry'

export interface UseMouseReorderReturn {
  draggedItem: string | null
  dragOverItem: string | null
  handleDragStart: (itemId: string) => void
  handleDragOver: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void
  handleDragEnd: () => void
  handleDrop: (e: React.DragEvent<HTMLDivElement>, targetItemId: string) => void
}

export function useMouseReorder<T extends { id: string }>(
  queue: T[],
  onReorder: (newQueue: T[]) => void,
): UseMouseReorderReturn {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)

  const handleDragStart = useCallback((itemId: string) => {
    setDraggedItem(itemId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, itemId: string) => {
    e.preventDefault()
    setDragOverItem(itemId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setDragOverItem(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetItemId: string) => {
      e.preventDefault()
      setDragOverItem(null)

      if (!draggedItem) return

      const fromIndex = queue.findIndex((item) => item.id === draggedItem)
      const toIndex = queue.findIndex((item) => item.id === targetItemId)

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        setDraggedItem(null)
        return
      }

      const newQueue = moveItem(queue, fromIndex, toIndex)
      setDraggedItem(null)
      onReorder(newQueue)
    },
    [draggedItem, queue, onReorder],
  )

  return { draggedItem, dragOverItem, handleDragStart, handleDragOver, handleDragEnd, handleDrop }
}
