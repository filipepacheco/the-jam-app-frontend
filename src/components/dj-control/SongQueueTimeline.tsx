/**
 * Song Queue Timeline Component
 * Compact vertical list for DJ control - optimized for scanning and quick action
 * Uses new LiveStateResponseDto structure with pre-organized songs
 */

import {useState} from 'react'
import {ChevronDown} from 'lucide-react'
import {useTranslation} from 'react-i18next'
import type {LiveStateResponseDto, LiveStateSongDto} from '../../types/jamControl.types'
import {Action, IconAction} from '../Action'
import {Badge} from '../data-display'

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
  isNext = false,
}: {
  song: LiveStateSongDto
  position?: number
  status: 'previous' | 'current' | 'paused' | 'upcoming' | 'suggested'
  onRemove?: (id: string) => void
  onApprove?: (id: string) => void
  loading?: boolean
  isNext?: boolean
}) {
  const {t} = useTranslation()

  const musicians = song.musicians
    ?.map((m) => m.name || m.instrument)
    .filter(Boolean)

  const statusStyles = {
    previous: 'opacity-50',
    current: 'bg-primary/10 border border-primary/40 ring-1 ring-primary/20',
    paused: 'bg-warning/10 border border-warning/40 ring-1 ring-warning/20',
    upcoming: isNext ? 'bg-secondary/10 border border-secondary/40 ring-1 ring-secondary/20' : '',
    suggested: 'bg-warning/5 border border-warning/20',
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${statusStyles[status]}`}>
      {/* Position or status indicator */}
      <div className="shrink-0 w-7 text-center">
        {status === 'paused' ? (
          <span className="text-warning font-bold text-sm" aria-label={t('schedule.statuses.paused')}>Ⅱ</span>
        ) : status === 'current' ? (
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
          {isNext && (
            <Badge className="shrink-0" size="sm" tone="info">
              {t('dj_control.now_playing.next_up')}
            </Badge>
          )}
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
        <span className="hidden sm:inline"> {t('nav.musicians').toLowerCase()}</span>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex gap-1">
        {status === 'suggested' && onApprove && (
          <Action
            onClick={() => onApprove(song.id)}
            state={loading ? 'disabled' : 'idle'}
            variant="primary"
          >
            <Action.Label>&#10003; {t('common.approve')}</Action.Label>
          </Action>
        )}
        {onRemove && status !== 'current' && status !== 'paused' && (
          <IconAction
            onClick={() => onRemove(song.id)}
            state={loading ? 'disabled' : 'idle'}
            variant="quiet"
            label={t('dj_control.timeline.remove_song')}
          >
            &#10005;
          </IconAction>
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
  const [suggestedCollapsed, setSuggestedCollapsed] = useState(false)

  return (
    <div className="space-y-4">
      {/* Suggested Songs */}
      {suggestedSongs.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setSuggestedCollapsed((collapsed) => !collapsed)}
            className="ds-control ds-focusable flex w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold uppercase tracking-wider text-warning transition-colors hover:bg-warning/10"
            aria-expanded={!suggestedCollapsed}
          >
            <ChevronDown
              className={`size-4 shrink-0 transition-transform duration-200 ${suggestedCollapsed ? '-rotate-90' : ''}`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              {t('dj_control.timeline.suggested_songs')} ({suggestedSongs.length})
            </span>
          </button>
          {!suggestedCollapsed && (
            <div className="mt-1 space-y-1">
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
          )}
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
            {t('dj_control.timeline.played')} ({previousSongs.length})
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
            {t(liveState?.playbackState === 'PAUSED' ? 'schedule.statuses.paused' : 'dj_control.timeline.now_playing')}
          </h3>
          <SongRow
            song={currentSong}
            status={liveState?.playbackState === 'PAUSED' ? 'paused' : 'current'}
            loading={loading}
          />
        </div>
      )}

      {/* Upcoming Songs */}
      {nextSongs.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2 px-3">
            {t('dj_control.timeline.upcoming')} ({nextSongs.length})
          </h3>
          <div className="space-y-1">
            {nextSongs.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                position={idx + 1}
                status="upcoming"
                isNext={idx === 0}
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
