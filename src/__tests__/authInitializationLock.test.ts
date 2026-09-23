import {afterEach, describe, expect, it, vi} from 'vitest'
import {createClient} from '@supabase/supabase-js'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Supabase auth initialization', () => {
  it('does not depend on a browser Web Lock that aborts during initialization', async () => {
    const lockRequest = vi.fn().mockRejectedValue(new DOMException('signal is aborted without reason', 'AbortError'))
    vi.stubGlobal('navigator', {...navigator, locks: {request: lockRequest}})
    const fetch = vi.fn().mockRejectedValue(new Error('Unexpected network request'))
    const storage = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    }

    const client = createClient('https://supabase.fixture.invalid', 'test-anon-key', {
      auth: {
        storageKey: 'auth-lock-regression',
        storage,
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {fetch},
    })

    await expect(client.auth.getSession()).resolves.toMatchObject({data: {session: null}, error: null})
    expect(lockRequest).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })
})
