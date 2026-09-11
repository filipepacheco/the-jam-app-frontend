/**
 * useQueueReorder Hook
 * Manages queue reordering with optimistic updates and rollback
 * Provides debouncing and error handling for smooth UX
 */

import {useCallback, useRef, useState} from 'react'
import {jamControlService} from '../services'
import type {ScheduleResponseDto} from '../types/api.types'
import type {ScheduleOrderUpdate, UseQueueReorderReturn} from '../types/jamControl.types'

export function useQueueReorder(
  jamId: string,
  currentQueue: ScheduleResponseDto[],
  onSuccess: (updatedSchedules: ScheduleResponseDto[]) => void,
  onError: (error: string) => void,
  onRollback?: (previousQueue: ScheduleResponseDto[]) => void
): UseQueueReorderReturn {
  const [isReordering, setIsReordering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // @ts-expect-error - Node.js timeout typing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const previousQueueRef = useRef<ScheduleResponseDto[]>(currentQueue)

  const reorderQueue = useCallback(
    async (newQueue: ScheduleResponseDto[]) => {
      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Store current queue for rollback
      previousQueueRef.current = currentQueue

      // Client-side validation
      if (newQueue.length === 0) {
        setError('Cannot reorder empty queue')
        onError('Cannot reorder empty queue')
        return
      }

      const scheduleIds = newQueue.map(s => s.id)
      const uniqueIds = new Set(scheduleIds)
      if (uniqueIds.size !== scheduleIds.length) {
        setError('Duplicate schedule IDs detected')
        onError('Duplicate schedule IDs detected')
        return
      }

      // Build updates array preserving offset from played/current songs
      const baseOrder = Math.min(...newQueue.map(s => s.order))
      const updates: ScheduleOrderUpdate[] = newQueue.map((schedule, index) => ({
        scheduleId: schedule.id,
        order: baseOrder + index
      }))

      // Show loading immediately on drop
      setIsReordering(true)
      setError(null)

      // Debounce the API call
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const jam = await jamControlService.reorderQueue(jamId, updates)

          setIsReordering(false)

          if (jam?.schedules) {
            // Server returned full jam - use server state
            const sortedSchedules = jam.schedules
              .filter(s => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS')
              .sort((a, b) => (a.order || 0) - (b.order || 0))
            onSuccess(sortedSchedules)
          } else {
            // Server returned true - keep optimistic update already applied
            onSuccess(newQueue)
          }
        } catch (err) {
          setIsReordering(false)
          const errorMessage = err instanceof Error ? err.message : 'Failed to reorder queue'
          setError(errorMessage)
          onError(errorMessage)
          onRollback?.(previousQueueRef.current)
        }
      }, 300) // 300ms debounce
    },
    [jamId, currentQueue, onSuccess, onError, onRollback]
  )

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return {
    reorderQueue,
    isReordering,
    error,
    resetError
  }
}
