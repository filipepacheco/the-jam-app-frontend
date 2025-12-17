/**
 * useSocketStatus Hook
 * Provides detailed socket connection status information
 */

import {useEffect, useState} from 'react'
import {getSocketService} from '../services/socket/socketService'
import type {SocketConnectionState} from '../types/socket.types'

export interface SocketStatus {
  isConnected: boolean
  isConnecting: boolean
  state: SocketConnectionState
  error: Error | null
  hasError: boolean
}

/**
 * Hook to track socket connection status
 * @returns Current socket connection status
 *
 * @example
 * const { isConnected, state, error } = useSocketStatus()
 * if (error) console.error('Socket error:', error.message)
 */
export function useSocketStatus(): SocketStatus {
  const [status, setStatus] = useState<SocketStatus>({
    isConnected: false,
    isConnecting: false,
    state: 'idle',
    error: null,
    hasError: false,
  })

  const socketService = getSocketService()

  useEffect(() => {
    // Update initial state
    const updateStatus = () => {
      const state = socketService.getConnectionState()
      setStatus({
        isConnected: socketService.isConnected(),
        isConnecting: state === 'connecting',
        state,
        error: null,
        hasError: state === 'error',
      })
    }

    updateStatus()

    // Listen to connection changes
    const handleConnect = () => {
      setStatus((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        state: 'connected',
        error: null,
        hasError: false,
      }))
    }

    const handleDisconnect = () => {
      setStatus((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        state: 'disconnected',
      }))
    }

    const handleError = (error: Error) => {
      setStatus((prev) => ({
        ...prev,
        state: 'error',
        error,
        hasError: true,
        isConnected: false,
        isConnecting: false,
      }))
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

  return status
}

