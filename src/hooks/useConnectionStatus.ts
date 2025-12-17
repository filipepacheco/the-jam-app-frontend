/**
 * useConnectionStatus Hook
 * Provides detailed connection status and recovery controls
 */

import {useCallback, useEffect, useState} from 'react'
import {getSocketService} from '../services/socket'
import {useOfflineQueue} from './useOfflineQueue'

export interface ConnectionStatusState {
  isOnline: boolean
  isConnected: boolean
  state: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'
  lastConnectedAt: number | null
  connectionAttempts: number
  queuedActionsCount: number
  canRetry: boolean
  retry: () => Promise<void>
  clearQueue: () => void
}

/**
 * Hook for detailed connection status and recovery
 * @returns Connection status and recovery functions
 *
 * @example
 * const { isOnline, isConnected, queuedActionsCount, retry } = useConnectionStatus()
 */
export function useConnectionStatus(): ConnectionStatusState {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isConnected, setIsConnected] = useState(false)
  const [state, setState] = useState<'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'>('idle')
  const [lastConnectedAt, setLastConnectedAt] = useState<number | null>(null)
  const [connectionAttempts, setConnectionAttempts] = useState(0)

  const socketService = getSocketService()
  const { stats: queueStats, clearAll: clearQueue } = useOfflineQueue()

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Track socket connection state
  useEffect(() => {
    const updateState = () => {
      const currentState = socketService.getConnectionState()
      setState(currentState)
      setIsConnected(socketService.isConnected())

      if (socketService.isConnected()) {
        setLastConnectedAt(Date.now())
      }
    }

    updateState()

    const handleConnect = () => {
      setState('connected')
      setIsConnected(true)
      setLastConnectedAt(Date.now())
      setConnectionAttempts(0)
      console.log('✅ Connection recovered')
    }

    const handleDisconnect = () => {
      setState('disconnected')
      setIsConnected(false)
    }

    const handleError = () => {
      setState('error')
      setConnectionAttempts((prev) => prev + 1)
    }

    socketService.on('connect', handleConnect)
    socketService.on('disconnect', handleDisconnect)
    socketService.on('connect_error', handleError)

    return () => {
      socketService.off('connect', handleConnect)
      socketService.off('disconnect', handleDisconnect)
      socketService.off('connect_error', handleError)
    }
  }, [socketService])

  const retry = useCallback(async () => {
    try {
      setState('connecting')
      setConnectionAttempts((prev) => prev + 1)

      const token = localStorage.getItem('token')
      await socketService.connect(token || undefined)

      setState('connected')
      setConnectionAttempts(0)
    } catch (err) {
      setState('error')
      console.error('Retry failed:', err)
      throw err
    }
  }, [socketService])

  const canRetry = state === 'disconnected' || state === 'error'

  return {
    isOnline,
    isConnected,
    state,
    lastConnectedAt,
    connectionAttempts,
    queuedActionsCount: queueStats.pending,
    canRetry,
    retry,
    clearQueue,
  }
}

