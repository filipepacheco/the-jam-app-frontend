/**
 * Schedule Status Badge Component
 * Displays schedule status with appropriate color and icon
 */

import {useTranslation} from 'react-i18next'

interface ScheduleStatusBadgeProps {
  status: string | undefined
}

export function ScheduleStatusBadge({ status }: ScheduleStatusBadgeProps) {
  const { t } = useTranslation()
  const getStatusColor = () => {
    switch (status) {
      case 'SUGGESTED':
        return 'badge-info'
      case 'SCHEDULED':
        return 'badge-secondary'
      case 'IN_PROGRESS':
        return 'badge-warning'
      case 'COMPLETED':
        return 'badge-success'
      case 'CANCELED':
        return 'badge-error'
      default:
        return 'badge-outline'
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'SUGGESTED':
        return t('schedule.statuses.suggested')
      case 'SCHEDULED':
        return t('schedule.statuses.scheduled')
      case 'IN_PROGRESS':
        return t('schedule.statuses.in_progress')
      case 'COMPLETED':
        return t('schedule.statuses.completed')
      case 'CANCELED':
        return t('schedule.statuses.canceled')
      default:
        return t('schedule.statuses.scheduled')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'SUGGESTED':
        return '✨'
      case 'SCHEDULED':
        return '📅'
      case 'IN_PROGRESS':
        return '🎵'
      case 'COMPLETED':
        return '✓'
      case 'CANCELED':
        return '✕'
      default:
        return ''
    }
  }

  return (
      <>
          <div className={`badge ${getStatusColor()}`}>
              {getStatusIcon() && `${getStatusIcon()} `}
              {getStatusLabel()}
          </div>
      </>

  )
}

