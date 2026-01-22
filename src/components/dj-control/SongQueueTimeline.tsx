/**
 * Song Queue Timeline Component V2
 * Displays songs in a daisyUI timeline with current song highlighted
 * Uses new LiveStateResponseDto structure with pre-organized songs
 */

import {useTranslation} from 'react-i18next'
import type {LiveStateResponseDto, LiveStateSongDto} from '../../types/jamControl.types'
import {TimelineSongItem} from './TimelineSongItem.tsx'

interface SongQueueTimelineProps {
  liveState?: LiveStateResponseDto
  suggestedSongs?: LiveStateSongDto[]
  onRemoveSong?: (scheduleId: string) => void
  onApproveSong?: (scheduleId: string) => void
  loading?: boolean
}

export function SongQueueTimeline({
  liveState,
  suggestedSongs = [],
  onRemoveSong,
  onApproveSong,
  loading
}: SongQueueTimelineProps) {
  const { t } = useTranslation()

  const { previousSongs = [], currentSong = null, nextSongs = [] } = liveState || {}

  // Track position for alternating layout
  let itemIndex = 0

  // Helper to get alternating class
  const getAlternatingClass = () => {
    const isEven = itemIndex % 2 === 0
    itemIndex++
    return isEven ? 'timeline-start' : 'timeline-end'
  }

  return (
    <div className="space-y-6">
      {/* Suggested Songs Section */}
      {suggestedSongs.length > 0 && (
        <div className="card bg-warning/10 border border-warning/30">
          <div className="card-body">
            <h3 className="card-title text-sm flex items-center gap-2">
              <span className="badge badge-warning">{suggestedSongs.length}</span>
              {t('dj_control.timeline.suggested_songs')}
            </h3>
            <ul className="space-y-2">
              {suggestedSongs.map((schedule) => (
                <li key={schedule.id} className="p-3 bg-base-200/50 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{schedule.music.title}</div>
                      <div className="text-xs text-base-content/70">{schedule.music.artist}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {onApproveSong && (
                        <button
                          onClick={() => onApproveSong(schedule.id)}
                          disabled={loading}
                          className="btn btn-xs btn-success"
                          title={t('dj_control.timeline.approve_song')}
                        >
                          ✓ {t('dj_control.timeline.approve')}
                        </button>
                      )}
                      {onRemoveSong && (
                        <button
                          onClick={() => onRemoveSong(schedule.id)}
                          disabled={loading}
                          className="btn btn-xs btn-ghost btn-outline text-error"
                          title={t('dj_control.timeline.remove_song')}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Timeline */}
      <ul className="timeline timeline-vertical">
      {/* Previous Songs */}
      {previousSongs.map((song: LiveStateSongDto) => (
        <li key={song.id}>
          {itemIndex > 0 && <hr className="bg-success/30" />}
          <div className={`${getAlternatingClass()} timeline-box bg-success/10 text-xs opacity-70`}>
            <TimelineSongItem
              song={song}
              status="previous"
              onRemove={onRemoveSong}
              loading={loading}
            />
          </div>
          <div className="timeline-middle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="text-success h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <hr className="bg-success/30" />
        </li>
      ))}

      {/* Current Playing Song - Main Focus */}
      {currentSong && (
        <li>
          <hr className="bg-primary" />
          <div className={`${getAlternatingClass()} timeline-box bg-linear-to-br from-primary/40 to-accent/40 shadow-2xl shadow-primary/50 border-2 border-primary animate-pulse`}>
            <div className="font-bold text-sm mb-2 flex items-center gap-2">
              <span className="badge badge-primary animate-pulse">
                {t('dj_control.timeline.now_playing')}
              </span>
              <span className="text-xs text-primary/70">
                {liveState?.playbackState === 'PLAYING' ? '▶️' : liveState?.playbackState === 'PAUSED' ? '⏸️' : '⏹️'}
              </span>
            </div>
            <TimelineSongItem
              song={currentSong}
              status="current"
              onRemove={onRemoveSong}
              loading={loading}
            />
          </div>
          <div className="timeline-middle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="text-primary h-8 w-8 animate-pulse"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <hr className="bg-primary" />
        </li>
      )}

      {/* Upcoming Songs */}
      {nextSongs.map((song: LiveStateSongDto, idx: number) => (
        <li key={song.id}>
          <hr className="bg-info/50" />
          <div className={`${getAlternatingClass()} timeline-box bg-info/10 border border-info/30`}>
            <div className="text-xs font-semibold text-info mb-1">#{idx + 1}</div>
            <TimelineSongItem
              song={song}
              status="upcoming"
              onRemove={onRemoveSong}
              loading={loading}
            />
          </div>
          <div className="timeline-middle">
            <div className="h-5 w-5 border-2 border-info rounded-full"></div>
          </div>
          {idx < nextSongs.length && <hr className="bg-info/50" />}
        </li>
      ))}

      {/* Empty State */}
      {previousSongs.length === 0 && !currentSong && nextSongs.length === 0 && (
        <li>
          <hr className="bg-base-300/50" />
          <div className={`${getAlternatingClass()} text-center py-4`}>
            <p className="text-sm text-base-content/70">
              {t('dj_control.timeline.empty_queue')}
            </p>
            <p className="text-xs text-base-content/50">
              {t('dj_control.timeline.empty_queue_hint')}
            </p>
          </div>
          <div className="timeline-middle">
            <div className="h-5 w-5 border-2 border-base-400 rounded-full"></div>
          </div>
        </li>
      )}
    </ul>
    </div>
  )
}
