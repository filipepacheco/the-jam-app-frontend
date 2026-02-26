/**
 * API Client
 * Axios-based HTTP client with interceptors for authentication and error handling
 */

import type {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios'
import axios, {AxiosError} from 'axios'
import {API_CONFIG} from './config'
import type {ApiError, ApiResponse} from '../../types/api.types'
import {clearAuth, getAccessToken, refreshAccessToken} from '../auth'

/**
 * API Client class
 * Handles all HTTP communication with the backend
 */
class ApiClient {
  private client: AxiosInstance

  constructor() {
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Setup interceptors
    this.setupInterceptors()
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config)
    return response.data
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config)
    return response.data
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config)
    return response.data
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config)
    return response.data
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config)
    return response.data
  }



  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Get token from Supabase session
        const token = await getAccessToken()

        if (import.meta.env.DEV) {
          console.warn('🔵 API Request:', config.method?.toUpperCase(), config.url)
          console.warn('🔐 Token from Supabase:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN')
        }

        if (token && token.trim()) {
          config.headers.Authorization = `Bearer ${token}`
          if (import.meta.env.DEV) {
            console.warn('✅ Authorization header set')
          }
        } else {
          if (import.meta.env.DEV) {
            console.warn('⚠️ No token found - request will be sent without auth')
          }
        }

        return config
      },
      (error) => {
        console.error('❌ Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor - standardize responses and handle errors
    let isRefreshing = false
    let refreshPromise: Promise<string | null> | null = null

    this.client.interceptors.response.use(
      (response) => {
        // Log response in development
        if (import.meta.env.DEV) {
          console.warn('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, response.status)
        }

        // Transform response to standardized format
        return this.transformResponse(response)
      },
      async (error: AxiosError) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          if (import.meta.env.DEV) {
            console.warn('🔐 Unauthorized (401) - Invalid or expired token')
            console.warn('🔐 Attempting to refresh token from Supabase')
          }

          // Prevent multiple simultaneous refreshes
          if (!isRefreshing) {
            isRefreshing = true
            refreshPromise = refreshAccessToken().finally(() => {
              isRefreshing = false
              refreshPromise = null
            })
          }

          const newToken = await refreshPromise

          if (newToken && error.config) {
            // Retry request with new token
            error.config.headers.Authorization = `Bearer ${newToken}`
            if (import.meta.env.DEV) {
              console.warn('✅ Token refreshed, retrying request')
            }
            return this.client.request(error.config)
          }

          // Refresh failed - logout and redirect to log in
          if (import.meta.env.DEV) {
            console.warn('🔐 Token refresh failed, clearing auth and redirecting to login')
          }
          clearAuth()
          localStorage.removeItem('auth_user')
          window.location.href = '/login'

          // Return error anyway for any pending operations
          return this.handleError(error)
        }

        // Handle other errors
        return this.handleError(error)
      }
    )
  }

  /**
   * Transform axios response to standardized ApiResponse format
   */
  private transformResponse<T>(response: AxiosResponse): AxiosResponse<ApiResponse<T>> {
    // Check if response already has our wrapper format
    const hasWrapper = response.data &&
                      typeof response.data === 'object' &&
                      ('data' in response.data || 'success' in response.data)

    if (hasWrapper) {
      // Backend already returns wrapped format, ensure it's complete
      return {
        ...response,
        data: {
          data: response.data.data,
          success: response.data.success ?? true,
          message: response.data.message,
          error: response.data.error,
        }
      }
    }

    // Wrap raw response data
    return {
      ...response,
      data: {
        data: response.data as T,
        success: true,
      }
    }
  }

  /**
   * Handle API errors and transform to standardized format
   */
  private handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      // Server responded with error status
      const apiError: ApiError = {
        message: this.getErrorMessage(error),
        statusCode: error.response.status,
        error: error.response.statusText,
        details: error.response.data,
      }

      console.error('❌ API Error:', apiError)

      // 401 is handled in response interceptor above
      if (error.response.status === 401) {
        console.warn('🔐 Unauthorized - Token refresh attempted')
      }

      return Promise.reject(apiError)
    } else if (error.request) {
      // Request made but no response received (network error)
      const apiError: ApiError = {
        message: 'Network error - please check your internet connection',
        statusCode: 0,
        error: 'NETWORK_ERROR',
      }

      console.error('❌ Network Error:', apiError)
      return Promise.reject(apiError)
    } else {
      // Error in request configuration
      const apiError: ApiError = {
        message: error.message || 'An unexpected error occurred',
        statusCode: 0,
        error: 'REQUEST_ERROR',
      }

      console.error('❌ Request Configuration Error:', apiError)
      return Promise.reject(apiError)
    }
  }

  /**
   * Extract user-friendly error message from error response
   */
  private getErrorMessage(error: AxiosError): string {
    // Try to get message from response data
    const data = error.response?.data as Record<string, unknown> | undefined

    if (data?.message && typeof data.message === 'string') {
      return data.message
    }

    if (data?.error && typeof data.error === 'string') {
      return data.error
    }

    // Fallback to status text or default message
    return error.response?.statusText || 'An error occurred'
  }
}

/**
 * Singleton instance of API client
 * Import and use this instance throughout the application
 */
export const apiClient = new ApiClient()

/**
 * Export class for testing purposes
 */
export { ApiClient }

