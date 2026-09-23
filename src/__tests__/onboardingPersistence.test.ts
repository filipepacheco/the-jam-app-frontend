import {describe, expect, it, vi} from 'vitest'

const updateUser = vi.hoisted(() => vi.fn())

vi.mock('../lib/supabase/config', () => ({
  supabase: {auth: {updateUser}},
  isSupabaseConfigured: () => true,
}))

import {markOnboardingComplete} from '../lib/supabase/authService'

describe('onboarding completion persistence', () => {
  it('writes a durable account metadata marker', async () => {
    updateUser.mockResolvedValueOnce({error: null})

    expect(await markOnboardingComplete()).toEqual({error: null})
    expect(updateUser).toHaveBeenCalledWith({data: {jamOnboardingComplete: true}})
  })
})
