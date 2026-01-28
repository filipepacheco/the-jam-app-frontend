/**
 * Live Jam Control Panel Component
 * Host control interface for managing active jam queue
 * Uses live state for real-time performance data
 * Allows queue reordering via drag and drop
 */

import React, {useState, useEffect} from 'react'
import {GripVertical, Music, Loader2} from 'lucide-react'
import type {RegistrationResponseDto, ScheduleResponseDto} from '../../types/api.types'
import type {LiveStateSongDto} from '../../types/jamControl.types'
import {formatDuration} from '../../lib/formatters'
import {getInstrumentIcon} from './RegistrationList'
import {useTranslation} from 'react-i18next'
import {normalizeInstrument} from '../../utils/musicianUtils'
import {useJamControl, useQueueReorder} from '../../hooks'

interface LiveJamControlPanelProps {
  jamId: string
  onActionSuccess?: (message: string) => void
  onActionError?: (error: string) => void
}

/**
 * Group registrations by instrument
 */
const groupRegistrationsByInstrument = (
  registrations: RegistrationResponseDto[] | undefined
): Map<string, RegistrationResponseDto[]> => {
  const grouped = new Map<string, RegistrationResponseDto[]>()
  if (!registrations) return grouped

  registrations.forEach((reg) => {
    const instrument = reg.instrument || reg.musician?.instrument || ''
    if (instrument) {
      const normalized = normalizeInstrument(instrument)
      if (!grouped.has(normalized)) {
        grouped.set(normalized, [])
      }
      grouped.get(normalized)!.push(reg)
    }
  })

  return grouped
}


/**
 * Get the order of instruments for consistent display
 */
const getInstrumentOrder = (instrument: string): number => {
  const order: Record<string, number> = {
    'vocals': 0,
    'drums': 1,
    'guitars': 2,
    'bass': 3,
    'keys': 4,
  }
  return order[instrument] ?? 99
}

/**
 * Convert LiveStateSongDto to ScheduleResponseDto for compatibility with reorder hook
 * Note: Only id, jamId, order are used by the reorder hook
 * Music data stays as LiveStateMusic (English fields: title, artist)
 */
const liveSongToSchedule = (song: LiveStateSongDto): ScheduleResponseDto => ({
  id: song.id,
  jamId: song.jamId,
  musicId: song.musicId,
  order: song.order,
  status: song.status,
  createdAt: song.createdAt,
  // Cast music to expected type - we only use title/artist which are compatible
  music: song.music as unknown as ScheduleResponseDto['music'],
  registrations: song.registrations,
})

export function LiveJamControlPanel({
  jamId,
  onActionSuccess,
  onActionError,
}: LiveJamControlPanelProps) {
  const { t } = useTranslation()
  
  // Use live state hook for real-time data
  const { liveState, isLoading, error, refresh } = useJamControl(jamId, {
    autoRefreshEnabled: true,
    autoRefreshInterval: 5000, // 5 seconds
  })
  
  // Local queue state for drag-and-drop (initialized from live state)
  const [localQueue, setLocalQueue] = useState<ScheduleResponseDto[]>([])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [reorderingItemId, setReorderingItemId] = useState<string | null>(null)

  // Sync local queue with live state when it changes (only when not reordering)
  useEffect(() => {
    if (liveState?.nextSongs && !reorderingItemId) {
      setLocalQueue(liveState.nextSongs.map(liveSongToSchedule))
    }
  }, [liveState?.nextSongs, reorderingItemId])

  // Handle errors from live state
  useEffect(() => {
    if (error) {
      onActionError?.(error)
    }
  }, [error, onActionError])

  // New reorder hook for queue management
  const { reorderQueue, isReordering } = useQueueReorder(
    jamId,
    localQueue,
    (updatedSchedules) => {
      setLocalQueue(updatedSchedules)
      setReorderingItemId(null)
      onActionSuccess?.(t('live_control.reordered_feedback'))
      // Refresh live state to get updated data
      void refresh()
    },
    (errorMessage) => {
      setReorderingItemId(null)
      onActionError?.(errorMessage)
    },
    (previousQueue) => {
      // Rollback to previous queue state without showing success alert
      setLocalQueue(previousQueue)
      setReorderingItemId(null)
    }
  )

  const currentSong = liveState?.currentSong
  const nextSongs = localQueue

  // Handle drag and drop for reordering
  const handleDragStart = (scheduleId: string) => {
    setDraggedItem(scheduleId)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-primary/10', 'border-primary')
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-primary/10', 'border-primary')
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetSchedule: ScheduleResponseDto) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-primary/10', 'border-primary')

    if (!draggedItem) return

    const draggedIndex = localQueue.findIndex((s) => s.id === draggedItem)
    const targetIndex = localQueue.findIndex((s) => s.id === targetSchedule.id)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Don't reorder if dropped in same position
    if (draggedIndex === targetIndex) {
      setDraggedItem(null)
      return
    }

    // Set the item being reordered for visual feedback
    setReorderingItemId(draggedItem)

    // Reorder locally (optimistic update)
    const newQueue = [...localQueue]
    const [draggedSchedule] = newQueue.splice(draggedIndex, 1)
    newQueue.splice(targetIndex, 0, draggedSchedule)

    // Update local state immediately
    setLocalQueue(newQueue)
    setDraggedItem(null)

    // Send reorder request using new dedicated endpoint
    reorderQueue(newQueue)
  }

  // Loading state - only for initial load
  if (isLoading && !liveState) {
    return (
      <div className="space-y-6">
        <div className="bg-base-200 rounded-xl p-8 text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="text-base-content/60 mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Now Playing Section */}
      {currentSong ? (
        <div className="bg-gradient-to-br from-primary to-primary-focus rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-white/80 mb-1">{t('live_control.now_playing')}</p>
              <h2 className="text-3xl font-bold text-balance">{currentSong.music?.title || t('schedule.song_tba')}</h2>
              <p className="text-xl text-white/90 mt-1 text-pretty">{currentSong.music?.artist || t('schedule.artist_tba')}</p>
            </div>
            <Music className="size-12 text-white/60" aria-hidden="true" />
          </div>

          {/* Duration */}
          {currentSong.music?.duration && (
            <p className="text-lg mb-4 tabular-nums">
              <span aria-hidden="true">⏱️</span> {formatDuration(currentSong.music.duration)}
            </p>
          )}

          {/* Musicians Section */}
          {currentSong.registrations && currentSong.registrations.length > 0 && (
            <div className="mb-6 bg-white/10 rounded-lg p-4">
              <p className="text-sm font-semibold text-white/90 mb-3">{t('nav.musicians')}</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(groupRegistrationsByInstrument(currentSong.registrations).entries())
                  .sort(([a], [b]) => getInstrumentOrder(a) - getInstrumentOrder(b))
                  .map(([instrument, musicians]) => (
                    <div key={instrument} className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                      <span className="text-lg">{getInstrumentIcon(instrument)}</span>
                      <span className="text-sm text-white/90">
                        {musicians.map(m => m.musician?.name || t('common.unknown')).join(', ')}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="bg-base-200 rounded-xl p-6 text-center">
          <p className="text-base-content/60">{t('live_control.no_song_playing')}</p>
          <p className="text-sm text-base-content/50 mt-1">{t('live_control.start_to_begin')}</p>
        </div>
      )}

      {/* Up Next Section */}
      <div className="bg-base-100 rounded-xl p-6 border border-base-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-balance">
            <Music className="size-5" aria-hidden="true" />
            {t('live_control.up_next')}
          </h3>
          
          {/* Subtle loading indicator for reordering */}
          {isReordering && (
            <div className="flex items-center gap-2 text-sm text-base-content/60">
              <Loader2 className="size-4 animate-spin" />
              <span>{t('live_control.saving_order')}</span>
            </div>
          )}
        </div>

        {nextSongs.length > 0 ? (
          <div className="space-y-2">
            {nextSongs.map((schedule, index) => {
              const isReorderingThisItem = reorderingItemId === schedule.id
              
              return (
                <div
                  key={schedule.id}
                  draggable={!isReordering}
                  onDragStart={() => handleDragStart(schedule.id)}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, schedule)}
                  className={`
                    rounded-lg p-4 flex items-start gap-3 border-2 transition-all duration-200
                    ${isReorderingThisItem 
                      ? 'bg-primary/5 border-primary/30 cursor-wait' 
                      : 'bg-base-200 border-transparent cursor-move hover:bg-base-300'
                    }
                    ${draggedItem === schedule.id ? 'opacity-50' : 'opacity-100'}
                  `}
                  role="button"
                  tabIndex={0}
                  aria-label={`${schedule.music?.title || t('schedule.song_tba')} - ${t('live_control.drag_to_reorder')}`}
                  aria-busy={isReorderingThisItem}
                >
                  {/* Drag Handle */}
                  <div className={`
                    pt-1 transition-colors
                    ${isReorderingThisItem ? 'text-primary/50' : 'text-base-content/40'}
                  `} aria-hidden="true">
                    {isReorderingThisItem ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <GripVertical className="size-5" />
                    )}
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`
                      font-bold text-balance
                      ${isReorderingThisItem ? 'text-base-content/70' : 'text-base-content'}
                    `}>
                      {index + 1}. {schedule.music?.title || t('schedule.song_tba')}
                    </p>
                    <p className="text-sm text-base-content/70 text-pretty">
                      {schedule.music?.artist || t('schedule.artist_tba')}
                    </p>
                    {schedule.music?.duration && (
                      <p className="text-xs text-base-content/60 mt-1 tabular-nums">
                        <span aria-hidden="true">⏱️</span> {formatDuration(schedule.music.duration)}
                      </p>
                    )}
                  </div>

                  {/* Musicians Count */}
                  {schedule.registrations && schedule.registrations.length > 0 && (
                    <div className="badge badge-outline text-xs">
                      {t('schedule.musicians_count', { count: schedule.registrations.length })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-base-content/60 py-4">{t('live_control.no_more_songs')}</p>
        )}
      </div>
    </div>
  )
}
