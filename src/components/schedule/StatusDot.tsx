import { useTranslation } from 'react-i18next'

interface StatusDotProps {
  status: string
}

const COLOR_MAP: Record<string, string> = {
  SCHEDULED: 'bg-primary',
  IN_PROGRESS: 'bg-warning motion-safe:animate-pulse',
  COMPLETED: 'bg-success',
  CANCELED: 'bg-base-content/20',
  SUGGESTED: 'bg-info',
}

export function StatusDot({ status }: StatusDotProps) {
  const { t } = useTranslation()
  const label = t(`schedule.statuses.${status.toLowerCase()}`, status)
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full shrink-0 ${COLOR_MAP[status] || 'bg-base-content/30'}`}
      title={label}
      role="img"
      aria-label={label}
    />
  )
}
