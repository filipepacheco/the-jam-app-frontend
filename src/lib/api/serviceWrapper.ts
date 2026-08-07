/**
 * Service Layer Wrapper
 * Eliminates repetitive try-catch + success-check patterns in service methods.
 * This is the one and only way any service should return data - see
 * docs/adr/0002-single-response-envelope-adapter.md.
 */

import type { ApiResponse, PaginationMeta } from '../../types/api.types'
// The i18n singleton, not the `useTranslation` hook: these messages are thrown
// from plain async functions with no React context. The app initialises i18n at
// startup regardless, so importing it here adds no runtime cost.
import i18n from '../../i18n'

/**
 * Runs an apiClient call, throws on `!success`, and returns the raw ApiResponse
 * on success. Shared by unwrapResponse and unwrapPaginatedResponse so the
 * success-check/error-handling shape lives in exactly one place.
 */
async function checkSuccess<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  defaultError?: string,
): Promise<ApiResponse<T>> {
  try {
    const response = await apiCall()

    if (!response.success) {
      throw new Error(response.error || defaultError || i18n.t('errors.generic_error'))
    }

    return response
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error(i18n.t('errors.connection_error'))
  }
}

/**
 * Wraps an apiClient call with standardized error handling.
 * Throws on `!success`, otherwise returns the unwrapped data directly.
 *
 * @param apiCall - Function that returns an ApiResponse promise
 * @param defaultError - Message to throw if the backend gives no error/message
 *   and success is false. Defaults to the localized generic_error key.
 */
export async function unwrapResponse<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  defaultError?: string,
): Promise<T> {
  const response = await checkSuccess(apiCall, defaultError)
  return response.data as T
}

/**
 * Paginated sibling of unwrapResponse, for findAll-style methods.
 * Same throw-on-`!success` behavior; returns {data, meta} on success.
 */
export async function unwrapPaginatedResponse<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  defaultError?: string,
): Promise<{ data: T; meta: PaginationMeta }> {
  const response = await checkSuccess(apiCall, defaultError)
  return {
    data: response.data as T,
    meta: response.meta as PaginationMeta,
  }
}
