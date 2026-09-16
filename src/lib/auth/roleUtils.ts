/**
 * Role Utilities
 * Helper functions for role-based access control and permissions
 */

import {type UserRole} from '../../types/auth.types'
import type {TFunction} from 'i18next'
import {translationKey} from '../i18n/translationKeys'

/**
 * Get role label for display
 * @param role - User role (or undefined)
 * @param t - Translation function (optional)
 * @returns Human-readable role name or translation key
 */
export function getRoleLabel(role: UserRole | undefined, t?: TFunction): string {
  // Defensive: handle undefined role by defaulting to 'viewer'
  const normalizedRole: UserRole = role || 'viewer'
  if (t) return t(translationKey('roles', normalizedRole))

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
