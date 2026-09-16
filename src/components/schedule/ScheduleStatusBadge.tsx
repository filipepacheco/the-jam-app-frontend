/**
 * Schedule Status Badge Component
 * Displays schedule status with appropriate color and icon
 */

import {useTranslation} from 'react-i18next'
import {getStatusLabel} from '../../lib/schedule/statusHelpers'
import {Badge, type DataDisplayTone} from '../data-display'

interface ScheduleStatusBadgeProps {
  status: string | undefined
  isSuggested?: boolean
}

export function ScheduleStatusBadge({ status, isSuggested = false }: ScheduleStatusBadgeProps) {
  const { t } = useTranslation()

  const label = getStatusLabel(status, isSuggested, t)
  const tone: DataDisplayTone = isSuggested
    ? 'info'
    : status === 'IN_PROGRESS'
      ? 'warning'
      : status === 'APPROVED' || status === 'COMPLETED'
        ? 'success'
        : status === 'CANCELED'
          ? 'neutral'
          : 'info'

  return <Badge tone={tone}>{label}</Badge>
}
