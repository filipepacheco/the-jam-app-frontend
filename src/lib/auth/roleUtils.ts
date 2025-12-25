/**
 * Role Utilities
 * Helper functions for role-based access control and permissions
 */

import {
    type AuthUser,
    ROLE_HIERARCHY,
    ROLE_PERMISSIONS,
    type RolePermissions,
    type UserRole
} from '../../types/auth.types'

/**
 * Check if a user can perform a specific action based on their role
 * @param role - User role to check
 * @param permission - Permission key to verify
 * @returns true if user has permission, false otherwise
 */
export function hasPermission(
  role: UserRole,
  permission: keyof RolePermissions
): boolean {
  return ROLE_PERMISSIONS[role][permission]
}

/**
 * Check if user has a required role or higher
 * Uses role hierarchy: viewer (0) < user (1) < host (2)
 * @param userRole - User's current role
 * @param requiredRole - Minimum role required
 * @returns true if user role is equal or higher than required
 */
export function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if user can access a resource
 * @param userRole - User's role
 * @param requiredRole - Minimum role needed
 * @returns true if user can access
 */
export function canAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  return hasRequiredRole(userRole, requiredRole)
}

/**
 * Get the default redirect path based on user role
 * Used to redirect users after login to appropriate dashboard
 * @param role - User role
 * @returns Path to redirect to
 */
export function getDefaultRedirectByRole(role: UserRole): string {
  switch (role) {
    case 'host':
      return '/host/dashboard'
    case 'user':
      return '/my-registrations'
    case 'viewer':
    default:
      return '/jams'
  }
}

/**
 * Get role label for display
 * @param role - User role
 * @param t - Translation function (optional)
 * @returns Human-readable role name or translation key
 */
export function getRoleLabel(role: UserRole, t?: (key: string) => string): string {
  const key = `roles.${role}`
  if (t) return t(key)

  switch (role) {
    case 'host':
      return 'Host/Organizer'
    case 'user':
      return 'Musician'
    case 'viewer':
    default:
      return 'Viewer'
  }
}

/**
 * Check if user is resource owner
 * Useful for edit/delete permissions
 * @param resourceOwnerId - ID of resource owner
 * @param userId - ID of current user
 * @returns true if user is owner
 */
export function isResourceOwner(resourceOwnerId: string, userId: string): boolean {
  return resourceOwnerId === userId
}

/**
 * Check if user can edit a jam
 * Only host who created the jam can edit it
 * @param user - Current user
 * @param jamOwnerId - ID of jam creator
 * @returns true if user can edit
 */
export function canEditJam(user: AuthUser | null, jamOwnerId: string): boolean {
  if (!user) return false
  return user.role === 'host' && isResourceOwner(jamOwnerId, user.id)
}

/**
 * Check if user can delete a jam
 * Only host who created the jam can delete it
 * @param user - Current user
 * @param jamOwnerId - ID of jam creator
 * @returns true if user can delete
 */
export function canDeleteJam(user: AuthUser | null, jamOwnerId: string): boolean {
  if (!user) return false
  return user.role === 'host' && isResourceOwner(jamOwnerId, user.id)
}

/**
 * Check if user can manage registrations for a jam
 * Only host who created the jam can manage registrations
 * @param user - Current user
 * @param jamOwnerId - ID of jam creator
 * @returns true if user can manage
 */
export function canManageRegistrations(user: AuthUser | null, jamOwnerId: string): boolean {
  if (!user) return false
  return user.role === 'host' && isResourceOwner(jamOwnerId, user.id)
}

/**
 * Check if user can view own registrations
 * Only authenticated users (user or host) can view their registrations
 * @param user - Current user
 * @returns true if can view
 */
export function canViewOwnRegistrations(user: AuthUser | null): boolean {
  if (!user) return false
  return user.role === 'user' || user.role === 'host'
}

/**
 * Check if user can register for a jam
 * Only musicians (user role) can register for jams
 * @param user - Current user
 * @returns true if can register
 */
export function canRegisterForJam(user: AuthUser | null): boolean {
  if (!user) return false
  return user.role === 'user'
}

/**
 * Check if user can create a jam
 * Only hosts can create jams
 * @param user - Current user
 * @returns true if can create
 */
export function canCreateJam(user: AuthUser | null): boolean {
  if (!user) return false
  return user.role === 'host'
}

/**
 * Check if user can view jam details
 * All users can view jam details
 * @returns true if can view (always true)
 */
export function canViewJamDetails(): boolean {
  return true // Everyone can view
}

/**
 * Check if user can view musicians
 * All users can view musicians
 * @returns true if can view (always true)
 */
export function canViewMusicians(): boolean {
  return true // Everyone can view
}

/**
 * Check if user can view music
 * All users can view music
 * @returns true if can view (always true)
 */
export function canViewMusic(): boolean {
  return true // Everyone can view
}

/**
 * Check if user can view dashboard
 * All users can view dashboard
 * @returns true if can view (always true)
 */
export function canViewDashboard(): boolean {
  return true // Everyone can view
}

