/**
 * Authentication Context with Supabase Integration
 * React Context for managing role-based authentication state with Supabase
 */

import {createContext, type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import type {AuthContextType, AuthUser, SkillLevel, UpdateProfileDto, UserRole} from '../types/auth.types'
import type {OAuthProvider} from '../lib/supabase'
import {
  getCurrentSession,
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
import {getOfflineQueueManager} from '../services/offlineQueue'

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
  const handleAuthSuccess = useCallback(async (profile: AuthUser | null): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> => {
    if (!profile) {
      return { success: false, error: 'Failed to load profile' }
    }

    setUser(profile)
    
    setRoleState(deriveRole(profile))
    

    setIsNewUser(profile.isNewUser || false)
    localStorage.setItem('auth_user', JSON.stringify(profile))

    return { success: true, isNewUser: profile.isNewUser }
  }, [])

  /**
   * Initialize auth state from Supabase session on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true)

      try {
        const session = await getCurrentSession()

        if (session?.user) {
          const profile = await loadUserProfile()

          if (profile) {
            setUser(profile)
            setRoleState(deriveRole(profile))
            setIsNewUser(profile.isNewUser || false)
            localStorage.setItem('auth_user', JSON.stringify(profile))
            authenticatedUserIdRef.current = session.user.id
          }
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
          const profile = await loadUserProfile()
          if (profile) {
            setUser(profile)
            setRoleState(deriveRole(profile))
        
            setIsNewUser(profile.isNewUser || false)
            localStorage.setItem('auth_user', JSON.stringify(profile))
            authenticatedUserIdRef.current = session.user.id
          }
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
  const loginWithEmail = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase is not configured' }
    }

    try {
      const result = await supabaseSignIn(email, password)

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      if (result.session) {
        authenticatedUserIdRef.current = result.session.user.id
        const profile = await loadUserProfile()
        return handleAuthSuccess(profile)
      }

      return { success: false, error: 'No session returned' }
    } catch (err) {
      console.error('Login error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      return { success: false, error: errorMessage }
    }
  }, [loadUserProfile, handleAuthSuccess])

  /**
   * Sign up with email and password (Supabase)
   */
  const signUpWithEmailFn = useCallback(async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string; message?: string; isNewUser?: boolean }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase is not configured' }
    }

    try {
      const result = await supabaseSignUp(email, password, { name })

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      // If email confirmation is required, session might be null
      if (result.session) {
        authenticatedUserIdRef.current = result.session.user.id
        const profile = await loadUserProfile()
        return handleAuthSuccess(profile)
      }

      // Email confirmation required
      return { success: true, message: 'Please check your email to confirm your account' }
    } catch (err) {
      console.error('Sign up error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
      return { success: false, error: errorMessage }
    }
  }, [loadUserProfile, handleAuthSuccess])

  /**
   * Login with OAuth provider (Google, GitHub, etc.)
   */
  const loginWithOAuth = useCallback(async (provider: OAuthProvider): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase is not configured' }
    }

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`
      const result = await supabaseOAuth(provider, redirectUrl)

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      // OAuth redirects the user, so this won't return until callback
      return { success: true }
    } catch (err) {
      console.error('OAuth error:', err)
      return { success: false, error: 'OAuth login failed' }
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
  const resetPasswordFn = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase is not configured' }
    }

    try {
      const result = await supabaseResetPassword(email)

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      return { success: true }
    } catch (err) {
      console.error('Password reset error:', err)
      return { success: false, error: 'Password reset failed' }
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
  const completeOnboarding = useCallback(async (instrument: string, level: SkillLevel, profileData?: { name?: string; phone?: string; contact?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' }
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
        setIsNewUser(false)
      }

      return { success: response.success, error: response.error }
    } catch (err) {
      console.error('Onboarding error:', err)
      // Extract error message from ApiError or Error
      const errorMessage = (err && typeof err === 'object' && 'message' in err)
        ? (err as { message: string }).message
        : 'Failed to update profile'
      return { success: false, error: errorMessage }
    }
  }, [user])

  /**
   * Clear new user flag (after onboarding is dismissed)
   */
  const clearNewUserFlag = useCallback(() => {
    setIsNewUser(false)
  }, [])

  /**
   * Update user profile via backend
   */
  const updateProfile = useCallback(async (updates: UpdateProfileDto): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' }
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

      return response
    } catch (err) {
      console.error('Profile update error:', err)
      return { success: false, error: 'Failed to update profile' }
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
