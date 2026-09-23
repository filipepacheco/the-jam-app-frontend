import {render, screen, waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {AuthProvider} from '../contexts/AuthContext'
import {OnboardingModal} from '../components/OnboardingModal'
import i18n from '../i18n'

const mocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({unsubscribe: vi.fn()})),
  getProfile: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  getCurrentSession: mocks.getCurrentSession,
  onAuthStateChange: mocks.onAuthStateChange,
  isSupabaseConfigured: () => true,
  isExistingEmailSignUpError: vi.fn(),
  isExistingEmailSignUpResult: vi.fn(),
  markOnboardingComplete: vi.fn(),
  resetPassword: vi.fn(),
  signInWithEmail: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  signUpWithEmail: vi.fn(),
}))
vi.mock('../lib/auth', () => ({clearTokenCache: vi.fn()}))
vi.mock('../lib/api', () => ({apiClient: {get: mocks.getProfile, patch: vi.fn()}}))
vi.mock('../services', () => ({getOfflineQueueManager: () => ({clearAll: vi.fn()})}))

const identity = {
  id: 'google-subject',
  email: 'alex.example@example.invalid',
  app_metadata: {provider: 'google'},
  user_metadata: {full_name: 'Alex Example', name: 'Alex Example'},
}

const profile = {
  id: 'musician-1',
  supabaseUserId: identity.id,
  email: identity.email,
  name: 'alex.example',
  isNewUser: true,
  registrationComplete: false,
  role: 'user',
  isHost: false,
}

describe('Google welcome name', () => {
  beforeEach(async () => {
    localStorage.clear()
    mocks.getCurrentSession.mockReset().mockResolvedValue({user: identity})
    mocks.getProfile.mockReset()
    await i18n.changeLanguage('en')
  })

  afterEach(() => localStorage.clear())

  it('shows the provider full name when the backend profile has an email-derived placeholder', async () => {
    mocks.getProfile.mockResolvedValue({data: profile})

    render(<MemoryRouter><AuthProvider><OnboardingModal isOpen /></AuthProvider></MemoryRouter>)

    await waitFor(() => expect(screen.getByRole('textbox', {name: /Your Name/})).toHaveValue('Alex Example'))
  })

  it('keeps an existing name the musician chose', async () => {
    mocks.getProfile.mockResolvedValue({data: {...profile, name: 'Stage Alex'}})

    render(<MemoryRouter><AuthProvider><OnboardingModal isOpen /></AuthProvider></MemoryRouter>)

    await waitFor(() => expect(screen.getByRole('textbox', {name: /Your Name/})).toHaveValue('Stage Alex'))
  })
})
