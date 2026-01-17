/**
 * Supabase Authentication Service
 * Handles all Supabase auth operations: email/password, OAuth, session management
 */

import {isSupabaseConfigured, supabase} from './config'
import type {AuthError, Provider, Session, User} from '@supabase/supabase-js'

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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
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

