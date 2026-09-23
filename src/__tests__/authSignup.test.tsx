import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter} from 'react-router-dom'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {isExistingEmailSignUpError, isExistingEmailSignUpResult} from '../lib/supabase/authService'
import i18n from '../i18n'
import {OnboardingModal} from '../components/OnboardingModal'
import {SupabaseLoginForm} from '../components/forms/SupabaseLoginForm'
import {shouldShowOnboarding} from '../lib/auth/onboarding'
import type {User} from '@supabase/supabase-js'
import type {AuthUser} from '../types/auth.types'

const authMocks = vi.hoisted(() => ({
  updateProfile: vi.fn(),
  clearNewUserFlag: vi.fn(),
  profile: {id: 'person-1', name: null as string | null, phone: ''},
  loginWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  loginWithOAuth: vi.fn(),
}))

vi.mock('../hooks', async (importOriginal) => ({
  ...await importOriginal<typeof import('../hooks')>(),
  useAuth: () => ({
    user: authMocks.profile,
    updateProfile: authMocks.updateProfile,
    clearNewUserFlag: authMocks.clearNewUserFlag,
    loginWithEmail: authMocks.loginWithEmail,
    signUpWithEmail: authMocks.signUpWithEmail,
    loginWithOAuth: authMocks.loginWithOAuth,
    isLoading: false,
  }),
}))

describe('isExistingEmailSignUpResult', () => {
  it('recognizes Supabase’s no-error existing-email response', () => {
    expect(isExistingEmailSignUpResult({
      error: null,
      session: null,
      user: {identities: []},
    })).toBe(true)
  })

  it('does not mistake a new confirmation-required signup for an existing email', () => {
    expect(isExistingEmailSignUpResult({
      error: null,
      session: null,
      user: {identities: [{id: 'identity'}]},
    })).toBe(false)
  })

  it('recognizes an explicit provider duplicate-email error', () => {
    expect(isExistingEmailSignUpError({message: 'User already registered'})).toBe(true)
  })
})

describe('welcome completion across sign ins', () => {
  const profile = {isNewUser: true} as AuthUser
  const identity = (complete: boolean) => ({id: 'supabase-person-1', user_metadata: {jamOnboardingComplete: complete}} as User)

  it('does not reopen the welcome step when Supabase account metadata records completion', () => {
    expect(shouldShowOnboarding(profile, identity(true))).toBe(false)
    expect(shouldShowOnboarding(profile, identity(false))).toBe(true)
  })

  it('uses the local marker after a successful account update', () => {
    localStorage.setItem('jam_onboarding_complete:supabase-person-1', 'true')
    expect(shouldShowOnboarding(profile, identity(false))).toBe(false)
    localStorage.removeItem('jam_onboarding_complete:supabase-person-1')
  })
})

describe('OnboardingModal contact details', () => {
  beforeEach(async () => {
    authMocks.profile.name = null
    authMocks.updateProfile.mockReset().mockResolvedValue({success: true})
    authMocks.clearNewUserFlag.mockReset().mockResolvedValue({success: true})
    authMocks.loginWithEmail.mockReset()
    authMocks.signUpWithEmail.mockReset()
    authMocks.loginWithOAuth.mockReset()
    await i18n.changeLanguage('en')
  })

  it('submits a completed profile without a phone number', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <OnboardingModal isOpen />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Phone (optional)')).not.toBeRequired()

    await user.type(screen.getByRole('textbox', {name: /Your Name/}), 'Alex Musician')
    await user.selectOptions(screen.getByRole('combobox', {name: /Main instrument \(optional\)/}), 'guitars')
    await user.selectOptions(screen.getByRole('combobox', {name: /Experience level \(optional\)/}), 'BEGINNER')
    await user.click(screen.getByRole('button', {name: 'Get Started'}))

    await waitFor(() => {
      expect(authMocks.updateProfile).toHaveBeenCalledWith({
        name: 'Alex Musician',
        instrument: 'guitars',
        level: 'BEGINNER',
      })
    })
    expect(authMocks.clearNewUserFlag).toHaveBeenCalledOnce()
  })

  it('renders a localized context error key when profile completion fails', async () => {
    authMocks.updateProfile.mockResolvedValueOnce({
      success: false,
      errorKey: 'auth.errors.profile_update_failed',
    })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <OnboardingModal isOpen />
      </MemoryRouter>,
    )

    await user.type(screen.getByRole('textbox', {name: /Your Name/}), 'Alex Musician')
    await user.selectOptions(screen.getByRole('combobox', {name: /Main instrument \(optional\)/}), 'guitars')
    await user.selectOptions(screen.getByRole('combobox', {name: /Experience level \(optional\)/}), 'BEGINNER')
    await user.click(screen.getByRole('button', {name: 'Get Started'}))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't update your profile. Please try again.",
    )
  })

  it('prefills a known name and accepts optional instrument and experience', async () => {
    authMocks.profile.name = 'filipe'
    const user = userEvent.setup()
    render(<MemoryRouter><OnboardingModal isOpen /></MemoryRouter>)

    expect(screen.getByRole('textbox', {name: /Your Name/})).toHaveValue('filipe')
    expect(screen.getByRole('combobox', {name: /main instrument/i})).not.toBeRequired()
    expect(screen.getByRole('combobox', {name: /experience level/i})).not.toBeRequired()
    await user.click(screen.getByRole('button', {name: 'Get Started'}))

    await waitFor(() => expect(authMocks.updateProfile).toHaveBeenCalledWith({name: 'filipe'}))
    expect(authMocks.clearNewUserFlag).toHaveBeenCalledOnce()
  })

  it('persists a skipped welcome step without changing the profile', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><OnboardingModal isOpen /></MemoryRouter>)

    await user.click(screen.getByRole('button', {name: 'Skip for now'}))

    await waitFor(() => expect(authMocks.clearNewUserFlag).toHaveBeenCalledOnce())
    expect(authMocks.updateProfile).not.toHaveBeenCalled()
  })
})

describe('SupabaseLoginForm signup errors', () => {
  beforeEach(async () => {
    authMocks.signUpWithEmail.mockReset().mockResolvedValue({
      success: false,
      errorKey: 'auth.sign_up_errors.email_already_registered',
    })
    await i18n.changeLanguage('en')
  })

  it('renders the localized existing-email guidance instead of a confirmation message', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <SupabaseLoginForm />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', {name: "Don't have an account? Sign Up"}))
    await user.type(screen.getByLabelText(/Email/), 'already-registered@example.com')
    await user.type(screen.getByLabelText(/Password/), 'a-safe-test-password')
    await user.click(screen.getByRole('button', {name: 'Create Account'}))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This email is already registered. Sign in or reset your password.',
    )
  })

  it('renders a localized OAuth context error key', async () => {
    authMocks.loginWithOAuth.mockResolvedValueOnce({
      success: false,
      errorKey: 'auth.errors.oauth_failed',
    })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <SupabaseLoginForm />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', {name: /Continue with Google/i}))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't sign you in with that account. Please try again.",
    )
  })

  it('keeps the full return URL through the OAuth round trip', async () => {
    window.history.replaceState({}, '', '/login?redirect=%2Fjams%2Fsunday%3Ftab%3Dsongs%23signup')
    authMocks.loginWithOAuth.mockResolvedValueOnce({success: true})
    const user = userEvent.setup()

    render(<MemoryRouter><SupabaseLoginForm /></MemoryRouter>)
    await user.click(screen.getByRole('button', {name: /Continue with Google/i}))

    await waitFor(() => expect(sessionStorage.getItem('auth_redirect')).toBe('/jams/sunday?tab=songs#signup'))
    sessionStorage.removeItem('auth_redirect')
    window.history.replaceState({}, '', '/')
  })
})
