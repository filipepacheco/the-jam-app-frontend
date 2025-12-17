/**
 * useOfflineQueue Hook
 * Provides access to offline action queue
 */

import {useCallback, useEffect, useState} from 'react'
import {getOfflineQueueManager, type QueuedAction, type QueueStats} from '../services/offlineQueue'

export interface OfflineQueueState {
  queue: QueuedAction[]
  stats: QueueStats
  isOfflineMode: boolean
  queueAction: (
    event: string,
    payload: any,
    priority?: 'high' | 'normal' | 'low'
  ) => string
  removeAction: (id: string) => void
  clearFailed: () => void
  clearAll: () => void
}

/**
 * Hook for managing offline action queue
 * @returns Queue state and management functions
 *
 * @example
 * const { queue, stats, queueAction } = useOfflineQueue()
 * if (!navigator.onLine) {
 *   queueAction('joinJam', { jamId: '123' }, 'high')
 * }
 */
export function useOfflineQueue(): OfflineQueueState {
  const [queue, setQueue] = useState<QueuedAction[]>([])
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine)

  const queueManager = getOfflineQueueManager()

  // Initialize queue from manager
  useEffect(() => {
    setQueue(queueManager.getQueue())

    // Subscribe to queue changes
    const unsubscribe = queueManager.subscribe((newQueue) => {
      setQueue(newQueue)
    })

    return unsubscribe
  }, [queueManager])

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Online - Processing queue')
      setIsOfflineMode(false)
    }

    const handleOffline = () => {
      console.log('📵 Offline - Queuing actions')
      setIsOfflineMode(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const queueAction = useCallback(
    (event: string, payload: any, priority: 'high' | 'normal' | 'low' = 'normal'): string => {
      return queueManager.addAction(event, payload, priority)
    },
    [queueManager]
  )

  const removeAction = useCallback(
    (id: string) => {
      queueManager.removeAction(id)
    },
    [queueManager]
  )

  const clearFailed = useCallback(() => {
    queueManager.clearFailed()
  }, [queueManager])

  const clearAll = useCallback(() => {
    queueManager.clearAll()
  }, [queueManager])

  const stats: QueueStats = queueManager.getStats()

  return {
    queue,
    stats,
    isOfflineMode,
    queueAction,
    removeAction,
    clearFailed,
    clearAll,
  }
}

