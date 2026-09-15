/**
 * Jam Card Component
 * Displays individual jam session information in a card format
 */

import {memo} from 'react'
import {Link} from 'react-router-dom'
import type {JamResponseDto} from '../types/api.types'
import {useTranslation} from 'react-i18next'
import {safeT} from '../lib/i18nUtils'
import {getJamStatusLabel, getJamStatusTone} from '../lib/statusUtils'
import {getJamPath, getJamDashboardPath} from '../utils/jamUrl'
import {CalendarClock, Music, ExternalLink, Radio} from 'lucide-react'
import {Badge} from './data-display'

interface JamCardProps {
  jam: JamResponseDto
}

/**
 * Format ISO date string to readable format using current locale
 */
function formatDateTime(isoString: string, locale?: string): string | null {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(locale || navigator.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

/**
 * JamCard Component
 */
export const JamCard = memo(function JamCard({ jam }: JamCardProps) {
  const { t, i18n } = useTranslation()
  const songCount = jam._count?.schedules ?? jam.schedules?.length ?? 0
  const formattedDate = jam.date ? formatDateTime(jam.date, i18n.language) : null


  return (
    <article className="card relative bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
      <div className="card-body p-3 sm:p-6">
        {/* Header: Name + Status Badge */}
        <div className="flex justify-between items-center gap-2">
          <h3 className="card-title ds-type-ui ds-wrap-user-content min-w-0">
            <Link
              to={getJamPath(jam)}
              className="ds-focusable after:absolute after:inset-0 after:rounded-box"
            >
              {jam.name || t('jams.no_name')}
            </Link>
          </h3>
          <Badge tone={getJamStatusTone(jam.status)} className="flex-shrink-0 font-semibold">
            {getJamStatusLabel(jam.status, t)}
          </Badge>
        </div>

        {/* Date */}
        <p className="flex items-center gap-1.5 text-sm sm:text-base text-base-content/70 tabular-nums">
          <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
          {formattedDate ?? t('jams.date_tba')}
        </p>

        {/* Description */}
        {jam.description && (
          <p className="ds-wrap-user-content text-sm sm:text-base text-base-content/80 mt-2">
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
            className="ds-control ds-focusable relative z-10 flex items-center gap-1.5 text-sm text-success hover:underline mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
            {t('jams.listen_on_spotify')}
          </a>
        )}

        {/* The Jam-name link stretches across the card. This secondary link
            remains above that surface so the Public Dashboard stays a distinct
            destination with normal link behaviour. */}
        <div className="card-actions relative z-10 justify-end gap-2 mt-4 sm:mt-6">
            <Link to={getJamDashboardPath(jam)} className="btn btn-outline ds-control ds-focusable ds-type-ui gap-1.5" title="View live dashboard">
              <Radio className="size-3.5" aria-hidden="true" />
              {t('jams.live_dashboard', 'Dashboard ao vivo')}
            </Link>
        </div>
      </div>
    </article>
  )
})
