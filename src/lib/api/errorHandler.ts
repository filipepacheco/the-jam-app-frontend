/**
 * Error Handler
 * Maps API errors to user-friendly messages and provides error utilities
 */

import type { ApiError } from '../../types/api.types'

/**
 * Map of HTTP status codes to user-friendly messages
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'You are not authenticated. Please log in.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data.',
  422: 'The provided data is invalid.',
  429: 'Too many requests. Please try again later.',
  500: 'A server error occurred. Please try again later.',
  502: 'Service temporarily unavailable. Please try again.',
  503: 'Service unavailable. Please try again later.',
}

/**
 * Map of common error types to messages
 */
const ERROR_TYPE_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'You need to log in to continue.',
  FORBIDDEN: 'You do not have permission for this action.',
  NOT_FOUND: 'The requested item was not found.',
  CONFLICT: 'This action conflicts with existing data.',
  SERVER_ERROR: 'A server error occurred. Please try again.',
}

/**
 * Handle API error and return user-friendly message
 * @param error - API error object
 * @returns User-friendly error message
 */
export function handleApiError(error: ApiError): string {
  // If error already has a user-friendly message, use it
  if (error.message && !error.message.startsWith('Request failed')) {
    return error.message
  }

  // Try to get message from status code
  if (error.statusCode && ERROR_MESSAGES[error.statusCode]) {
    return ERROR_MESSAGES[error.statusCode]
  }

  // Try to get message from error type
  if (error.error && ERROR_TYPE_MESSAGES[error.error]) {
    return ERROR_TYPE_MESSAGES[error.error]
  }

  // Fallback to generic message
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Format error for user display
 * @param error - Error object (can be ApiError or generic Error)
 * @returns User-friendly error message
 */
export function formatError(error: unknown): string {
  // If it's an ApiError
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    return handleApiError(error as ApiError)
  }

  // If it's a generic Error
  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred.'
  }

  // If it's a string
  if (typeof error === 'string') {
    return error
  }

  // Unknown error type
  return 'An unexpected error occurred. Please try again.'
}

