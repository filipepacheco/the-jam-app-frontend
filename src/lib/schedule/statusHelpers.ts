/**
 * Schedule Status Helper Utilities
 * Centralized status color, label, and icon mappings for schedule components
 */

import type { TFunction } from 'i18next'

/**
 * Get the daisyUI badge class for a given schedule status
 * @param status - The schedule status (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELED, etc.)
 * @param isSuggested - Whether this is a suggested performance
 * @returns daisyUI badge class string
 */
export function getStatusColor(status: string | undefined, isSuggested: boolean): string {
  if (isSuggested) return 'badge-info'

  switch (status) {
    case 'SCHEDULED':
      return 'badge-secondary'
    case 'IN_PROGRESS':
      return 'badge-warning ring-2 ring-warning ring-offset-2 ring-offset-base-100'
    case 'APPROVED':
    case 'COMPLETED':
      return 'badge-success'
    case 'CANCELED':
      return 'badge-ghost text-base-content/50' // Softer gray instead of harsh red
    default:
      return 'badge-outline'
  }
}

/**
 * Get the internationalized label for a given schedule status
 * @param status - The schedule status
 * @param isSuggested - Whether this is a suggested performance
 * @param t - i18next translation function
 * @returns Translated status label
 */
export function getStatusLabel(status: string | undefined, isSuggested: boolean, t: TFunction): string {
  if (isSuggested) return t('common.statuses.suggested')

  switch (status) {
    case 'SCHEDULED':
      return t('schedule.statuses.scheduled')
    case 'IN_PROGRESS':
      return t('schedule.statuses.in_progress')
    case 'APPROVED':
      return t('common.statuses.approved')
    case 'COMPLETED':
      return t('schedule.statuses.completed')
    case 'CANCELED':
      return t('schedule.statuses.canceled')
    default:
      return t('schedule.statuses.scheduled')
  }
}

/**
 * Get the emoji icon for a given schedule status
 * @param status - The schedule status
 * @param isSuggested - Whether this is a suggested performance
 * @returns Emoji icon string
 */
export function getStatusIcon(status: string | undefined, isSuggested: boolean): string {
  if (isSuggested) return '✨'

  switch (status) {
    case 'SCHEDULED':
      return '📅'
    case 'IN_PROGRESS':
      return '🎵'
    case 'APPROVED':
    case 'COMPLETED':
      return '✓'
    case 'CANCELED':
      return '✕'
    default:
      return ''
  }
}
