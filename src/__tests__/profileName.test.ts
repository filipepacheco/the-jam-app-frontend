import {describe, expect, it} from 'vitest'
import type {User} from '@supabase/supabase-js'
import type {AuthUser} from '../types/auth.types'
import {resolveProfileName} from '../lib/auth/profileName'

const identity = {
  id: 'google-subject',
  email: 'alex.example@example.invalid',
  app_metadata: {provider: 'google'},
  user_metadata: {full_name: 'Alex Example', name: 'Alex Example'},
} as User

const profile = {
  id: 'musician-1',
  email: 'alex.example@example.invalid',
  name: 'alex.example',
  isNewUser: true,
  registrationComplete: false,
  role: 'user',
  isHost: false,
} satisfies AuthUser

describe('resolveProfileName', () => {
  it.each(['alex.example', 'alex.example@example.invalid'])(
    'uses Google full_name when an incomplete profile contains the generated %s',
    (name) => {
      expect(resolveProfileName({...profile, name}, identity)).toBe('Alex Example')
    },
  )

  it('preserves an explicitly chosen profile name', () => {
    expect(resolveProfileName({...profile, name: 'Stage Alex'}, identity)).toBe('Stage Alex')
  })

  it('preserves a completed profile even if its chosen name matches the email prefix', () => {
    expect(resolveProfileName({...profile, name: 'alex.example', isNewUser: false, registrationComplete: true}, identity))
      .toBe('alex.example')
  })

  it('uses the profile name when provider display metadata is unavailable', () => {
    expect(resolveProfileName(profile, {...identity, user_metadata: {}})).toBe('alex.example')
  })
})
