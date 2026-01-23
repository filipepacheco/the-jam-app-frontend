/**
 * Live Jam Control Panel Component
 * Host control interface for managing active jam queue
 * Allows queue reordering via drag and drop
 */

import React, {useState} from 'react'
import {GripVertical, Music} from 'lucide-react'
import type {JamResponseDto, RegistrationResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {formatDuration} from '../../lib/formatters'
import {getInstrumentIcon} from './RegistrationList'
import {useTranslation} from 'react-i18next'
import {normalizeInstrument} from '../../utils/musicianUtils'
import {useQueueReorder} from '../../hooks'

interface LiveJamControlPanelProps {
  jam: JamResponseDto
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

export function LiveJamControlPanel({
  jam,
  onActionSuccess,
  onActionError,
}: LiveJamControlPanelProps) {
  const { t } = useTranslation()
  const [localQueue, setLocalQueue] = useState<ScheduleResponseDto[]>(
    jam.schedules?.filter((s) => s.status === 'SCHEDULED').sort((a, b) => (a.order || 0) - (b.order || 0)) || []
  )
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  // New reorder hook for queue management
  const { reorderQueue, isReordering } = useQueueReorder(
    jam.id,
    localQueue,
    (updatedSchedules) => {
      setLocalQueue(updatedSchedules)
      onActionSuccess?.(t('live_control.reordered_feedback'))
    },
    (errorMessage) => {
      onActionError?.(errorMessage)
    },
    (previousQueue) => {
      // Rollback to previous queue state without showing success alert
      setLocalQueue(previousQueue)
    }
  )

  const currentSong = jam.schedules?.find((s) => s.status === 'IN_PROGRESS')
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

    // Reorder locally (optimistic update)
    const newQueue = [...localQueue]
    const [draggedSchedule] = newQueue.splice(draggedIndex, 1)
    newQueue.splice(targetIndex, 0, draggedSchedule)

    // Update local state immediately
    setLocalQueue(newQueue)
    setDraggedItem(null)

    // Send reorder request using new dedicated endpoint
    // Hook builds explicit order values and handles rollback on error
    reorderQueue(newQueue)
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
      <div className="bg-base-100 rounded-xl p-6 border border-base-300 relative">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-balance">
          <Music className="size-5" aria-hidden="true" />
          {t('live_control.up_next')}
        </h3>

        {nextSongs.length > 0 ? (
          <div className="space-y-2">
            {nextSongs.map((schedule, index) => (
              <div
                key={schedule.id}
                draggable={!isReordering}
                onDragStart={() => handleDragStart(schedule.id)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, schedule)}
                className="bg-base-200 rounded-lg p-4 flex items-start gap-3 cursor-move hover:bg-base-300 transition-[background-color] duration-150 motion-reduce:transition-none border-2 border-transparent"
                role="button"
                tabIndex={0}
                aria-label={`${schedule.music?.title || t('schedule.song_tba')} - ${t('live_control.drag_to_reorder')}`}
              >
                {/* Drag Handle */}
                <div className="pt-1 text-base-content/40" aria-hidden="true">
                  <GripVertical className="size-5" />
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base-content text-balance">
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
            ))}
          </div>
        ) : (
          <p className="text-center text-base-content/60 py-4">{t('live_control.no_more_songs')}</p>
        )}

        {/* Loading Overlay */}
        {isReordering && (
          <div className="absolute inset-0 bg-base-100/80 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <div className="flex items-center gap-2 text-base-content">
              <span className="loading loading-spinner loading-md"></span>
              <span className="font-medium">{t('live_control.executing_action')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

