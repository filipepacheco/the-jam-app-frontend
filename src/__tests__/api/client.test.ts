/**
 * API Client Tests
 * Tests for the centralized API client
 */

import {beforeEach, describe, expect, it} from 'vitest'
import {apiClient} from '../../lib/api'

describe('API Client', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('Request Interceptor', () => {
    it('should attach authorization header when token exists', async () => {
      // Arrange
      const token = 'test-jwt-token'
      localStorage.setItem('auth_token', token)

      // Mock the axios request
      const mockRequest = {
        headers: {},
        url: '/test',
        method: 'get'
      }

      // Act
      const config = apiClient.interceptors.request.handlers[0].fulfilled(mockRequest)

      // Assert
      expect(config.headers.Authorization).toBe(`Bearer ${token}`)
    })

    it('should not attach authorization header when token does not exist', async () => {
      // Arrange - no token in localStorage
      const mockRequest = {
        headers: {},
        url: '/test',
        method: 'get'
      }

      // Act
      const config = apiClient.interceptors.request.handlers[0].fulfilled(mockRequest)

      // Assert
      expect(config.headers.Authorization).toBeUndefined()
    })
  })

  describe('Response Interceptor', () => {
    it('should standardize successful responses', () => {
      // Arrange
      const mockResponse = {
        data: { id: '123', name: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      }

      // Act
      const result = apiClient.interceptors.response.handlers[0].fulfilled(mockResponse)

      // Assert
      expect(result).toEqual({
        data: { id: '123', name: 'Test' },
        success: true,
        message: 'OK'
      })
    })

    it('should transform errors to standardized format', async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            message: 'Invalid request',
            statusCode: 400
          },
          status: 400,
          statusText: 'Bad Request'
        },
        config: {},
        isAxiosError: true
      }

      // Act
      const rejectedHandler = apiClient.interceptors.response.handlers[0].rejected

      try {
        await rejectedHandler(mockError)
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        // Assert
        expect(error.success).toBe(false)
        expect(error.error).toBeDefined()
        expect(error.error.message).toBe('Invalid request')
        expect(error.error.status).toBe(400)
      }
    })

    it('should handle network errors', async () => {
      // Arrange
      const mockError = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
        config: {},
        isAxiosError: true
      }

      // Act
      const rejectedHandler = apiClient.interceptors.response.handlers[0].rejected

      try {
        await rejectedHandler(mockError)
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        // Assert
        expect(error.success).toBe(false)
        expect(error.error).toBeDefined()
        expect(error.error.code).toBe('NETWORK_ERROR')
      }
    })
  })

  describe('Configuration', () => {
    it('should have correct base URL from environment', () => {
      expect(apiClient.defaults.baseURL).toBeDefined()
      expect(apiClient.defaults.timeout).toBe(30000)
    })

    it('should have correct headers', () => {
      expect(apiClient.defaults.headers.common['Content-Type']).toBe('application/json')
    })
  })
})
