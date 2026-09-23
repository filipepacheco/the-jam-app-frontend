/**
 * Supabase Authentication Service
 * Handles all Supabase auth operations: email/password, OAuth, session management
 */

import {isSupabaseConfigured, supabase} from './config'
import type {AuthError, Provider, Session, User} from '@supabase/supabase-js'
import {getRedirectPath} from '../../utils/navigationUtils'

/**
 * Supported OAuth providers
 */
export type OAuthProvider = 'google' | 'github' | 'discord' | 'spotify'

/**
 * Auth result from Supabase operations
 */
export interface SupabaseAuthResult {
  user: User | null
  session: Session | null
  error: AuthError | null
}

/**
 * Supabase intentionally returns a user without identities for an existing
 * email when email confirmation is enabled. That response has no error and
 * no session, so callers must distinguish it from a new unconfirmed signup.
 */
export function isExistingEmailSignUpResult(result: Pick<SupabaseAuthResult, 'user' | 'session' | 'error'>): boolean {
  return result.error === null &&
    result.session === null &&
    result.user?.identities !== undefined &&
    result.user.identities.length === 0
}

/**
 * This covers providers/configurations that disclose the duplicate directly
 * instead of returning the identity-less response above.
 */
export function isExistingEmailSignUpError(error: Pick<AuthError, 'message'> | null): boolean {
  return Boolean(error?.message.toLowerCase().includes('already registered'))
}

/**
 * Sign up with email and password
 * @param email - User email
 * @param password - User password
 * @param metadata - Optional user metadata (name, etc.)
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { name?: string }
): Promise<SupabaseAuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      session: null,
      error: { message: 'Supabase is not configured', status: 500 } as AuthError,
    }
  }

  const callbackUrl = new URL('/auth/callback', window.location.origin)
  callbackUrl.searchParams.set('redirect', getRedirectPath())
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: callbackUrl.toString(),
    },
  })

  return {
    user: data.user,
    session: data.session,
    error,
  }
}

/**
 * Sign in with email and password
 * @param email - User email
 * @param password - User password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<SupabaseAuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      session: null,
      error: { message: 'Supabase is not configured', status: 500 } as AuthError,
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return {
    user: data.user,
    session: data.session,
    error,
  }
}

/**
 * Sign in with OAuth provider (Google, GitHub, Discord, Spotify)
 * This will redirect the user to the OAuth provider's login page
 * @param provider - OAuth provider name
 * @param redirectTo - URL to redirect after successful authentication
 */
export async function signInWithOAuth(
  provider: OAuthProvider,
  redirectTo?: string
): Promise<{ error: AuthError | null }> {
  if (!isSupabaseConfigured()) {
    return {
      error: { message: 'Supabase is not configured', status: 500 } as AuthError,
    }
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
    },
  })

  return { error }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  if (!isSupabaseConfigured()) {
    return { error: null }
  }

  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const { data } = await supabase.auth.getUser()
  return data.user
}

/**
 * Get access token from current session
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getCurrentSession()
  return session?.access_token || null
}

/**
 * Send password reset email
 * @param email - User email
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  if (!isSupabaseConfigured()) {
    return {
      error: { message: 'Supabase is not configured', status: 500 } as AuthError,
    }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  return { error }
}

/**
 * Update password (after reset or when logged in)
 * @param newPassword - New password
 */
export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  if (!isSupabaseConfigured()) {
    return {
      error: { message: 'Supabase is not configured', status: 500 } as AuthError,
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  return { error }
}

/** Persist the optional welcome step on the account across devices. */
export async function markOnboardingComplete(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.updateUser({
    data: { jamOnboardingComplete: true },
  })
  return { error }
}

/**
 * Subscribe to auth state changes
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): { unsubscribe: () => void } {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} }
  }

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })

  return { unsubscribe: () => data.subscription.unsubscribe() }
}

/**
 * Exchange OAuth code for session (used in callback page)
 * Supabase handles this automatically with detectSessionInUrl: true
 * This is a helper to explicitly exchange the code if needed
 */
export async function exchangeCodeForSession(code: string): Promise<SupabaseAuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      session: null,
      error: { message: 'Supabase is not configured', status: 500 } as AuthError,
    }
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  return {
    user: data.user,
    session: data.session,
    error,
  }
}
