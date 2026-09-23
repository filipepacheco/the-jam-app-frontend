import {useContext} from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {AuthContext, AuthProvider} from '../contexts/AuthContext'

const mocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  getProfile: vi.fn(),
  clearTokenCache: vi.fn(),
}))

let authListener: ((event: string, session: {user: {id: string}} | null) => void) | undefined

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
vi.mock('../lib/auth', () => ({clearTokenCache: mocks.clearTokenCache}))
vi.mock('../lib/api', () => ({apiClient: {get: mocks.getProfile, patch: vi.fn()}}))
vi.mock('../services', () => ({getOfflineQueueManager: () => ({clearAll: vi.fn()})}))

function AuthState() {
  const auth = useContext(AuthContext)
  return <>
    <output>{auth?.isLoading ? 'loading' : auth?.isAuthenticated ? 'authenticated' : 'anonymous'}</output>
    <span data-testid="user-id">{auth?.user?.id ?? 'none'}</span>
    <span data-testid="role">{auth?.role}</span>
  </>
}

describe('auth initialization', () => {
  beforeEach(() => {
    mocks.getCurrentSession.mockReset()
    mocks.onAuthStateChange.mockClear()
    mocks.onAuthStateChange.mockImplementation((listener) => {
      authListener = listener
      return {unsubscribe: vi.fn()}
    })
    mocks.getProfile.mockReset()
    mocks.clearTokenCache.mockClear()
    localStorage.setItem('auth_user', JSON.stringify({id: 'stale-user', name: 'Stale', role: 'user'}))
  })

  afterEach(() => localStorage.removeItem('auth_user'))

  it('discards a cached profile when Supabase session initialization aborts', async () => {
    mocks.getCurrentSession.mockRejectedValueOnce(new DOMException('signal is aborted without reason', 'AbortError'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<AuthProvider><AuthState /></AuthProvider>)

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('anonymous'))
    expect(localStorage.getItem('auth_user')).toBeNull()
    consoleError.mockRestore()
  })

  it('subscribes after session initialization releases the SDK lock', async () => {
    let finishSessionRead: ((session: null) => void) | undefined
    mocks.getCurrentSession.mockReturnValueOnce(new Promise<null>((resolve) => {
      finishSessionRead = resolve
    }))

    render(<AuthProvider><AuthState /></AuthProvider>)

    expect(mocks.onAuthStateChange).not.toHaveBeenCalled()
    finishSessionRead?.(null)
    await waitFor(() => expect(mocks.onAuthStateChange).toHaveBeenCalledOnce())
    expect(screen.getByRole('status')).toHaveTextContent('anonymous')
  })

  it('discards a cached profile if backend profile verification fails', async () => {
    mocks.getCurrentSession.mockResolvedValueOnce({user: {id: 'supabase-user'}})
    mocks.getProfile.mockRejectedValueOnce(new Error('Backend unavailable'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<AuthProvider><AuthState /></AuthProvider>)

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('anonymous'))
    expect(localStorage.getItem('auth_user')).toBeNull()
    consoleError.mockRestore()
  })

  it('does not restore a profile from an obsolete request after sign-out', async () => {
    let finishProfile: ((value: {data: {id: string; name: string; role: string; isHost: boolean; isNewUser: boolean}}) => void) | undefined
    mocks.getCurrentSession.mockResolvedValueOnce({user: {id: 'supabase-user'}})
    mocks.getProfile.mockReturnValueOnce(new Promise((resolve) => { finishProfile = resolve }))

    render(<AuthProvider><AuthState /></AuthProvider>)
    await waitFor(() => expect(mocks.getProfile).toHaveBeenCalledOnce())
    await waitFor(() => expect(authListener).toBeDefined())
    authListener?.('SIGNED_OUT', null)
    finishProfile?.({data: {id: 'stale-user', name: 'Stale', role: 'user', isHost: false, isNewUser: false}})

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('anonymous'))
    expect(localStorage.getItem('auth_user')).toBeNull()
  })

  it('keeps the newer account when an older profile request finishes last', async () => {
    let finishFirstProfile: ((value: {data: {id: string; name: string; role: string; isHost: boolean; isNewUser: boolean}}) => void) | undefined
    mocks.getCurrentSession.mockResolvedValueOnce({user: {id: 'supabase-a'}})
    mocks.getProfile
      .mockReturnValueOnce(new Promise((resolve) => { finishFirstProfile = resolve }))
      .mockResolvedValueOnce({data: {id: 'profile-b', name: 'B', role: 'user', isHost: false, isNewUser: false}})

    render(<AuthProvider><AuthState /></AuthProvider>)
    await waitFor(() => expect(authListener).toBeDefined())
    authListener?.('SIGNED_IN', {user: {id: 'supabase-b'}})
    await waitFor(() => expect(JSON.parse(localStorage.getItem('auth_user') || '{}').id).toBe('profile-b'))
    finishFirstProfile?.({data: {id: 'profile-a', name: 'A', role: 'user', isHost: false, isNewUser: false}})

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('authenticated'))
    expect(JSON.parse(localStorage.getItem('auth_user') || '{}').id).toBe('profile-b')
  })

  it('clears the previous account token before loading a switched account profile', async () => {
    let finishSwitchedProfile: ((value: {data: {id: string; name: string; role: string; isHost: boolean; isNewUser: boolean}}) => void) | undefined
    mocks.getCurrentSession.mockResolvedValueOnce({user: {id: 'supabase-a'}})
    mocks.getProfile
      .mockResolvedValueOnce({data: {id: 'profile-a', name: 'A', role: 'host', isHost: true, isNewUser: false}})
      .mockImplementationOnce(() => {
        expect(mocks.clearTokenCache).toHaveBeenCalledOnce()
        return new Promise((resolve) => { finishSwitchedProfile = resolve })
      })

    render(<AuthProvider><AuthState /></AuthProvider>)
    await waitFor(() => expect(JSON.parse(localStorage.getItem('auth_user') || '{}').id).toBe('profile-a'))
    mocks.clearTokenCache.mockClear()
    authListener?.('SIGNED_IN', {user: {id: 'supabase-b'}})

    await waitFor(() => expect(mocks.getProfile).toHaveBeenCalledTimes(2))
    expect(localStorage.getItem('auth_user')).toBeNull()
    expect(screen.getByTestId('user-id')).toHaveTextContent('none')
    expect(screen.getByTestId('role')).toHaveTextContent('viewer')
    expect(screen.getByRole('status')).toHaveTextContent('loading')

    finishSwitchedProfile?.({data: {id: 'profile-b', name: 'B', role: 'user', isHost: false, isNewUser: false}})
    await waitFor(() => expect(JSON.parse(localStorage.getItem('auth_user') || '{}').id).toBe('profile-b'))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('authenticated'))
  })
})
