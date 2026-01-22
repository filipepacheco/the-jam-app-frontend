/**
 * StatusBadge Component
 * Reusable badge for displaying schedule status with consistent styling
 */

import { useTranslation } from 'react-i18next'
import { getStatusColor, getStatusLabel, getStatusIcon } from '../../lib/schedule/statusHelpers'

interface StatusBadgeProps {
  status?: string
  isSuggested?: boolean
  className?: string
}

export function StatusBadge({ status, isSuggested = false, className = '' }: StatusBadgeProps) {
  const { t } = useTranslation()

  const badgeColor = getStatusColor(status, isSuggested)
  const label = getStatusLabel(status, isSuggested, t)
  const icon = getStatusIcon(status, isSuggested)

  return (
    <span className={`badge ${badgeColor} ${className}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
    </span>
  )
}
