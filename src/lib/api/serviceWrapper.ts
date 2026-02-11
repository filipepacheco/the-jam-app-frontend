/**
 * Service Layer Wrapper
 * Eliminates repetitive try-catch + success-check patterns in service methods
 */

import type { ApiResponse } from '../../types/api.types'

interface LegacyApiResponse<T> {
  data: T
  status: number
}

/**
 * Wraps an apiClient call with standardized error handling.
 * Converts the ApiResponse format to the legacy { data, status } format
 * used by jamService and jamControlService.
 *
 * @param apiCall - Function that returns an ApiResponse promise
 * @param defaultError - Error message if response.error is empty
 * @param status - HTTP status code to return on success (default 200)
 */
export async function withLegacyResponse<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  defaultError: string,
  status = 200,
): Promise<LegacyApiResponse<T>> {
  try {
    const response = await apiCall()

    if (!response.success) {
      throw new Error(response.error || defaultError)
    }

    return {
      data: response.data as T,
      status,
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}
