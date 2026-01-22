/**
 * Role Utilities
 * Helper functions for role-based access control and permissions
 */

import {type UserRole} from '../../types/auth.types'

/**
 * Get role label for display
 * @param role - User role (or undefined)
 * @param t - Translation function (optional)
 * @returns Human-readable role name or translation key
 */
export function getRoleLabel(role: UserRole | undefined, t?: (key: string) => string): string {
  // Defensive: handle undefined role by defaulting to 'viewer'
  const normalizedRole: UserRole = role || 'viewer'
  const key = `roles.${normalizedRole}`
  
  if (t) return t(key)

  switch (normalizedRole) {
    case 'host':
      return 'Host/Organizer'
    case 'user':
      return 'Musician'
    case 'viewer':
    default:
      return 'Viewer'
  }
}

