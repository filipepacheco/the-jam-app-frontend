/**
 * Backend Auth Service
 * Handles syncing Supabase user to backend and managing backend sessions
 */

import {getApiUrl} from '../lib/api/config'
import type {AuthUser, UpdateProfileDto} from '../types/auth.types'
import type {BackendAuthResponseDto} from '../types/api.types'
import type {Session, User} from '@supabase/supabase-js'


/**
 * Result from syncing Supabase user to backend
 */
export interface SyncResult {
  user: AuthUser
  token: string
  isNewUser: boolean
  error?: string
}

/**
 * Alias for SyncResult for backward compatibility
 */
export type BackendSyncResponse = SyncResult

/**
 * Sync Supabase user to backend
 * This creates/updates the musician record in the backend database
 *
 * @param supabaseSession - The Supabase session containing user and access token
 * @returns SyncResult with user data, token, and isNewUser flag
 */
export async function syncSupabaseUserToBackend(
  supabaseSession: Session
): Promise<SyncResult> {
  const { access_token, user } = supabaseSession

  if (!user || !access_token) {
    return {
      user: createGuestUser(),
      token: '',
      isNewUser: false,
      error: 'Invalid Supabase session',
    }
  }

  try {
    if (import.meta.env.DEV) {
      console.log('Syncing Supabase user to backend:', {
        userId: user.id,
        email: user.email,
        tokenLength: access_token.length,
      })
    }

    const response = await fetch(getApiUrl('/auth/sync-user'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: access_token,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || errorData.error || `Backend sync failed: ${response.status}`

      if (import.meta.env.DEV) {
        console.error('Backend sync error:', {
          status: response.status,
          message: errorMessage,
          fullResponse: errorData,
        })
      }

      // If sync fails due to 401 (token invalid), still allow user to continue
      // but mark them as guest and return the error
      return {
        user: createUserFromSupabase(user),
        token: access_token,
        isNewUser: false,
        error: errorMessage,
      }
    }

    const data: BackendAuthResponseDto = await response.json()

    // Convert backend response to AuthUser format
    const authUser: AuthUser = {
      id: data.userId,
      name: data.name || null,
      email: data.email || user.email || '',
      phone: data.phone,
      role: data.isHost ? 'host' : 'user',
      isHost: data.isHost,
      instrument: data.instrument,
    }

    return {
      user: authUser,
      token: data.token || access_token,
      isNewUser: data.isNewUser,
    }
  } catch (err) {
    console.error('Backend sync error:', err)
    return {
      user: createUserFromSupabase(user),
      token: access_token,
      isNewUser: false,
      error: err instanceof Error ? err.message : 'Failed to sync with backend',
    }
  }
}

/**
 * Update user profile via backend
 * Calls PATCH /auth/profile to update user details after initial signup/login
 *
 * @param token - Bearer token for authentication
 * @param updates - Profile fields to update (name, instrument, level, contact)
 * @returns Updated user data or error
 */
export async function updateProfile(
  token: string,
  updates: UpdateProfileDto
): Promise<{ success: boolean; data?: AuthUser; error?: string }> {
  try {
    const response = await fetch(getApiUrl('/auth/profile'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || errorData.error || 'Failed to update profile'

      if (import.meta.env.DEV) {
        console.error('Profile update error:', {
          status: response.status,
          message: errorMessage,
          fullResponse: errorData,
        })
      }

      return {
        success: false,
        error: errorMessage,
      }
    }

    const data: BackendAuthResponseDto = await response.json()

    // Convert response to AuthUser format
    const updatedUser: AuthUser = {
      id: data.userId,
      name: data.name || null,
      email: data.email || '',
      phone: data.phone,
      role: data.isHost ? 'host' : 'user',
      isHost: data.isHost,
      instrument: data.instrument,
    }

    return {
      success: true,
      data: updatedUser,
    }
  } catch (err) {
    console.error('Profile update error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update profile',
    }
  }
}

/**
 * Fetch current user profile from backend
 * Calls GET /auth/me to retrieve current authenticated user
 *
 * @param token - Bearer token for authentication
 * @returns Current user data or error
 */
export async function getAuthMe(
  token: string
): Promise<{ user?: AuthUser; error?: string }> {
  try {
    const response = await fetch(getApiUrl('/auth/me'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || errorData.error || 'Failed to fetch profile'

      if (import.meta.env.DEV) {
        console.error('Get profile error:', {
          status: response.status,
          message: errorMessage,
        })
      }

      return {
        error: errorMessage,
      }
    }

    const data: BackendAuthResponseDto = await response.json()

    // Convert response to AuthUser format
    const user: AuthUser = {
      id: data.userId,
      name: data.name || null,
      email: data.email || '',
      phone: data.phone,
      role: data.isHost ? 'host' : 'user',
      isHost: data.isHost,
      instrument: data.instrument,
    }

    return {
      user,
    }
  } catch (err) {
    console.error('Get profile error:', err)
    return {
      error: err instanceof Error ? err.message : 'Failed to fetch profile',
    }
  }
}

/**
 * Update musician profile in backend (legacy)
 * @deprecated Use updateProfile() instead
 */
export async function updateMusicianProfile(
  userId: string,
  token: string,
  updates: { instrument?: string; genre?: string; name?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(getApiUrl(`/musicos/${userId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || 'Failed to update profile',
      }
    }

    return { success: true }
  } catch (err) {
    console.error('Profile update error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update profile',
    }
  }
}

/**
 * Create AuthUser from Supabase user (fallback when backend sync fails)
 */
function createUserFromSupabase(user: User): AuthUser {
  return {
    id: user.id,
    name: user.user_metadata?.name || null,
    email: user.email || '',
    phone: user.phone || undefined,
    role: 'user',
    isHost: false,
  }
}

/**
 * Create a guest user placeholder
 */
function createGuestUser(): AuthUser {
  return {
    id: '',
    name: null,
    email: '',
    role: 'viewer',
    isHost: false,
  }
}

/**
 * Logout from backend
 * Clears any backend session/token
 */
export async function logoutFromBackend(token: string): Promise<void> {
  try {
    await fetch(getApiUrl('/auth/logout'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch (err) {
    console.error('Backend logout error:', err)
    // Continue with logout even if backend call fails
  }
}

