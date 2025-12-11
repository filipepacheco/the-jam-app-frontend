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
 * Authenticated user object
 */
export interface AuthUser {
  id: string
  name: string | null
  email: string
  phone?: string
  role: UserRole
  isHost: boolean

  // Supabase-specific fields
  supabaseUserId?: string

  // Musician-specific fields (if role = 'user')
  instrument?: string
  genre?: string
  level?: string
  contact?: string

  // Host-specific fields (if role = 'host')
  hostName?: string
  hostContact?: string
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

  // Supabase Auth Methods
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>
  loginWithOAuth: (provider: OAuthProvider) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>

  // Legacy login method (for backward compatibility)
  login: (user: AuthUser, token: string) => void

  // Profile management
  setRole: (role: UserRole) => void
  updateUser: (fields: Partial<AuthUser>) => void
  updateProfile: (updates: UpdateProfileDto) => Promise<{ success: boolean; error?: string }>
  completeOnboarding: (instrument: string, genre: string, profileData?: { name?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>
  clearNewUserFlag: () => void

  // Helper methods
  isUser: () => boolean
  isViewer: () => boolean
}

/**
 * Role hierarchy for permission checking
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 0,
  user: 1,
  host: 2,
}

/**
 * Permission map for role-based access control
 */
export interface RolePermissions {
  canViewJams: boolean
  canViewMusicians: boolean
  canViewMusic: boolean
  canViewDashboard: boolean
  canCreateProfile: boolean
  canRegisterForJams: boolean
  canViewOwnRegistrations: boolean
  canViewOwnPerformances: boolean
  canEditOwnProfile: boolean
  canCreateJams: boolean
  canEditOwnJams: boolean
  canDeleteOwnJams: boolean
  canManageRegistrations: boolean
  canSetSchedules: boolean
  canViewAnalytics: boolean
}

/**
 * Default permissions for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  viewer: {
    canViewJams: true,
    canViewMusicians: true,
    canViewMusic: true,
    canViewDashboard: true,
    canCreateProfile: false,
    canRegisterForJams: false,
    canViewOwnRegistrations: false,
    canViewOwnPerformances: false,
    canEditOwnProfile: false,
    canCreateJams: false,
    canEditOwnJams: false,
    canDeleteOwnJams: false,
    canManageRegistrations: false,
    canSetSchedules: false,
    canViewAnalytics: false,
  },
  user: {
    canViewJams: true,
    canViewMusicians: true,
    canViewMusic: true,
    canViewDashboard: true,
    canCreateProfile: true,
    canRegisterForJams: true,
    canViewOwnRegistrations: true,
    canViewOwnPerformances: true,
    canEditOwnProfile: true,
    canCreateJams: false,
    canEditOwnJams: false,
    canDeleteOwnJams: false,
    canManageRegistrations: false,
    canSetSchedules: false,
    canViewAnalytics: false,
  },
  host: {
    canViewJams: true,
    canViewMusicians: true,
    canViewMusic: true,
    canViewDashboard: true,
    canCreateProfile: true,
    canRegisterForJams: true,
    canViewOwnRegistrations: true,
    canViewOwnPerformances: true,
    canEditOwnProfile: true,
    canCreateJams: true,
    canEditOwnJams: true,
    canDeleteOwnJams: true,
    canManageRegistrations: true,
    canSetSchedules: true,
    canViewAnalytics: true,
  },
}

/**
 * Profile update data
 * Used when updating user profile after initial signup/login
 */
export interface UpdateProfileDto {
  name?: string
  instrument?: string
  level?: string
  contact?: string
}
