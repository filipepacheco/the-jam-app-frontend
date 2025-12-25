/**
 * Jam Card Component
 * Displays individual jam session information in a card format
 */

import {Link} from 'react-router-dom'
import type {JamResponseDto, JamStatus} from '../types/api.types'
import {useTranslation} from 'react-i18next'
import {safeT} from '../lib/i18nUtils'

interface JamCardProps {
  jam: JamResponseDto
}

/**
 * Format ISO date string to readable format
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Truncate text to specified length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Get badge class based on jam status with friendly styling
 */
function getStatusBadgeClass(status: JamStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'badge-success badge-lg font-semibold'
    case 'INACTIVE':
      return 'badge-warning badge-lg font-semibold'
    case 'FINISHED':
      return 'badge-info badge-lg font-semibold'
    default:
      return 'badge-ghost badge-lg font-semibold'
  }
}

/**
 * Get friendly status label with emoji
 */
function getStatusLabel(status: JamStatus, t: (key: string) => string): string {
  switch (status) {
    case 'ACTIVE':
      return t('jams.statuses.active')
    case 'INACTIVE':
      return t('jams.statuses.inactive')
    case 'FINISHED':
      return t('jams.statuses.finished')
    default:
      return `❓ ${t('common.unknown')}`
  }
}

/**
 * JamCard Component
 */
export function JamCard({ jam }: JamCardProps) {
  const { t } = useTranslation()
  // Use schedules count as it represents actual performances
  // Fall back to jamMusics count if schedules not available
  const songCount = jam.schedules?.length || jam.jamMusics?.length || 0


  return (
    <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
      <div className="card-body p-3 sm:p-6">
        {/* Header: Name + Status Badge */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="card-title text-base sm:text-lg">{jam.name || t('jams.no_name')}</h3>
          <div className={`badge badge-md sm:badge-lg ${getStatusBadgeClass(jam.status)}`}>
            {getStatusLabel(jam.status, t)}
          </div>
        </div>

        {/* Date */}
        {jam.date && (
          <p className="text-xs sm:text-sm text-base-content/70">
            📅 {formatDate(jam.date)}
          </p>
        )}

        {/* Description */}
        {jam.description && (
          <p className="text-xs sm:text-sm text-base-content/80 mt-2">
            {truncate(jam.description, 100)}
          </p>
        )}

        {/* Song Count */}
        <div className="flex items-center gap-2 mt-2">
          <div className="text-xs sm:text-sm text-base-content/60">
            🎵 {safeT(t, 'jams.songs_count', { count: songCount })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card-actions justify-end mt-3 sm:mt-4">
          <Link to={`/jams/${jam.id}`} className="btn btn-primary btn-xs sm:btn-sm text-xs sm:text-sm">
            {t('common.details')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default JamCard
