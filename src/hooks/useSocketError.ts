/**
 * useSocketError Hook
 * Provides socket error handling and recovery
 */

import {useCallback, useState} from 'react'
import {
    type ErrorInfo,
    type ErrorRecoveryAction,
    getErrorRecoveryAction,
    getUserErrorMessage,
    logSocketError,
    mapSocketError,
} from '../services/socketErrorHandler'
import type {SocketError as SocketErrorType} from '../types/socket.types'

export interface SocketErrorState {
  error: Error | SocketErrorType | null
  errorInfo: ErrorInfo | null
  userMessage: string
  recoveryAction: ErrorRecoveryAction | null
  hasError: boolean
  clearError: () => void
}

/**
 * Hook for socket error handling and recovery
 * @param context - Optional context for logging (e.g., "JamDetail")
 * @returns Error state and recovery functions
 *
 * @example
 * const { error, userMessage, clearError } = useSocketError('JamDetail')
 * if (error) {
 *   console.error(userMessage)
 *   clearError()
 * }
 */
export function useSocketError(context?: string): SocketErrorState {
  const [error, setError] = useState<Error | SocketErrorType | null>(null)

  const handleError = useCallback(
    (err: Error | SocketErrorType) => {
      logSocketError(err, context)
      setError(err)
    },
    [context]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const errorInfo = error ? mapSocketError(error) : null
  const userMessage = error ? getUserErrorMessage(error) : ''
  const recoveryAction = error ? getErrorRecoveryAction(error) : null

  return {
    error,
    errorInfo,
    userMessage,
    recoveryAction,
    hasError: !!error,
    clearError,
  }
}

