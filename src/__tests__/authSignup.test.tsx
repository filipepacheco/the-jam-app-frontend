import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter} from 'react-router-dom'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {isExistingEmailSignUpError, isExistingEmailSignUpResult} from '../lib/supabase/authService'
import i18n from '../i18n'
import {OnboardingModal} from '../components/OnboardingModal'
import {SupabaseLoginForm} from '../components/forms/SupabaseLoginForm'

const authMocks = vi.hoisted(() => ({
  completeOnboarding: vi.fn(),
  loginWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  loginWithOAuth: vi.fn(),
}))

vi.mock('../hooks', async (importOriginal) => ({
  ...await importOriginal<typeof import('../hooks')>(),
  useAuth: () => ({
    user: {name: null, phone: ''},
    completeOnboarding: authMocks.completeOnboarding,
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

describe('OnboardingModal contact details', () => {
  beforeEach(async () => {
    authMocks.completeOnboarding.mockReset().mockResolvedValue({success: true})
    authMocks.loginWithEmail.mockReset()
    authMocks.signUpWithEmail.mockReset()
    authMocks.loginWithOAuth.mockReset()
    await i18n.changeLanguage('en')
  })

  it('submits a completed profile without a phone number', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <MemoryRouter>
        <OnboardingModal isOpen onClose={onClose} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Phone (optional)')).not.toBeRequired()

    await user.type(screen.getByRole('textbox', {name: /Your Name/}), 'Alex Musician')
    await user.selectOptions(screen.getByRole('combobox', {name: /What's your main instrument/}), 'guitars')
    await user.selectOptions(screen.getByRole('combobox', {name: /What's your experience level/}), 'BEGINNER')
    await user.click(screen.getByRole('button', {name: 'Get Started'}))

    await waitFor(() => {
      expect(authMocks.completeOnboarding).toHaveBeenCalledWith('guitars', 'BEGINNER', {
        name: 'Alex Musician',
        phone: '',
      })
    })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders a localized context error key when profile completion fails', async () => {
    authMocks.completeOnboarding.mockResolvedValueOnce({
      success: false,
      errorKey: 'auth.errors.profile_update_failed',
    })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <OnboardingModal isOpen onClose={vi.fn()} />
      </MemoryRouter>,
    )

    await user.type(screen.getByRole('textbox', {name: /Your Name/}), 'Alex Musician')
    await user.selectOptions(screen.getByRole('combobox', {name: /What's your main instrument/}), 'guitars')
    await user.selectOptions(screen.getByRole('combobox', {name: /What's your experience level/}), 'BEGINNER')
    await user.click(screen.getByRole('button', {name: 'Get Started'}))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't update your profile. Please try again.",
    )
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
})
