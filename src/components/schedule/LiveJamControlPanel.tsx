/**
 * Live Jam Control Panel Component
 * Host control interface for managing active jam playback
 * Allows play/pause/skip and queue reordering
 */

import React, {useState} from 'react'
import {GripVertical, Music, Pause, Play, SkipForward} from 'lucide-react'
import type {JamResponseDto, RegistrationResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {formatDuration} from '../../lib/formatters'
import {apiClient} from '../../lib/api'
import {getInstrumentIcon} from './RegistrationList'
import {useTranslation} from 'react-i18next'
import {normalizeInstrument} from '../../utils/musicianUtils'
import {useQueueReorder} from '../../hooks'

interface LiveJamControlPanelProps {
  jam: JamResponseDto
  onActionSuccess?: (message: string) => void
  onActionError?: (error: string) => void
}

interface ControlAction {
  action: 'play' | 'pause' | 'skip' | 'reorder'
  payload?: {
    scheduleIds?: string[]
  }
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
  const [isLoading, setIsLoading] = useState(false)
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
    }
  )

  const currentSong = jam.schedules?.find((s) => s.status === 'IN_PROGRESS')
  const nextSongs = localQueue

  // Send control action to backend
  const sendControlAction = async (action: ControlAction) => {
    setIsLoading(true)

    try {
      const response = await apiClient.post(`/jams/${jam.id}/live/control`, action)

      if (!response.success) {
        throw new Error(response.error || t('errors.action_failed'))
      }

      // Success feedback
      const actionLabels: Record<string, string> = {
        play: t('live_control.song_playing_feedback'),
        pause: t('live_control.song_paused_feedback'),
        skip: t('live_control.skipped_feedback'),
        reorder: t('live_control.reordered_feedback'),
      }

      onActionSuccess?.(actionLabels[action.action] || t('errors.generic_error'))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.failed_to_execute_action')
      onActionError?.(errorMessage)
      console.error('❌ Control action error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle play button
  const handlePlay = () => {
    if (!currentSong) {
      onActionError?.(t('errors.no_song_playing'))
      return
    }
    sendControlAction({ action: 'play' })
  }

  // Handle pause button
  const handlePause = () => {
    if (!currentSong) {
      onActionError?.(t('errors.no_song_playing'))
      return
    }
    sendControlAction({ action: 'pause' })
  }

  // Handle skip button
  const handleSkip = () => {
    if (!currentSong) {
      onActionError?.(t('errors.no_song_playing'))
      return
    }
    sendControlAction({ action: 'skip' })
  }

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
    // Hook handles rollback on error
    const scheduleIds = newQueue.map((s) => s.id)
    reorderQueue(scheduleIds)
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
                    <div key={instrument} className="flex items-center gap-1">
                      <span className="text-2xl">{getInstrumentIcon(instrument)}</span>
                      {musicians.length > 1 && (
                        <span className="badge badge-sm badge-white text-primary">
                          ×{musicians.length}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handlePlay}
              disabled={isLoading}
              className="btn btn-sm btn-accent text-accent-content flex-1 gap-2"
              aria-label={t('common.play')}
            >
              <Play className="size-4" aria-hidden="true" />
              {t('common.play')}
            </button>
            <button
              onClick={handlePause}
              disabled={isLoading}
              className="btn btn-sm btn-accent text-accent-content flex-1 gap-2"
              aria-label={t('common.pause')}
            >
              <Pause className="size-4" aria-hidden="true" />
              {t('common.pause')}
            </button>
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="btn btn-sm btn-accent text-accent-content flex-1 gap-2"
              aria-label={t('common.skip')}
            >
              <SkipForward className="size-4" aria-hidden="true" />
              {t('common.skip')}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-base-200 rounded-xl p-6 text-center">
          <p className="text-base-content/60">{t('live_control.no_song_playing')}</p>
          <p className="text-sm text-base-content/50 mt-1">{t('live_control.start_to_begin')}</p>
        </div>
      )}

      {/* Up Next Section */}
      <div className="bg-base-100 rounded-xl p-6 border border-base-300">
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
      </div>

      {/* Loading Indicator */}
      {(isLoading || isReordering) && (
        <div className="flex items-center justify-center gap-2 text-sm text-base-content/60">
          <span className="loading loading-spinner loading-sm"></span>
          {t('live_control.executing_action')}
        </div>
      )}
    </div>
  )
}

