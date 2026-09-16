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
 * @param t - Translation function
 * @returns Localized human-readable role name
 */
export function getRoleLabel(role: UserRole | undefined, t: TFunction): string {
  // Defensive: handle undefined role by defaulting to 'viewer'
  const normalizedRole: UserRole = role || 'viewer'
  return t(translationKey('roles', normalizedRole))
}
