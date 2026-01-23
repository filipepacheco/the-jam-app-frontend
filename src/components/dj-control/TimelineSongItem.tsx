/**
 * Timeline Song Item Component V2
 * Displays a single song item in the timeline
 * Uses new LiveStateSongDto structure
 */

import {useTranslation} from 'react-i18next'
import type {LiveStateSongDto} from '../../types/jamControl.types'

interface TimelineSongItemV2Props {
  song: LiveStateSongDto
  status: 'previous' | 'current' | 'upcoming'
  onRemove?: (songId: string) => void
  loading?: boolean
}

export function TimelineSongItem({ song, status, onRemove, loading }: TimelineSongItemV2Props) {
  const { t } = useTranslation()

  const musicians = song.registrations
    ?.map((reg) => reg.musician?.name || reg.instrument)
    .filter(Boolean)
    .join(', ') || t('dj_control.timeline.no_musicians')

  const duration = song.music.duration
    ? `${Math.floor(song.music.duration / 60)}:${String(song.music.duration % 60).padStart(2, '0')}`
    : '--:--'

  // Handle both Portuguese (titulo/artista) and English (title/artist) field names
  const title = song.music.title || 'Unknown'
  const artist = song.music.artist || 'Unknown'

  return (
    <div className="space-y-1">
      {/* Song Title and Artist */}
      <div className="font-semibold text-sm line-clamp-2">
        {title}
      </div>
      <div className="text-xs text-base-content/70">
        {artist}
      </div>

      {/* Duration */}
      {song.music.duration && (
        <div className="text-xs text-base-content/60">
          ⏱️ {duration}
        </div>
      )}

      {/* Musicians/Instruments */}
      <div className="text-xs text-base-content/70 line-clamp-2">
        🎵 {musicians}
      </div>

      {/* Timestamps for current/previous songs */}
      {status === 'current' && song.startedAt && (
        <div className="text-xs text-primary/70">
          Started: {new Date(song.startedAt).toLocaleTimeString()}
        </div>
      )}

      {status === 'previous' && song.completedAt && (
        <div className="text-xs text-success/70">
          Completed: {new Date(song.completedAt).toLocaleTimeString()}
        </div>
      )}

      {/* Remove button */}
      {onRemove && status !== 'current' && (
        <button
          onClick={() => onRemove(song.id)}
          disabled={loading}
          className="btn btn-xs btn-ghost btn-outline text-error hover:bg-error/20 mt-1"
          title={t('dj_control.timeline.remove_song')}
        >
          ✕ {t('dj_control.timeline.remove')}
        </button>
      )}
    </div>
  )
}
