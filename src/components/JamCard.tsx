/**
 * Jam Card Component
 * Displays individual jam session information in a card format
 */

import {memo} from 'react'
import {Link} from 'react-router-dom'
import type {JamResponseDto} from '../types/api.types'
import {useTranslation} from 'react-i18next'
import {safeT} from '../lib/i18nUtils'
import {getJamStatusBadgeClass, getJamStatusLabel} from '../lib/statusUtils'
import {getJamPath, getJamDashboardPath} from '../utils/jamUrl'
import {Calendar, Music, ExternalLink, Radio} from 'lucide-react'

interface JamCardProps {
  jam: JamResponseDto
}

/**
 * Format ISO date string to readable format using current locale
 */
function formatDate(isoString: string, locale?: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString(locale || navigator.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * JamCard Component
 */
export const JamCard = memo(function JamCard({ jam }: JamCardProps) {
  const { t, i18n } = useTranslation()
  const songCount = jam._count?.schedules ?? jam.schedules?.length ?? 0


  return (
    <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
      <div className="card-body p-3 sm:p-6">
        {/* Header: Name + Status Badge */}
        <div className="flex justify-between items-center gap-2">
          <h3 className="card-title text-base sm:text-lg min-w-0">{jam.name || t('jams.no_name')}</h3>
          <div className={`badge badge-sm sm:badge-md lg:badge-lg flex-shrink-0 font-semibold ${getJamStatusBadgeClass(jam.status)}`}>
            {getJamStatusLabel(jam.status, t)}
          </div>
        </div>

        {/* Date */}
        {jam.date && (
          <p className="flex items-center gap-1.5 text-sm sm:text-base text-base-content/70">
            <Calendar className="size-4 shrink-0" aria-hidden="true" />
            {formatDate(jam.date, i18n.language)}
          </p>
        )}

        {/* Description */}
        {jam.description && (
          <p className="text-sm sm:text-base text-base-content/80 mt-2 line-clamp-3">
            {jam.description}
          </p>
        )}

        {/* Song Count */}
        <div className="flex items-center gap-1.5 mt-2 text-sm sm:text-base text-base-content/60">
          <Music className="size-4 shrink-0" aria-hidden="true" />
          {safeT(t, 'jams.songs_count', { count: songCount })}
        </div>

        {/* Spotify Link */}
        {jam.spotifyPlaylistUrl && (
          <a
            href={jam.spotifyPlaylistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-success hover:underline mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
            {t('jams.listen_on_spotify')}
          </a>
        )}

        {/* Action Buttons */}
        <div className="card-actions justify-end gap-2 mt-4 sm:mt-6">
            <Link to={getJamDashboardPath(jam)} className="btn btn-outline btn-sm text-xs sm:text-sm gap-1.5" title="View live dashboard">
              <Radio className="size-3.5" aria-hidden="true" />
              {t('jams.live_dashboard', 'Dashboard ao vivo')}
            </Link>
          <Link to={getJamPath(jam)} className="btn btn-primary btn-sm text-xs sm:text-sm">
            {t('common.details')}
          </Link>
        </div>
      </div>
    </div>
  )
})


