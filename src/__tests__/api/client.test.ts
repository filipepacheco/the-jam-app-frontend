/**
 * API Client
 * Tests for the centralized API client
 *
 * `apiClient` is an `ApiClient` wrapper around a private axios instance
 * (see `src/lib/api/client.ts`). It exposes only `get/post/put/patch/delete`,
 * so these tests exercise the wrapper's real interceptor and error-handling
 * logic through that public surface, with axios itself replaced by a small
 * adapter-level mock. The mock records the config axios would have been
 * created with, runs the request through the same interceptor chain the
 * real ApiClient installs, and lets each test control what the mocked
 * "network" adapter returns or throws.
 */

import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock the auth module so we control what token (if any) is available,
// without relying on the real Supabase session machinery.
const auth = vi.hoisted(() => ({
  getAccessToken: vi.fn<() => Promise<string | null>>(),
  refreshAccessToken: vi.fn<() => Promise<string | null>>(),
  clearTokenCache: vi.fn(),
}))

vi.mock('../../lib/auth', () => auth)

// Mock axios at the adapter level: keep everything else (AxiosError, etc.)
// real, but replace `axios.create` with an instance whose interceptor
// registration and request dispatch we control. This lets ApiClient's own
// `setupInterceptors`, `transformResponse`, `handleError`, and
// `getErrorMessage` run for real, while the "network" call itself is a
// mock we can resolve or reject per test.
const axiosMock = vi.hoisted(() => {
  type Handler = { fulfilled: (value: any) => any; rejected?: (error: any) => any }

  const requestHandlers: Handler[] = []
  const responseHandlers: Handler[] = []
  const adapter = vi.fn<(config: any) => Promise<any>>()
  let createConfig: any = null

  async function dispatch(config: any) {
    let cfg = { headers: {}, ...config }
    for (const handler of requestHandlers) {
      cfg = await handler.fulfilled(cfg)
    }

    let rawResponse
    try {
      rawResponse = await adapter(cfg)
    } catch (rawError: any) {
      const error = { config: cfg, isAxiosError: true, ...rawError }
      for (const handler of responseHandlers) {
        if (handler.rejected) {
          return handler.rejected(error)
        }
      }
      throw error
    }

    let response = { config: cfg, ...rawResponse }
    for (const handler of responseHandlers) {
      response = await handler.fulfilled(response)
    }
    return response
  }

  function createInstance(config: any) {
    createConfig = config
    return {
      defaults: config,
      interceptors: {
        request: {
          use: (fulfilled: Handler['fulfilled'], rejected?: Handler['rejected']) => {
            requestHandlers.push({ fulfilled, rejected })
          },
        },
        response: {
          use: (fulfilled: Handler['fulfilled'], rejected?: Handler['rejected']) => {
            responseHandlers.push({ fulfilled, rejected })
          },
        },
      },
      request: (cfg: any) => dispatch(cfg),
      get: (url: string, cfg: any = {}) => dispatch({ ...cfg, url, method: 'get' }),
      post: (url: string, data: any, cfg: any = {}) => dispatch({ ...cfg, url, data, method: 'post' }),
      put: (url: string, data: any, cfg: any = {}) => dispatch({ ...cfg, url, data, method: 'put' }),
      patch: (url: string, data: any, cfg: any = {}) => dispatch({ ...cfg, url, data, method: 'patch' }),
      delete: (url: string, cfg: any = {}) => dispatch({ ...cfg, url, method: 'delete' }),
    }
  }

  return {
    adapter,
    reset() {
      requestHandlers.length = 0
      responseHandlers.length = 0
      adapter.mockReset()
      createConfig = null
    },
    getCreateConfig() {
      return createConfig
    },
    createInstance,
  }
})

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios')
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn((config: any) => axiosMock.createInstance(config)),
    },
  }
})

describe('API Client', () => {
  let apiClient: typeof import('../../lib/api').apiClient

  beforeEach(async () => {
    localStorage.clear()
    axiosMock.reset()
    auth.getAccessToken.mockReset().mockResolvedValue(null)
    auth.refreshAccessToken.mockReset().mockResolvedValue(null)
    auth.clearTokenCache.mockReset()

    // Re-import so a fresh ApiClient singleton is constructed against the
    // freshly reset axios mock for every test.
    vi.resetModules()
    ;({ apiClient } = await import('../../lib/api'))
  })

  describe('Request Interceptor - Authorization header', () => {
    it('attaches an Authorization header when a token is available', async () => {
      auth.getAccessToken.mockResolvedValue('test-jwt-token')
      axiosMock.adapter.mockResolvedValue({ data: {}, status: 200, statusText: 'OK', headers: {} })

      await apiClient.get('/test')

      const [config] = axiosMock.adapter.mock.calls[0]
      expect(config.headers.Authorization).toBe('Bearer test-jwt-token')
    })

    it('does not attach an Authorization header when no token is available', async () => {
      auth.getAccessToken.mockResolvedValue(null)
      axiosMock.adapter.mockResolvedValue({ data: {}, status: 200, statusText: 'OK', headers: {} })

      await apiClient.get('/test')

      const [config] = axiosMock.adapter.mock.calls[0]
      expect(config.headers.Authorization).toBeUndefined()
    })
  })

  describe('Response Interceptor - success standardization', () => {
    it('wraps a raw (unwrapped) backend response as { data, success: true }', async () => {
      axiosMock.adapter.mockResolvedValue({
        data: { id: '123', name: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: {},
      })

      const result = await apiClient.get<{ id: string; name: string }>('/test')

      expect(result).toEqual({
        data: { id: '123', name: 'Test' },
        success: true,
      })
    })

    it('preserves an already-wrapped backend response', async () => {
      axiosMock.adapter.mockResolvedValue({
        data: { data: { id: '123' }, success: true, message: 'Loaded' },
        status: 200,
        statusText: 'OK',
        headers: {},
      })

      const result = await apiClient.get<{ id: string }>('/test')

      expect(result).toEqual({
        data: { id: '123' },
        success: true,
        message: 'Loaded',
        error: undefined,
        meta: undefined,
      })
    })
  })

  describe('Response Interceptor - error standardization', () => {
    it('transforms a server error response into the standardized ApiError shape', async () => {
      axiosMock.adapter.mockRejectedValue({
        response: {
          data: { message: 'Invalid request' },
          status: 400,
          statusText: 'Bad Request',
        },
      })

      await expect(apiClient.get('/test')).rejects.toEqual({
        message: 'Invalid request',
        statusCode: 400,
        error: 'Bad Request',
      })
    })

    it('falls back to the response statusText when no message is present', async () => {
      axiosMock.adapter.mockRejectedValue({
        response: {
          data: {},
          status: 500,
          statusText: 'Internal Server Error',
        },
      })

      await expect(apiClient.get('/test')).rejects.toEqual({
        message: 'Internal Server Error',
        statusCode: 500,
        error: 'Internal Server Error',
      })
    })

    it('handles a network error (no response received)', async () => {
      axiosMock.adapter.mockRejectedValue({
        message: 'Network Error',
        code: 'ERR_NETWORK',
        request: {},
      })

      await expect(apiClient.get('/test')).rejects.toEqual({
        message: 'Network error - please check your internet connection',
        statusCode: 0,
        error: 'NETWORK_ERROR',
      })
    })

    it('handles a request configuration error (no request was made)', async () => {
      axiosMock.adapter.mockRejectedValue({
        message: 'Something went wrong building the request',
      })

      await expect(apiClient.get('/test')).rejects.toEqual({
        message: 'Something went wrong building the request',
        statusCode: 0,
        error: 'REQUEST_ERROR',
      })
    })
  })

  describe('Configuration', () => {
    it('creates the underlying axios instance with the expected base URL and timeout', () => {
      const config = axiosMock.getCreateConfig()

      expect(config.baseURL).toBeDefined()
      expect(typeof config.baseURL).toBe('string')
      expect(config.timeout).toBe(30000)
    })

    it('creates the underlying axios instance with JSON content-type headers', () => {
      const config = axiosMock.getCreateConfig()

      expect(config.headers['Content-Type']).toBe('application/json')
    })
  })
})
