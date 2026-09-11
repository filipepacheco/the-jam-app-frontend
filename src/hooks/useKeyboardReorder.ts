/**
 * useKeyboardReorder Hook
 * Arrow-key reordering for accessibility - moves the focused item up/down
 * within the queue and refocuses it after the move.
 */

import { useCallback } from 'react'
import { moveItem } from '../lib/schedule/reorderGeometry'

export interface UseKeyboardReorderReturn {
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, index: number) => void
}

export function useKeyboardReorder<T extends { id: string }>(
  queue: T[],
  isReorderMode: boolean,
  isReordering: boolean,
  onReorder: (newQueue: T[]) => void,
  getItemElement: (id: string) => HTMLElement | null | undefined,
): UseKeyboardReorderReturn {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
      if (!isReorderMode || isReordering) return

      const item = queue[index]
      if (!item) return

      let targetIndex: number | null = null
      if (e.key === 'ArrowUp' && index > 0) {
        targetIndex = index - 1
      } else if (e.key === 'ArrowDown' && index < queue.length - 1) {
        targetIndex = index + 1
      }

      if (targetIndex === null) return

      e.preventDefault()
      onReorder(moveItem(queue, index, targetIndex))

      // Focus the moved item after reorder
      setTimeout(() => {
        getItemElement(item.id)?.focus()
      }, 100)
    },
    [isReorderMode, isReordering, queue, onReorder, getItemElement],
  )

  return { handleKeyDown }
}
