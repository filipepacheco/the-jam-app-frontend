/**
 * Socket Error Handler Utility
 * Maps socket error codes to user-friendly messages and recovery actions
 */

import type {SocketError, SocketErrorCode, SocketErrorPayload} from '../types/socket.types'

/**
 * Error recovery action
 */
export type ErrorRecoveryAction = 'retry' | 'redirect' | 'logout' | 'reload' | 'notify' | 'none'

/**
 * Error information for UI display
 */
export interface ErrorInfo {
  code: SocketErrorCode | string
  userMessage: string
  debugMessage: string
  recoveryAction: ErrorRecoveryAction
  recoveryUrl?: string
  shouldLog: boolean
}

/**
 * Map socket error codes to user-friendly messages and recovery actions
 */
export function mapSocketError(
  error: Error | SocketError | SocketErrorPayload,
  context?: Record<string, any>
): ErrorInfo {
  const errorCode = getErrorCode(error)

  switch (errorCode) {
    case 'AUTH_ERROR':
    case 'PERMISSION_DENIED':
      return {
        code: errorCode,
        userMessage: 'You are not authorized to access this jam session. Please log in again.',
        debugMessage: `Authentication failed: ${getErrorMessage(error)}`,
        recoveryAction: 'logout',
        shouldLog: true,
      }

    case 'NETWORK_ERROR':
      return {
        code: errorCode,
        userMessage: 'Connection lost. Please check your internet connection.',
        debugMessage: `Network error: ${getErrorMessage(error)}`,
        recoveryAction: 'retry',
        shouldLog: false,
      }

    case 'RATE_LIMITED':
      return {
        code: errorCode,
        userMessage: 'Too many requests. Please wait a moment before trying again.',
        debugMessage: `Rate limited: ${getErrorMessage(error)}`,
        recoveryAction: 'retry',
        shouldLog: false,
      }

    case 'SERVER_ERROR':
      return {
        code: errorCode,
        userMessage: 'Server error. The jam system is temporarily unavailable.',
        debugMessage: `Server error: ${getErrorMessage(error)}`,
        recoveryAction: 'retry',
        shouldLog: true,
      }

    case 'TIMEOUT':
      return {
        code: errorCode,
        userMessage: 'Connection timeout. Please check your connection.',
        debugMessage: `Connection timeout: ${getErrorMessage(error)}`,
        recoveryAction: 'retry',
        shouldLog: false,
      }

    case 'INVALID_PAYLOAD':
      return {
        code: errorCode,
        userMessage: 'Invalid data format. Please refresh the page.',
        debugMessage: `Invalid payload: ${getErrorMessage(error)}`,
        recoveryAction: 'reload',
        shouldLog: true,
      }

    case 'UNKNOWN_EVENT':
      return {
        code: errorCode,
        userMessage: 'Unknown action. Please try again.',
        debugMessage: `Unknown event: ${getErrorMessage(error)}`,
        recoveryAction: 'notify',
        shouldLog: true,
      }

    default:
      return {
        code: errorCode || 'UNKNOWN',
        userMessage: 'An unexpected error occurred. Please try again.',
        debugMessage: getErrorMessage(error),
        recoveryAction: 'retry',
        shouldLog: true,
      }
  }
}

/**
 * Extract error code from error object
 */
function getErrorCode(error: Error | SocketError | SocketErrorPayload): string | null {
  if (!error) return null

  // If it's a SocketErrorPayload
  if ('code' in error && typeof (error as any).code === 'string') {
    return (error as SocketErrorPayload).code
  }

  // If it's a SocketError with code property
  if ('code' in error) {
    return (error as SocketError).code
  }

  // Try to extract from error message
  const message = (error as Error).message || ''
  if (message.includes('ECONNREFUSED')) return 'NETWORK_ERROR'
  if (message.includes('timeout')) return 'TIMEOUT'
  if (message.includes('auth')) return 'AUTH_ERROR'

  return null
}

/**
 * Extract error message from error object
 */
function getErrorMessage(error: Error | SocketError | SocketErrorPayload): string {
  if (!error) return 'Unknown error'

  if (typeof error === 'object' && 'message' in error) {
    return (error as Error).message
  }

  return String(error)
}

/**
 * Create error object with code
 */
export function createSocketError(
  code: SocketErrorCode,
  message: string,
  context?: Record<string, any>
): SocketError {
  const error = new Error(message) as SocketError
  error.code = code
  error.context = context
  return error
}

/**
 * Log error for debugging
 */
export function logSocketError(error: Error | SocketError | SocketErrorPayload, context?: string): void {
  const errorInfo = mapSocketError(error)

  if (!errorInfo.shouldLog) return

  console.error(`[Socket Error] ${context || ''} ${errorInfo.code}`, {
    message: errorInfo.debugMessage,
    error: error instanceof Error ? error : new Error(String(error)),
  })
}

/**
 * Get recovery action for error
 */
export function getErrorRecoveryAction(error: Error | SocketError | SocketErrorPayload): ErrorRecoveryAction {
  return mapSocketError(error).recoveryAction
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: Error | SocketError | SocketErrorPayload): string {
  return mapSocketError(error).userMessage
}

