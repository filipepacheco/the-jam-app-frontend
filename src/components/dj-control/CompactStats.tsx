import { useTranslation } from 'react-i18next'

// Considered converging onto the canonical `CompactMetadata` list, but its
// dt/dd contract expects a discrete label and value per item, while these two
// values are single pre-composed, interpolated sentences ("{{completed}}/{{total}}
// tocadas", "{{time}} restante"). Splitting them would mean inventing new i18n
// keys and copy, which is out of scope for a structural migration. See
// docs/design-system/dj-control-migration.md for the recorded decision.
interface CompactStatsProps {
  completedCount: number
  totalCount: number
  remainingDuration: number
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function CompactStats({ completedCount, totalCount, remainingDuration }: CompactStatsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex justify-between items-center px-3 py-1.5 text-xs text-base-content/60">
      <span>
        {t('dj_control.stats.played_count', '{{completed}}/{{total}} tocadas', {
          completed: completedCount,
          total: totalCount,
        })}
      </span>
      <span>
        {t('dj_control.stats.remaining_time', '{{time}} restante', {
          time: formatDuration(remainingDuration),
        })}
      </span>
    </div>
  )
}
