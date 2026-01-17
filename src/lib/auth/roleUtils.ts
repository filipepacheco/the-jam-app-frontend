/**
 * Role Utilities
 * Helper functions for role-based access control and permissions
 */

import {type UserRole} from '../../types/auth.types'

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

