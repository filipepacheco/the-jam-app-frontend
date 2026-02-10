import type { TFunction } from 'i18next'
import type { JamStatus } from '../types/api.types'

export function getJamStatusBadgeClass(status: JamStatus): string {
  switch (status) {
    case 'LIVE':
      return 'badge-success'
    case 'ACTIVE':
      return 'badge-info'
    case 'INACTIVE':
      return 'badge-warning'
    case 'FINISHED':
      return 'badge-ghost'
    default:
      return 'badge-ghost'
  }
}

export function getJamStatusLabel(status: JamStatus, t: TFunction): string {
  switch (status) {
    case 'LIVE':
      return t('jams.statuses.live')
    case 'ACTIVE':
      return t('jams.statuses.active')
    case 'INACTIVE':
      return t('jams.statuses.inactive')
    case 'FINISHED':
      return t('jams.statuses.finished')
    default:
      return t('common.unknown')
  }
}

// Re-export schedule status helpers for convenience
export { getStatusColor as getScheduleStatusBadgeClass, getStatusLabel as getScheduleStatusLabel, getStatusIcon as getScheduleStatusIcon } from './schedule/statusHelpers'
