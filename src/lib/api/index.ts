/**
 * API Module Exports
 * Central export point for all API-related functionality
 */

export { apiClient, ApiClient } from './client'
export { API_CONFIG, API_ENDPOINTS, validateEnvironment, getApiBaseUrl } from './config'
export { withLegacyResponse } from './serviceWrapper'
export {
  handleApiError,
  isNetworkError,
  isAuthError,
  isPermissionError,
  isValidationError,
  isNotFoundError,
  isServerError,
  getErrorDetails,
  formatError,
} from './errorHandler'

