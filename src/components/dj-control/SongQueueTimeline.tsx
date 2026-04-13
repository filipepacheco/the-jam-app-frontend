/**
 * Song Queue Timeline Component
 * Compact vertical list for DJ control - optimized for scanning and quick action
 * Uses new LiveStateResponseDto structure with pre-organized songs
 */

import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import type {LiveStateResponseDto, LiveStateSongDto} from '../../types/jamControl.types'

interface SongQueueTimelineProps {
  liveState?: LiveStateResponseDto
  suggestedSongs?: LiveStateSongDto[]
  onRemoveSong?: (scheduleId: string) => void
  onApproveSong?: (scheduleId: string) => void
  loading?: boolean
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '--:--'
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function SongRow({
  song,
  position,
  status,
  onRemove,
  onApprove,
  loading,
}: {
  song: LiveStateSongDto
  position?: number
  status: 'previous' | 'current' | 'upcoming' | 'suggested'
  onRemove?: (id: string) => void
  onApprove?: (id: string) => void
  loading?: boolean
}) {
  const {t} = useTranslation()

  const musicians = song.musicians
    ?.map((m) => m.name || m.instrument)
    .filter(Boolean)

  const statusStyles = {
    previous: 'opacity-50',
    current: 'bg-primary/10 border border-primary/40 ring-1 ring-primary/20',
    upcoming: '',
    suggested: 'bg-warning/5 border border-warning/20',
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${statusStyles[status]}`}>
      {/* Position or status indicator */}
      <div className="shrink-0 w-7 text-center">
        {status === 'current' ? (
          <span className="text-primary font-bold text-sm">&#9654;</span>
        ) : status === 'previous' ? (
          <span className="text-success text-sm">&#10003;</span>
        ) : status === 'suggested' ? (
          <span className="text-warning text-sm">&#10033;</span>
        ) : (
          <span className="text-base-content/40 text-xs font-mono tabular-nums">{position}</span>
        )}
      </div>

      {/* Song info - takes available space */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm truncate">{song.music.title}</span>
          <span className="text-xs text-base-content/50 shrink-0">{formatDuration(song.music.duration || undefined)}</span>
        </div>
        <div className="text-xs text-base-content/60 truncate">
          {song.music.artist}
          {musicians && musicians.length > 0 && (
            <span className="text-base-content/40"> - {musicians.join(', ')}</span>
          )}
        </div>
      </div>

      {/* Musician count badge */}
      <div className="shrink-0 text-xs text-base-content/50 tabular-nums">
        {song.musicians?.length || 0}
        <span className="hidden sm:inline"> {t('nav.musicians', 'musicians').toLowerCase()}</span>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex gap-1">
        {status === 'suggested' && onApprove && (
          <button
            onClick={() => onApprove(song.id)}
            disabled={loading}
            className="btn btn-xs btn-success min-h-[44px]"
            title={t('common.approve')}
          >
            &#10003; {t('common.approve', 'Aprovar')}
          </button>
        )}
        {onRemove && status !== 'current' && (
          <button
            onClick={() => onRemove(song.id)}
            disabled={loading}
            className="btn btn-xs btn-ghost text-error/50 hover:text-error min-h-[44px] min-w-[44px]"
            title={t('common.remove')}
          >
            &#10005;
          </button>
        )}
      </div>
    </div>
  )
}

export function SongQueueTimeline({
  liveState,
  suggestedSongs = [],
  onRemoveSong,
  onApproveSong,
  loading,
}: SongQueueTimelineProps) {
  const {t} = useTranslation()

  const {previousSongs = [], currentSong = null, nextSongs = []} = liveState || {}
  const [playedCollapsed, setPlayedCollapsed] = useState(true)

  return (
    <div className="space-y-4">
      {/* Suggested Songs */}
      {suggestedSongs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-warning uppercase tracking-wider mb-2 px-3">
            {t('dj_control.timeline.suggested_short', 'Sugeridas')} ({suggestedSongs.length})
          </h3>
          <div className="space-y-1">
            {suggestedSongs.map((song) => (
              <SongRow
                key={song.id}
                song={song}
                status="suggested"
                onRemove={onRemoveSong}
                onApprove={onApproveSong}
                loading={loading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Previous Songs - collapsible */}
      {previousSongs.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setPlayedCollapsed(prev => !prev)}
            className="flex items-center gap-2 text-xs font-semibold text-success/70 uppercase tracking-wider mb-2 px-3 hover:text-success transition-colors"
          >
            <span className={`transition-transform duration-200 ${playedCollapsed ? '-rotate-90' : ''}`}>&#9660;</span>
            {t('dj_control.timeline.played', 'Tocadas')} ({previousSongs.length})
          </button>
          {!playedCollapsed && (
            <div className="space-y-1">
              {previousSongs.map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  status="previous"
                  loading={loading}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Current Song */}
      {currentSong && (
        <div>
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 px-3">
            {t('dj_control.timeline.now_playing')}
          </h3>
          <SongRow
            song={currentSong}
            status="current"
            loading={loading}
          />
        </div>
      )}

      {/* Upcoming Songs */}
      {nextSongs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2 px-3">
            {t('dj_control.timeline.upcoming', 'Proximas')} ({nextSongs.length})
          </h3>
          <div className="space-y-1">
            {nextSongs.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                position={idx + 1}
                status="upcoming"
                onRemove={onRemoveSong}
                loading={loading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {previousSongs.length === 0 && !currentSong && nextSongs.length === 0 && suggestedSongs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-base-content/70">{t('dj_control.timeline.empty_queue')}</p>
          <p className="text-xs text-base-content/50 mt-1">{t('dj_control.timeline.empty_queue_hint')}</p>
        </div>
      )}
    </div>
  )
}
