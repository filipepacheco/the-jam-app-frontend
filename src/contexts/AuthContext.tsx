/**
 * Authentication Context with Supabase Integration
 * React Context for managing role-based authentication state with Supabase
 */

import {createContext, type ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import type {AuthContextType, AuthUser, UpdateProfileDto, UserRole} from '../types/auth.types'
import type {OAuthProvider} from '../lib/supabase'
import {
  getCurrentSession,
  isSupabaseConfigured,
  onAuthStateChange,
  refreshSupabaseSession,
  resetPassword as supabaseResetPassword,
  signInWithEmail as supabaseSignIn,
  signInWithOAuth as supabaseOAuth,
  signOut as supabaseSignOut,
  signUpWithEmail as supabaseSignUp,
} from '../lib/supabase'
import {clearAuth, getToken, setToken} from '../lib/auth'
import {
  logoutFromBackend,
  syncSupabaseUserToBackend,
  updateMusicianProfile,
  updateProfile as updateProfileService
} from '../services/backendAuthService'

/**
 * Create the Authentication Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider component
 * Wraps the app to provide authentication context to all components
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [role, setRoleState] = useState<UserRole>('viewer')
  const [isNewUser, setIsNewUser] = useState(false)

  // Track sync attempts to prevent duplicate calls
  const syncTimeoutRef = useRef<number | null>(null)
  const lastSyncTimeRef = useRef<number>(0)
  const isSyncingRef = useRef(false)

  // ...existing code...

  /**
   * Sync with backend with token refresh and deduplication
   * Prevents duplicate sync calls and ensures token is fresh before syncing
   */
  const syncWithBackendSafe = useCallback(async (session?: { access_token: string; user: { id: string; email?: string; user_metadata?: Record<string, unknown>; phone?: string } }) => {
    // Prevent concurrent syncs
    if (isSyncingRef.current) {
      if (import.meta.env.DEV) {
        console.log('⏳ Sync already in progress, skipping duplicate call')
      }
      return { success: true, error: 'Sync already in progress' }
    }

    // Prevent duplicate syncs within 1 second
    const now = Date.now()
    if (now - lastSyncTimeRef.current < 1000) {
      if (import.meta.env.DEV) {
        console.log('⏳ Sync called too recently, skipping duplicate call')
      }
      return { success: true, error: 'Sync called too recently' }
    }

    // Clear any pending retry
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = null
    }

    isSyncingRef.current = true
    lastSyncTimeRef.current = now

    try {
      let sessionToSync = session

      // If no session provided, refresh from Supabase to get fresh token
      if (!sessionToSync && isSupabaseConfigured()) {
        if (import.meta.env.DEV) {
          console.log('🔄 Refreshing Supabase session before sync...')
        }
        const refreshedToken = await refreshSupabaseSession()
        if (!refreshedToken) {
          throw new Error('Failed to refresh token')
        }

        // Get fresh session
        const freshSession = await getCurrentSession()
        if (!freshSession) {
          throw new Error('No session after refresh')
        }
        sessionToSync = freshSession
      }

      if (!sessionToSync) {
        throw new Error('No session available for sync')
      }

      if (import.meta.env.DEV) {
        console.log('✅ Syncing with fresh token')
      }

      // Now perform the sync
      const syncResult = await syncSupabaseUserToBackend(sessionToSync as Parameters<typeof syncSupabaseUserToBackend>[0])

      if (syncResult.error) {
        console.warn('Backend sync warning:', syncResult.error)
      }

      // Store token
      setToken(syncResult.token)
      localStorage.setItem('auth_user', JSON.stringify(syncResult.user))

      if (import.meta.env.DEV) {
        console.log('✅ Sync completed successfully')
      }

      // Update state
      setUser(syncResult.user)
      setRoleState(syncResult.user.role)
      setIsAuthenticated(true)
      setIsNewUser(syncResult.isNewUser)

      return { success: true, isNewUser: syncResult.isNewUser }
    } catch (err) {
      console.error('Sync error:', err)

      // Retry after 2 seconds
      syncTimeoutRef.current = window.setTimeout(() => {
        if (import.meta.env.DEV) {
          console.log('🔄 Retrying sync...')
        }
        syncWithBackendSafe()
      }, 2000)

      return { success: false, error: 'Sync failed' }
    } finally {
      isSyncingRef.current = false
    }
  }, [])

  /**
   * Handle successful authentication - sync with backend
   */
  const handleAuthSuccess = useCallback(async (session: { access_token: string; user: { id: string; email?: string; user_metadata?: Record<string, unknown>; phone?: string } }) => {
    return await syncWithBackendSafe(session)
  }, [syncWithBackendSafe])

  /**
   * Initialize auth state from Supabase session on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First, check for existing Supabase session
        if (isSupabaseConfigured()) {
          const session = await getCurrentSession()

          if (session) {
            // User has active Supabase session
            // Check if we already synced this user (token in localStorage)
            const existingToken = getToken()
            if (existingToken) {
              // Already synced, just restore from storage
              const storedUser = localStorage.getItem('auth_user')
              if (storedUser) {
                const parsedUser: AuthUser = JSON.parse(storedUser)
                setUser(parsedUser)
                setRoleState(parsedUser.role)
                setIsAuthenticated(true)
                setIsLoading(false)
                return
              }
            }

            // First time with this session, sync to backend
            await handleAuthSuccess(session)
            setIsLoading(false)
            return
          }
        }

        // Fallback: check localStorage for existing session (backward compatibility)
        const token = getToken()
        const storedUser = localStorage.getItem('auth_user')

        if (token && storedUser) {
          const parsedUser: AuthUser = JSON.parse(storedUser)
          setUser(parsedUser)
          setRoleState(parsedUser.role)
          setIsAuthenticated(true)
        } else {
          setUser(null)
          setRoleState('viewer')
          setIsAuthenticated(false)
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err)
        setUser(null)
        setRoleState('viewer')
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Subscribe to Supabase auth state changes
    if (isSupabaseConfigured()) {
      const { unsubscribe } = onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event)

        if (event === 'SIGNED_IN' && session) {
          // Check if already synced
          const existingToken = getToken()
          if (!existingToken) {
            await handleAuthSuccess(session)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setRoleState('viewer')
          setIsAuthenticated(false)
          setIsNewUser(false)
          clearAuth()
          localStorage.removeItem('auth_user')
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Update token on refresh
          setToken(session.access_token)
        }
      })

      return () => unsubscribe()
    }
  }, [handleAuthSuccess])

  /**
   * Login with email and password (Supabase)
   */
  const loginWithEmail = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase is not configured' }
    }

    try {
      const result = await supabaseSignIn(email, password)

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      if (result.session) {
        const authResult = await handleAuthSuccess(result.session)
        return authResult
      }

      return { success: false, error: 'No session returned' }
    } catch (err) {
      console.error('Login error:', err)
      return { success: false, error: 'Login failed' }
    }
  }, [handleAuthSuccess])

  /**
   * Sign up with email and password (Supabase)
   */
  const signUpWithEmailFn = useCallback(async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
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
        const authResult = await handleAuthSuccess(result.session)
        return authResult
      }

      // Email confirmation required
      return { success: true, error: 'Please check your email to confirm your account' }
    } catch (err) {
      console.error('Sign up error:', err)
      return { success: false, error: 'Sign up failed' }
    }
  }, [handleAuthSuccess])

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
  const logout = useCallback(async () => {
    try {
      const token = getToken()

      // Logout from backend first
      if (token) {
        await logoutFromBackend(token)
      }

      // Logout from Supabase
      if (isSupabaseConfigured()) {
        await supabaseSignOut()
      }

      // Clear local state
      clearAuth()
      localStorage.removeItem('auth_user')
      setUser(null)
      setRoleState('viewer')
      setIsAuthenticated(false)
      setIsNewUser(false)
    } catch (err) {
      console.error('Logout failed:', err)
      // Still clear local state even if API calls fail
      clearAuth()
      localStorage.removeItem('auth_user')
      setUser(null)
      setRoleState('viewer')
      setIsAuthenticated(false)
      setIsNewUser(false)
    }
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
  const login = useCallback((authUser: AuthUser, token: string) => {
    try {
      setToken(token)
      localStorage.setItem('auth_user', JSON.stringify(authUser))
      setUser(authUser)
      setRoleState(authUser.role)
      setIsAuthenticated(true)
    } catch (err) {
      console.error('Login failed:', err)
    }
  }, [])

  /**
   * Switch user role
   */
  const setRole = useCallback((newRole: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role: newRole }
      localStorage.setItem('auth_user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setRoleState(newRole)
    } else {
      setRoleState(newRole)
    }
  }, [user])

  /**
   * Update user profile
   */
  const updateUser = useCallback((fields: Partial<AuthUser>) => {
    if (user) {
      const updatedUser = { ...user, ...fields }
      localStorage.setItem('auth_user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setRoleState(updatedUser.role)
    }
  }, [user])

  /**
   * Complete onboarding - update instrument/genre preferences
   */
  const completeOnboarding = useCallback(async (instrument: string, genre: string, profileData?: { name?: string; phone?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const token = getToken()
    if (!token) {
      return { success: false, error: 'No auth token' }
    }

    try {
      // Prepare update object with instrument, genre, and optional name/phone
      const updatePayload: any = { instrument, genre }
      if (profileData?.name) updatePayload.name = profileData.name
      if (profileData?.phone) updatePayload.phone = profileData.phone

      const result = await updateMusicianProfile(user.id, token, updatePayload)

      if (result.success) {
        // Update local user state
        const updatedUser = { ...user, instrument, genre }
        if (profileData?.name) updatedUser.name = profileData.name
        if (profileData?.phone) updatedUser.phone = profileData.phone

        localStorage.setItem('auth_user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        setIsNewUser(false)
      }

      return result
    } catch (err) {
      console.error('Onboarding error:', err)
      return { success: false, error: 'Failed to update profile' }
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

    const token = getToken()
    if (!token) {
      return { success: false, error: 'No auth token' }
    }

    try {
      const result = await updateProfileService(token, updates)

      if (result.success && result.data) {
        // Update local user state
        const updatedUser = { ...user, ...result.data }
        localStorage.setItem('auth_user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        setRoleState(updatedUser.role)
      }

      return result
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

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    role,
    isNewUser,
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Export AuthContext for use in custom hooks
 */
export { AuthContext }
