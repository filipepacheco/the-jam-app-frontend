/**
 * Schedule Status Helper Utilities
 * Centralized status color, label, and icon mappings for schedule components
 */

import type { TFunction } from 'i18next'
import type {ScheduleStatus} from '../../types/api.types'

/** Pause is a playback state, not a persisted queue status. */
export function getDisplayScheduleStatus(schedule: {status: ScheduleStatus; pausedAt?: string | null}): ScheduleStatus | 'PAUSED' {
  return schedule.status === 'IN_PROGRESS' && schedule.pausedAt ? 'PAUSED' : schedule.status
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
    case 'PAUSED':
      return t('schedule.statuses.paused')
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
