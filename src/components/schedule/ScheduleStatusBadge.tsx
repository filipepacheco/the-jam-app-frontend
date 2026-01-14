/**
 * Schedule Status Badge Component
 * Displays schedule status with appropriate color and icon
 */

import {useTranslation} from 'react-i18next'
import {getStatusColor, getStatusLabel, getStatusIcon} from '../../lib/schedule/statusHelpers'

interface ScheduleStatusBadgeProps {
  status: string | undefined
  isSuggested?: boolean
}

export function ScheduleStatusBadge({ status, isSuggested = false }: ScheduleStatusBadgeProps) {
  const { t } = useTranslation()

  const colorClass = getStatusColor(status, isSuggested)
  const label = getStatusLabel(status, isSuggested, t)
  const icon = getStatusIcon(status, isSuggested)

  return (
    <div className={`badge ${colorClass}`}>
      {icon && `${icon} `}
      {label}
    </div>
  )
}

