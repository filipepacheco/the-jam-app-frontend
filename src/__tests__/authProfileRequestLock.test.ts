import type {AxiosAdapter} from 'axios'
import {createClient, type SupabaseClient} from '@supabase/supabase-js'
import {afterEach, describe, expect, it, vi} from 'vitest'

const fixture = vi.hoisted(() => ({client: null as SupabaseClient | null}))

vi.mock('../lib/supabase', () => ({
  get supabase() { return fixture.client },
}))

afterEach(() => {
  fixture.client = null
  vi.unstubAllGlobals()
})

describe('authenticated backend profile request', () => {
  it('reads a synthetic SDK session and sends the bearer token despite an aborting browser Web Lock', async () => {
    const lockRequest = vi.fn().mockRejectedValue(new DOMException('signal is aborted without reason', 'AbortError'))
    vi.stubGlobal('navigator', {...navigator, locks: {request: lockRequest}})
    const unexpectedFetch = vi.fn().mockRejectedValue(new Error('Unexpected Supabase network request'))
    const expiresAt = Math.floor(Date.now() / 1000) + 3600
    const session = {
      access_token: 'fixture-access-token',
      refresh_token: 'fixture-refresh-token',
      expires_at: expiresAt,
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'fixture-user',
        aud: 'authenticated',
        email: 'fixture@example.com',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      },
    }
    const storage = {
      getItem: (key: string) => key === 'auth-profile-lock' ? JSON.stringify(session) : null,
      setItem: () => undefined,
      removeItem: () => undefined,
    }

    fixture.client = createClient('https://supabase.fixture.invalid', 'test-anon-key', {
      auth: {
        storageKey: 'auth-profile-lock',
        storage,
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {fetch: unexpectedFetch},
    })

    vi.resetModules()
    const axios = (await import('axios')).default
    const previousAdapter = axios.defaults.adapter
    const backendAdapter = vi.fn<AxiosAdapter>().mockImplementation(async (config) => ({
      config,
      data: {success: true, data: {id: 'fixture-profile'}},
      status: 200,
      statusText: 'OK',
      headers: {},
    }))
    axios.defaults.adapter = backendAdapter

    try {
      const {ApiClient} = await import('../lib/api/client')
      const result = await new ApiClient().get<{id: string}>('/auth/me')

      expect(result).toMatchObject({success: true, data: {id: 'fixture-profile'}})
      expect(backendAdapter).toHaveBeenCalledOnce()
      expect(backendAdapter.mock.calls[0][0].headers?.Authorization).toBe('Bearer fixture-access-token')
      expect(lockRequest).not.toHaveBeenCalled()
      expect(unexpectedFetch).not.toHaveBeenCalled()
    } finally {
      axios.defaults.adapter = previousAdapter
    }
  })
})
