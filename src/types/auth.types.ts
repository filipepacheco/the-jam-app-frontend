/**
 * Authentication Type Definitions
 * Type definitions for role-based authentication system with Supabase integration
 */

import type {OAuthProvider} from '../lib/supabase'

/**
 * User roles in the application
 */
export type UserRole = 'viewer' | 'user' | 'host'

/**
 * Musician skill levels
 */
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL'

/**
 * Authenticated user object
 */
export interface AuthUser {
  id: string
  name: string | null
  email: string
  phone?: string
  role: UserRole
  isHost: boolean
  isNewUser?: boolean
  registrationComplete?: boolean

  // Supabase-specific fields
  supabaseUserId?: string

  // Musician-specific fields (if role = 'user')
  instrument?: string
  level?: SkillLevel
  contact?: string

  // Timestamps
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Authentication context type with Supabase methods
 */
export interface AuthContextType {
  // State
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  role: UserRole
  isNewUser: boolean
  isLoggingOut: boolean

  // Supabase Auth Methods
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; isNewUser?: boolean }>
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string; message?: string; isNewUser?: boolean }>
  loginWithOAuth: (provider: OAuthProvider) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>

  // Legacy login method (for backward compatibility)
  login: (user: AuthUser, token?: string) => void

  // Profile management
  setRole: (role: UserRole) => void
  updateUser: (fields: Partial<AuthUser>) => void
  updateProfile: (updates: UpdateProfileDto) => Promise<{ success: boolean; error?: string }>
  completeOnboarding: (instrument: string, level: SkillLevel, profileData?: { name?: string; phone?: string; contact?: string }) => Promise<{ success: boolean; error?: string }>
  clearNewUserFlag: () => void

  // Helper methods
  isUser: () => boolean
  isViewer: () => boolean
}


/**
 * Profile update data
 * Used when updating user profile after initial signup/login
 */
export interface UpdateProfileDto {
  name?: string
  instrument?: string
  level?: SkillLevel
  contact?: string
  phone?: string
  isHost?: boolean
}
