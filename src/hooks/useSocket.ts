/**
 * useSocket Hook
 * Provides access to socket connection and state
 */

import {useCallback, useEffect, useState} from 'react'
import {getSocketService} from '../services/socket/socketService'
import type {SocketConnectionState} from '../types/socket.types'

export interface UseSocketReturn {
  isConnected: boolean
  isConnecting: boolean
  connectionState: SocketConnectionState
  error: Error | null
  connect: (token?: string) => Promise<void>
  disconnect: () => void
  setToken: (token: string) => void
}

/**
 * Hook for socket connection management
 * Initializes connection on mount, handles token updates
 */
export function useSocket(token?: string): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<SocketConnectionState>('idle')
  const [error, setError] = useState<Error | null>(null)

  const socketService = getSocketService()

  // Connect on mount or when token changes
  useEffect(() => {
    let isMounted = true

    const initializeConnection = async () => {
      try {
        setError(null)

        // If token provided, set it first
        if (token) {
          socketService.setToken(token)
        }

        // Only connect if not already connected
        if (!socketService.isConnected()) {
          await socketService.connect(token)
        }

        if (isMounted) {
          setIsConnected(true)
          setConnectionState(socketService.getConnectionState())
        }
      } catch (err) {
        if (isMounted) {
          const errorObj = err instanceof Error ? err : new Error(String(err))
          setError(errorObj)
          setIsConnected(false)
          setConnectionState('error')
        }
      }
    }

    // Setup event listeners
    const handleConnect = () => {
      if (isMounted) {
        setIsConnected(true)
        setConnectionState('connected')
        setError(null)
      }
    }

    const handleDisconnect = () => {
      if (isMounted) {
        setIsConnected(false)
        setConnectionState('disconnected')
      }
    }

    const handleConnectError = (err: Error) => {
      if (isMounted) {
        setError(err)
        setConnectionState('error')
        setIsConnected(false)
      }
    }

    socketService.on('connect', handleConnect)
    socketService.on('disconnect', handleDisconnect)
    socketService.on('connect_error', handleConnectError)

    initializeConnection()

    // Cleanup
    return () => {
      isMounted = false
      socketService.off('connect', handleConnect)
      socketService.off('disconnect', handleDisconnect)
      socketService.off('connect_error', handleConnectError)
    }
  }, [token, socketService])

  const connect = useCallback(
    async (connectionToken?: string) => {
      try {
        setError(null)
        if (connectionToken) {
          socketService.setToken(connectionToken)
        }
        await socketService.connect(connectionToken)
        setIsConnected(true)
        setConnectionState('connected')
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        setError(errorObj)
        setConnectionState('error')
        throw err
      }
    },
    [socketService]
  )

  const disconnect = useCallback(() => {
    socketService.disconnect()
    setIsConnected(false)
    setConnectionState('disconnected')
  }, [socketService])

  const setToken = useCallback(
    (newToken: string) => {
      socketService.setToken(newToken)
    },
    [socketService]
  )

  return {
    isConnected,
    isConnecting: connectionState === 'connecting',
    connectionState,
    error,
    connect,
    disconnect,
    setToken,
  }
}

