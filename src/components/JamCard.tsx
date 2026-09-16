/**
 * Jam Card Component
 * Displays individual jam session information in a card format
 */

import {memo, type MouseEvent} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import type {JamResponseDto} from '../types/api.types'
import {useTranslation} from 'react-i18next'
import {safeT} from '../lib/i18nUtils'
import {getJamStatusLabel, getJamStatusTone} from '../lib/statusUtils'
import {getJamPath, getJamDashboardPath} from '../utils/jamUrl'
import {ArrowRight, CalendarClock, ExternalLink, MapPin, Music, Radio, Users} from 'lucide-react'
import {Badge} from './data-display'
import {NavigationLink} from './Navigation'

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
  const navigate = useNavigate()
  const songCount = jam._count?.schedules ?? jam.schedules?.length ?? 0
  const musicianCount = jam._count?.registrations ?? 0
  const formattedDate = jam.date ? formatDateTime(jam.date, i18n.language) : null
  const jamPath = getJamPath(jam)
  const dashboardPath = getJamDashboardPath(jam)

  const openDestination = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation()
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    void navigate(path)
  }

  return (
    <article className="card relative w-full max-w-3xl border border-base-content/10 bg-base-200">
      <div className="card-body p-3 sm:p-6">
        {/* Header: Name + Status Badge */}
        <div className="flex justify-between items-center gap-2">
          <h3 className="card-title ds-type-ui ds-wrap-user-content min-w-0">
            <Link
              to={jamPath}
              className="ds-focusable after:absolute after:inset-0 after:rounded-box"
            >
              {jam.name || t('jams.no_name')}
            </Link>
          </h3>
          <Badge tone={getJamStatusTone(jam.status)} className="flex-shrink-0 font-semibold">
            {getJamStatusLabel(jam.status, t)}
          </Badge>
        </div>

        {/* Discovery facts stay together so time, place, and participation can
            be scanned before opening either destination. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/70 sm:text-base">
          <span className="inline-flex min-w-0 items-center gap-1.5 tabular-nums">
            <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
            {formattedDate ?? t('jams.date_tba')}
          </span>
          {jam.location && (
            <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate" title={jam.location}>{jam.location}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Music className="size-4 shrink-0" aria-hidden="true" />
            {safeT(t, 'jams.songs_count', { count: songCount })}
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Users className="size-4 shrink-0" aria-hidden="true" />
            {t('jams.musicians_count', {count: musicianCount})}
          </span>
        </div>

        {/* Description */}
        {jam.description && (
          <p className="ds-wrap-user-content text-sm sm:text-base text-base-content/80 mt-2">
            {jam.description}
          </p>
        )}

        {/* Spotify Link */}
        {jam.spotifyPlaylistUrl && (
          <a
            href={jam.spotifyPlaylistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ds-focusable relative z-10 inline-flex self-start items-center gap-1.5 text-sm text-success underline-offset-4 before:absolute before:-inset-x-1 before:-inset-y-2 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
            {t('jams.listen_on_spotify')}
          </a>
        )}

        {/* The details destination leads. The live dashboard is a distinct,
            supporting destination instead of the card's only visible CTA. */}
        <div className="relative z-10 mt-3 flex flex-col gap-2 border-t border-base-content/10 pt-3 sm:mt-4 sm:flex-row-reverse sm:justify-between sm:pt-4">
          <NavigationLink
            href={jamPath}
            variant="primary"
            icon={<ArrowRight className="size-4" />}
            onClick={openDestination(jamPath)}
            className="w-full sm:w-auto"
          >
            {t('jams.view_details')}
          </NavigationLink>
          <NavigationLink
            href={dashboardPath}
            icon={<Radio className="size-4" />}
            onClick={openDestination(dashboardPath)}
            className="w-full sm:w-auto"
          >
            {t('jams.live_dashboard')}
          </NavigationLink>
        </div>
      </div>
    </article>
  )
})
