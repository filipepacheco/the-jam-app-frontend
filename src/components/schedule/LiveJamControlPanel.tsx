/**
 * Live Jam Control Panel Component
 * Host control interface for managing active jam playback
 * Allows play/pause/skip and queue reordering
 */

import {useState} from 'react'
import {GripVertical, Music, Pause, Play, SkipForward} from 'lucide-react'
import type {JamResponseDto, RegistrationResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {formatDuration} from '../../lib/formatters'
import {getToken} from '../../lib/auth'
import {getInstrumentIcon} from './RegistrationList'
import {useTranslation} from 'react-i18next'

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

const normalizeInstrument = (instrument: string): string => {
  const lower = instrument.toLowerCase()
  if (lower === 'drums' || lower === 'bateria') return 'drums'
  if (lower === 'guitar' || lower === 'guitars' || lower === 'guitarra') return 'guitars'
  if (lower === 'bass' || lower === 'baixo') return 'bass'
  if (lower === 'vocals' || lower === 'vocal' || lower === 'vozes' || lower === 'voz') return 'vocals'
  if (lower === 'keys' || lower === 'keyboard' || lower === 'teclado') return 'keys'
  return lower
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

  const currentSong = jam.schedules?.find((s) => s.status === 'IN_PROGRESS')
  const nextThreeSongs = localQueue.slice(0, 3)

  // Send control action to backend
  const sendControlAction = async (action: ControlAction) => {
    setIsLoading(true)

    try {
      const token = getToken()

      if (!token) {
        throw new Error(t('errors.no_token_found'))
      }

      const response = await fetch(`/api/jams/${jam.id}/live/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(action),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || t('errors.action_failed'))
      }

      const result = await response.json()

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

    // Reorder locally
    const newQueue = [...localQueue]
    const [draggedSchedule] = newQueue.splice(draggedIndex, 1)
    newQueue.splice(targetIndex, 0, draggedSchedule)

    // Update local state
    setLocalQueue(newQueue)
    setDraggedItem(null)

    // Send reorder action with new schedule IDs
    sendControlAction({
      action: 'reorder',
      payload: {
        scheduleIds: newQueue.map((s) => s.id),
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Now Playing Section */}
      {currentSong ? (
        <div className="bg-gradient-to-br from-primary to-primary-focus rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-white/80 mb-1">{t('live_control.now_playing')}</p>
              <h2 className="text-3xl font-bold">{currentSong.music?.title || t('schedule.song_tba')}</h2>
              <p className="text-xl text-white/90 mt-1">{currentSong.music?.artist || t('schedule.artist_tba')}</p>
            </div>
            <Music className="w-12 h-12 text-white/60" />
          </div>

          {/* Duration */}
          {currentSong.music?.duration && (
            <p className="text-lg mb-4">
              ⏱️ {formatDuration(currentSong.music.duration)}
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
            >
              <Play className="w-4 h-4" />
              {t('common.play')}
            </button>
            <button
              onClick={handlePause}
              disabled={isLoading}
              className="btn btn-sm btn-accent text-accent-content flex-1 gap-2"
            >
              <Pause className="w-4 h-4" />
              {t('common.pause')}
            </button>
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="btn btn-sm btn-accent text-accent-content flex-1 gap-2"
            >
              <SkipForward className="w-4 h-4" />
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
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Music className="w-5 h-5" />
          {t('live_control.up_next')}
        </h3>

        {nextThreeSongs.length > 0 ? (
          <div className="space-y-2">
            {nextThreeSongs.map((schedule, index) => (
              <div
                key={schedule.id}
                draggable
                onDragStart={() => handleDragStart(schedule.id)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, schedule)}
                className="bg-base-200 rounded-lg p-4 flex items-start gap-3 cursor-move hover:bg-base-300 transition-colors border-2 border-transparent"
              >
                {/* Drag Handle */}
                <div className="pt-1 text-base-content/40">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base-content">
                    {index + 1}. {schedule.music?.title || t('schedule.song_tba')}
                  </p>
                  <p className="text-sm text-base-content/70">
                    {schedule.music?.artist || t('schedule.artist_tba')}
                  </p>
                  {schedule.music?.duration && (
                    <p className="text-xs text-base-content/60 mt-1">
                      ⏱️ {formatDuration(schedule.music.duration)}
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
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-base-content/60">
          <span className="loading loading-spinner loading-sm"></span>
          {t('live_control.executing_action')}
        </div>
      )}
    </div>
  )
}

