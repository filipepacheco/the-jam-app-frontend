/**
 * API Client
 * Axios-based HTTP client with interceptors for authentication and error handling
 */

import type {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios'
import axios, {AxiosError} from 'axios'
import {API_CONFIG} from './config'
import type {ApiError, ApiResponse} from '../../types/api.types'
import {refreshSupabaseSession} from '../supabase'
import {setToken, clearAuth} from '../auth'

/**
 * API Client class
 * Handles all HTTP communication with the backend
 */
class ApiClient {
  private client: AxiosInstance
  private isRefreshingToken = false
  private refreshTokenPromise: Promise<string | null> | null = null
  private refreshAttempts = 0
  private readonly MAX_REFRESH_ATTEMPTS = 3

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
   * Attempt to refresh the token from Supabase
   */
  private async refreshTokenFromSupabase(): Promise<string | null> {
    try {
      const newToken = await refreshSupabaseSession()

      if (newToken) {
        setToken(newToken)
        if (import.meta.env.DEV) {
          console.warn('🔄 Token refreshed from Supabase')
        }
        return newToken
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('❌ Token refresh failed:', err)
      }
    }
    return null
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Get token from localStorage (set by AuthContext from Supabase or legacy auth)
        const token = localStorage.getItem('auth_token')

        if (import.meta.env.DEV) {
          console.warn('🔵 API Request:', config.method?.toUpperCase(), config.url)
          console.warn('🔐 Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN')
        }

        if (token && token.trim()) {
          config.headers.Authorization = `Bearer ${token}`
          if (import.meta.env.DEV) {
            console.warn('✅ Authorization header set')
          }
        } else {
          if (import.meta.env.DEV) {
            console.warn('⚠️ No token found in localStorage - request will be sent without auth')
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
    this.client.interceptors.response.use(
      (response) => {
        // Log response in development
        if (import.meta.env.DEV) {
          console.warn('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, response.status)
        }

        // Reset refresh attempts on successful response
        this.refreshAttempts = 0

        // Transform response to standardized format
        return this.transformResponse(response)
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

        // Handle 401 Unauthorized - try to refresh token and retry (with max attempts limit)
        if (error.response?.status === 401 && !originalRequest._retry && this.refreshAttempts < this.MAX_REFRESH_ATTEMPTS) {
          originalRequest._retry = true
          this.refreshAttempts++

          if (import.meta.env.DEV) {
            console.warn(`🔐 Unauthorized (401) - Attempting token refresh (attempt ${this.refreshAttempts}/${this.MAX_REFRESH_ATTEMPTS})`)
          }

          // Prevent multiple simultaneous refresh attempts
          if (!this.isRefreshingToken) {
            this.isRefreshingToken = true
            this.refreshTokenPromise = this.refreshTokenFromSupabase()
          }

          // Wait for token refresh to complete
          if (this.refreshTokenPromise) {
            const newToken = await this.refreshTokenPromise
            this.isRefreshingToken = false
            this.refreshTokenPromise = null

            if (newToken) {
              // Retry original request with new token
              originalRequest.headers = originalRequest.headers || {}
              originalRequest.headers.Authorization = `Bearer ${newToken}`

              if (import.meta.env.DEV) {
                console.warn('🔄 Retrying request with refreshed token')
              }

              return this.client.request(originalRequest)
            }
          }

          // Token refresh failed after max attempts, redirect to login
          if (import.meta.env.DEV) {
            console.error(`🔐 Token refresh failed after ${this.refreshAttempts} attempts - redirecting to login`)
          }
          clearAuth()
          localStorage.removeItem('auth_user')
          window.location.href = '/login'
        } else if (error.response?.status === 401 && this.refreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
          // Max refresh attempts exceeded
          if (import.meta.env.DEV) {
            console.error('🔐 Max token refresh attempts exceeded - redirecting to login')
          }
          clearAuth()
          localStorage.removeItem('auth_user')
          window.location.href = '/login'
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

      // Handle 401 Unauthorized - could redirect to login
      if (error.response.status === 401) {
        console.warn('🔐 Unauthorized - Token may be expired')
        // In a real app, you might want to clear token and redirect to login
        // localStorage.removeItem('auth_token')
        // window.location.href = '/login'
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

