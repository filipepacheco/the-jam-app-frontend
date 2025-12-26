/**
 * Song Queue Timeline Component
 * Displays songs in a daisyUI timeline with current song highlighted
 */

import type {ScheduleResponseDto} from '../../types/api.types'
import {TimelineSongItem} from './TimelineSongItem'

interface SongQueueTimelineProps {
  schedules: ScheduleResponseDto[]
  onRemoveSong: (scheduleId: string) => void
  onApproveSong?: (scheduleId: string) => void
  loading: boolean
}

export function SongQueueTimeline({
  schedules,
  onRemoveSong,
  onApproveSong,
  loading,
}: SongQueueTimelineProps) {
  // Separate by status
  const completedSongs = schedules.filter(s => s.status === 'COMPLETED')
  const currentSong = schedules.find(s => s.status === 'IN_PROGRESS')
  const upcomingSongs = schedules.filter(s => s.status === 'SCHEDULED')
  const suggestedSongs = schedules.filter(s => s.status === 'SUGGESTED')

  // Track position for alternating layout
  let itemIndex = 0

  // Helper to get alternating class
  const getAlternatingClass = () => {
    const isEven = itemIndex % 2 === 0
    itemIndex++
    return isEven ? 'timeline-start' : 'timeline-end'
  }

  return (
    <ul className="timeline timeline-vertical">
      {/* Completed Songs */}
      {completedSongs.map((schedule) => (
        <li key={schedule.id}>
          {itemIndex > 0 && <hr className="bg-success/30" />}
          <div className={`${getAlternatingClass()} timeline-box bg-success/10 text-xs opacity-70`}>
            <TimelineSongItem
              schedule={schedule}
              status="completed"
              onRemove={() => onRemoveSong(schedule.id)}
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
              <span className="badge badge-primary animate-pulse">NOW PLAYING</span>
            </div>
            <TimelineSongItem
              schedule={currentSong}
              status="current"
              onRemove={() => onRemoveSong(currentSong.id)}
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
      {upcomingSongs.map((schedule, idx) => (
        <li key={schedule.id}>
          <hr className="bg-info/50" />
          <div className={`${getAlternatingClass()} timeline-box bg-info/10 border border-info/30`}>
            <div className="text-xs font-semibold text-info mb-1">#{idx + 1}</div>
            <TimelineSongItem
              schedule={schedule}
              status="upcoming"
              onRemove={() => onRemoveSong(schedule.id)}
              loading={loading}
            />
          </div>
          <div className="timeline-middle">
            <div className="h-5 w-5 border-2 border-info rounded-full"></div>
          </div>
          {idx < upcomingSongs.length && <hr className="bg-info/50" />}
        </li>
      ))}

      {/* Suggested Songs Header */}
      {suggestedSongs.length > 0 && (
        <li>
          <hr className="bg-warning/50" />
          <div className={`${getAlternatingClass()} text-xs font-bold text-warning`}>⚠️ Suggestions</div>
          <div className="timeline-middle">
            <div className="h-5 w-5 border-2 border-warning rounded-full"></div>
          </div>
          <hr className="bg-warning/50" />
        </li>
      )}

      {/* Suggested Songs */}
      {suggestedSongs.map((schedule, idx) => (
        <li key={schedule.id}>
          <hr className="bg-warning/50" />
          <div className={`${getAlternatingClass()} timeline-box bg-warning/10 border border-warning/30`}>
            <TimelineSongItem
              schedule={schedule}
              status="suggested"
              onRemove={() => onRemoveSong(schedule.id)}
              onApprove={() => onApproveSong?.(schedule.id)}
              loading={loading}
            />
          </div>
          <div className="timeline-middle">
            <div className="h-5 w-5 border-2 border-warning rounded-full"></div>
          </div>
          {idx < suggestedSongs.length - 1 && <hr className="bg-warning/50" />}
        </li>
      ))}

      {/* Empty State */}
      {schedules.length === 0 && (
        <li>
          <hr className="bg-base-300/50" />
          <div className={`${getAlternatingClass()} text-center py-4`}>
            <p className="text-sm text-base-content/70">No songs in queue</p>
            <p className="text-xs text-base-content/50">Add songs from the management page</p>
          </div>
          <div className="timeline-middle">
            <div className="h-5 w-5 border-2 border-base-400 rounded-full"></div>
          </div>
        </li>
      )}
    </ul>
  )
}

