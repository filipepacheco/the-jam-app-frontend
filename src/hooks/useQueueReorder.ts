/**
 * useQueueReorder Hook
 * Manages queue reordering with optimistic updates and rollback
 * Provides debouncing and error handling for smooth UX
 */

import {useCallback, useRef, useState} from 'react'
import {jamControlService} from '../services'
import type {ScheduleResponseDto} from '../types/api.types'
import type {UseQueueReorderReturn} from '../types/jamControl.types'

export function useQueueReorder(
  jamId: string,
  currentQueue: ScheduleResponseDto[],
  onSuccess: (updatedSchedules: ScheduleResponseDto[]) => void,
  onError: (error: string) => void
): UseQueueReorderReturn {
  const [isReordering, setIsReordering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // @ts-expect-error - Node.js timeout typing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const previousQueueRef = useRef<ScheduleResponseDto[]>(currentQueue)

  const reorderQueue = useCallback(
    async (scheduleIds: string[]) => {
      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Store current queue for rollback
      previousQueueRef.current = currentQueue

      // Client-side validation
      if (scheduleIds.length === 0) {
        setError('Cannot reorder empty queue')
        onError('Cannot reorder empty queue')
        return
      }

      const uniqueIds = new Set(scheduleIds)
      if (uniqueIds.size !== scheduleIds.length) {
        setError('Duplicate schedule IDs detected')
        onError('Duplicate schedule IDs detected')
        return
      }

      // Debounce the API call
      debounceTimerRef.current = setTimeout(async () => {
        setIsReordering(true)
        setError(null)

        const response = await jamControlService.reorderQueue(jamId, scheduleIds)

        setIsReordering(false)

        if (response.success && response.data && response.data.schedules) {
          // Success: update with server response
          const sortedSchedules = response.data.schedules
            .filter(s => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS')
            .sort((a, b) => (a.order || 0) - (b.order || 0))

          onSuccess(sortedSchedules)
        } else {
          // Failure: rollback and show error
          const errorMessage = response.error?.message || 'Failed to reorder queue'
          setError(errorMessage)
          onError(errorMessage)
          onSuccess(previousQueueRef.current) // Rollback
        }
      }, 300) // 300ms debounce
    },
    [jamId, currentQueue, onSuccess, onError]
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
