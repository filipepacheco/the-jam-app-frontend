/**
 * Authentication Context with Supabase Integration
 * React Context for managing role-based authentication state with Supabase
 */

import {createContext, type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import type {AuthActionResult, AuthContextType, AuthUser, SkillLevel, UpdateProfileDto, UserRole} from '../types/auth.types'
import type {OAuthProvider} from '../lib/supabase'
import {
  getCurrentSession,
  isExistingEmailSignUpError,
  isExistingEmailSignUpResult,
  markOnboardingComplete,
  isSupabaseConfigured,
  onAuthStateChange,
  resetPassword as supabaseResetPassword,
  signInWithEmail as supabaseSignIn,
  signInWithOAuth as supabaseOAuth,
  signOut as supabaseSignOut,
  signUpWithEmail as supabaseSignUp,
} from '../lib/supabase'
import {clearTokenCache} from '../lib/auth'
import {apiClient} from '../lib/api'
import {getOfflineQueueManager} from '../services'
import type {User as SupabaseUser} from '@supabase/supabase-js'
import {getRedirectPath} from '../utils/navigationUtils'
import {onboardingKey, shouldShowOnboarding} from '../lib/auth/onboarding'

function withKnownName(profile: AuthUser, identity: SupabaseUser): AuthUser {
  const knownName = identity.user_metadata?.full_name || identity.user_metadata?.name
  return profile.name || typeof knownName !== 'string' || !knownName.trim()
    ? profile
    : {...profile, name: knownName.trim()}
}

/**
 * Derive user role from profile data.
 * Uses explicit role field if set, otherwise falls back to isHost flag.
 */
function deriveRole(profile: { role?: UserRole; isHost?: boolean }): UserRole {
  return profile.role || (profile.isHost ? 'host' : 'user')
}

/**
 * Create the Authentication Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

function unexpectedAuthError(error: unknown, errorKey: AuthActionResult['errorKey']): AuthActionResult {
  if (error instanceof Error && error.message) {
    return {success: false, error: error.message}
  }
  return {success: false, errorKey}
}

/**
 * AuthProvider component
 * Wraps the app to provide authentication context to all components
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [role, setRoleState] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        const parsedUser = JSON.parse(stored)
        // Derive role from user data - check role field first, then isHost
        if (parsedUser.role) return parsedUser.role
        if (parsedUser.isHost === true) return 'host'
        return 'viewer'
      }
    } catch (err) {
      console.error('Failed to parse stored auth_user:', err)
    }
    return 'viewer'
  })
  const [isNewUser, setIsNewUser] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const authenticatedUserIdRef = useRef<string | null>(null)

  const isAuthenticated = user !== null

  /**
   * Load user profile from backend via API client
   */
  const loadUserProfile = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const response = await apiClient.get<AuthUser>('/auth/me')
      return response.data || null
    } catch (err) {
      console.error('Failed to load profile:', err)
      return null
    }
  }, [])

  /**
   * Helper function to set up auth state after successful login/signup
   * Derives role from profile data with fallback logic
   */
  const handleAuthSuccess = useCallback(async (profile: AuthUser | null, identity: SupabaseUser): Promise<AuthActionResult> => {
    if (!profile) {
      return {success: false, errorKey: 'auth.errors.profile_load_failed'}
    }

    const currentProfile = withKnownName(profile, identity)
    setUser(currentProfile)
    
    setRoleState(deriveRole(currentProfile))
    

    setIsNewUser(shouldShowOnboarding(profile, identity))
    localStorage.setItem('auth_user', JSON.stringify(currentProfile))

    return { success: true, isNewUser: shouldShowOnboarding(profile, identity) }
  }, [])

  const applyProfile = async (identity: SupabaseUser) => {
    const profile = await loadUserProfile()
    if (profile) {
      const currentProfile = withKnownName(profile, identity)
      setUser(currentProfile)
      setRoleState(deriveRole(profile))
      setIsNewUser(shouldShowOnboarding(profile, identity))
      localStorage.setItem('auth_user', JSON.stringify(currentProfile))
      authenticatedUserIdRef.current = identity.id
    }
  }

  /**
   * Initialize auth state from Supabase session on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true)

      try {
        const session = await getCurrentSession()

        if (session?.user) {
          await applyProfile(session.user)
        } else {
          // No valid session - clear any stale localStorage data
          setUser(null)
          setRoleState('viewer')
    
          localStorage.removeItem('auth_user')
          authenticatedUserIdRef.current = null
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Subscribe to auth state changes
    if (isSupabaseConfigured()) {
      const { unsubscribe } = onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Supabase v2 fires SIGNED_IN on every token refresh (tab focus).
          // Skip redundant /auth/me calls when we already have this user loaded.
          if (authenticatedUserIdRef.current === session.user.id) {
            return
          }
          await applyProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setRoleState('viewer')
    
          setIsNewUser(false)
          localStorage.removeItem('auth_user')
          authenticatedUserIdRef.current = null
        } else if (event === 'TOKEN_REFRESHED') {
          // No action needed - Supabase handles refresh internally
        }
      })

      return () => unsubscribe()
    }
  }, [loadUserProfile])

  /**
   * Login with email and password (Supabase)
   */
  const loginWithEmail = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured()) {
      return {success: false, errorKey: 'auth.errors.configuration'}
    }

    try {
      const result = await supabaseSignIn(email, password)

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      if (result.session) {
        authenticatedUserIdRef.current = result.session.user.id
        const profile = await loadUserProfile()
        return handleAuthSuccess(profile, result.session.user)
      }

      return {success: false, errorKey: 'auth.errors.session_missing'}
    } catch (err) {
      console.error('Login error:', err)
      return unexpectedAuthError(err, 'auth.errors.login_failed')
    }
  }, [loadUserProfile, handleAuthSuccess])

  /**
   * Sign up with email and password (Supabase)
   */
  const signUpWithEmailFn = useCallback(async (email: string, password: string, name?: string): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured()) {
      return {success: false, errorKey: 'auth.errors.configuration'}
    }

    try {
      const result = await supabaseSignUp(email, password, { name })

      if (result.error) {
        if (isExistingEmailSignUpError(result.error)) {
          return { success: false, errorKey: 'auth.sign_up_errors.email_already_registered' }
        }
        return { success: false, error: result.error.message }
      }

      // If email confirmation is required, session might be null
      if (result.session) {
        authenticatedUserIdRef.current = result.session.user.id
        const profile = await loadUserProfile()
        return handleAuthSuccess(profile, result.session.user)
      }

      if (isExistingEmailSignUpResult(result)) {
        return { success: false, errorKey: 'auth.sign_up_errors.email_already_registered' }
      }

      if (result.user) {
        return { success: true, messageKey: 'auth.email_verification.description' }
      }

      return { success: false, errorKey: 'auth.sign_up_errors.unexpected_response' }
    } catch (err) {
      console.error('Sign up error:', err)
      return unexpectedAuthError(err, 'auth.sign_up_errors.unexpected_response')
    }
  }, [loadUserProfile, handleAuthSuccess])

  /**
   * Login with OAuth provider (Google, GitHub, etc.)
   */
  const loginWithOAuth = useCallback(async (provider: OAuthProvider): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured()) {
      return {success: false, errorKey: 'auth.errors.configuration'}
    }

    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('redirect', getRedirectPath())
      const redirectUrl = callbackUrl.toString()
      const result = await supabaseOAuth(provider, redirectUrl)

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      // OAuth redirects the user, so this won't return until callback
      return { success: true }
    } catch (err) {
      console.error('OAuth error:', err)
      return unexpectedAuthError(err, 'auth.errors.oauth_failed')
    }
  }, [])

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoggingOut(true)
    let error: string | undefined

    try {
      if (isSupabaseConfigured()) {
        await supabaseSignOut()
      }
    } catch (err) {
      console.error('Logout error:', err)
      error = err instanceof Error ? err.message : 'Logout failed'
    } finally {
      // Always clear local state regardless of Supabase signout result
      clearTokenCache()
      localStorage.removeItem('auth_user')
      getOfflineQueueManager().clearAll()
      setUser(null)
      setRoleState('viewer')
      setIsNewUser(false)
      authenticatedUserIdRef.current = null
      setIsLoggingOut(false)
    }

    return error ? { success: false, error } : { success: true }
  }, [])

  /**
   * Reset password
   */
  const resetPasswordFn = useCallback(async (email: string): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured()) {
      return {success: false, errorKey: 'auth.errors.configuration'}
    }

    try {
      const result = await supabaseResetPassword(email)

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      return { success: true }
    } catch (err) {
      console.error('Password reset error:', err)
      return unexpectedAuthError(err, 'auth.errors.password_reset_failed')
    }
  }, [])

  /**
   * Legacy login method (for backward compatibility)
   */
  const login = useCallback((authUser: AuthUser) => {
    try {
      localStorage.setItem('auth_user', JSON.stringify(authUser))
      setUser(authUser)
      setRoleState(authUser.role)
  
    } catch (err) {
      console.error('Login failed:', err)
    }
  }, [])

  /**
   * Switch user role
   */
  const setRole = useCallback((newRole: UserRole) => {
    setUser(prev => {
      if (prev) {
        const updatedUser = { ...prev, role: newRole }
        localStorage.setItem('auth_user', JSON.stringify(updatedUser))
        return updatedUser
      }
      return prev
    })
    setRoleState(newRole)
  }, [])

  /**
   * Update user profile
   */
  const updateUser = useCallback((fields: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev
      const updatedUser = { ...prev, ...fields }
      localStorage.setItem('auth_user', JSON.stringify(updatedUser))
      setRoleState(deriveRole(updatedUser))
      return updatedUser
    })
  }, [])

  /**
   * Complete onboarding - update instrument, skill level, and contact info
   */
  const completeOnboarding = useCallback(async (instrument: string, level: SkillLevel, profileData?: { name?: string; phone?: string; contact?: string }): Promise<AuthActionResult> => {
    if (!user) {
      return {success: false, errorKey: 'auth.errors.not_authenticated'}
    }

    try {
      // Prepare update object with required fields (instrument and level are required for registrationComplete)
      const updatePayload: UpdateProfileDto = { instrument, level }
      if (profileData?.name) updatePayload.name = profileData.name
      if (profileData?.phone) updatePayload.phone = profileData.phone
      if (profileData?.contact) updatePayload.contact = profileData.contact

      const response = await apiClient.patch<AuthUser>('/auth/profile', updatePayload)

      if (response.success && response.data) {
        // Update local user state
        localStorage.setItem('auth_user', JSON.stringify(response.data))
        setUser(response.data)
        const {error} = await markOnboardingComplete()
        if (error) return {success: false, error: error.message}
        const session = await getCurrentSession()
        if (session?.user.id) localStorage.setItem(onboardingKey(session.user.id), 'true')
        setIsNewUser(false)
      }

      return response.success
        ? {success: true}
        : response.error
          ? {success: false, error: response.error}
          : {success: false, errorKey: 'auth.errors.profile_update_failed'}
    } catch (err) {
      console.error('Onboarding error:', err)
      return unexpectedAuthError(err, 'auth.errors.profile_update_failed')
    }
  }, [user])

  /**
   * Clear new user flag (after onboarding is dismissed)
   */
  const clearNewUserFlag = useCallback(async (): Promise<AuthActionResult> => {
    if (!user) return {success: false, errorKey: 'auth.errors.not_authenticated'}
    try {
      const {error} = await markOnboardingComplete()
      if (error) return {success: false, error: error.message}
      const session = await getCurrentSession()
      if (session?.user.id) localStorage.setItem(onboardingKey(session.user.id), 'true')
      setIsNewUser(false)
      return {success: true}
    } catch (error) {
      return unexpectedAuthError(error, 'auth.errors.profile_update_failed')
    }
  }, [user])

  /**
   * Update user profile via backend
   */
  const updateProfile = useCallback(async (updates: UpdateProfileDto): Promise<AuthActionResult> => {
    if (!user) {
      return {success: false, errorKey: 'auth.errors.not_authenticated'}
    }

    try {
      const response = await apiClient.patch<AuthUser>('/auth/profile', updates)

      if (response.success && response.data) {
        // Update local user state
        const updatedUser = { ...user, ...response.data }
        localStorage.setItem('auth_user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        setRoleState(deriveRole(updatedUser))
      }

      return response.success
        ? {success: true}
        : response.error
          ? {success: false, error: response.error}
          : {success: false, errorKey: 'auth.errors.profile_update_failed'}
    } catch (err) {
      console.error('Profile update error:', err)
      return unexpectedAuthError(err, 'auth.errors.profile_update_failed')
    }
  }, [user])

  /**
   * Helper method: Check if user is musician/user
   */
  const isUserRole = useCallback(() => {
    return role === 'user'
  }, [role])

  /**
   * Helper method: Check if user is viewer (anonymous)
   */
  const isViewer = useCallback(() => {
    return role === 'viewer'
  }, [role])

  const value: AuthContextType = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    role,
    isNewUser,
    isLoggingOut,
    loginWithEmail,
    signUpWithEmail: signUpWithEmailFn,
    loginWithOAuth,
    logout,
    resetPassword: resetPasswordFn,
    login,
    setRole,
    updateUser,
    updateProfile,
    completeOnboarding,
    clearNewUserFlag,
    isUser: isUserRole,
    isViewer,
  }), [
    user,
    isAuthenticated,
    isLoading,
    role,
    isNewUser,
    isLoggingOut,
    loginWithEmail,
    signUpWithEmailFn,
    loginWithOAuth,
    logout,
    resetPasswordFn,
    login,
    setRole,
    updateUser,
    updateProfile,
    completeOnboarding,
    clearNewUserFlag,
    isUserRole,
    isViewer,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Export AuthContext for use in custom hooks
 */
export { AuthContext }
