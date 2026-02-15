/**
 * Queue Stats Component V2
 * Displays statistics about the song queue + playback control buttons
 * Uses new LiveStateResponseDto structure
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LiveStateResponseDto, LiveStateSongDto } from '../../types/jamControl.types'
import { Alert } from '../Alert'

interface QueueStatsProps {
  liveState: LiveStateResponseDto | null
  jamId?: string
  isLoading?: boolean
  onStart?: () => Promise<void>
  onStop?: () => Promise<void>
  onNext?: () => Promise<void>
  onPrevious?: () => Promise<void>
  onError?: (error: string) => void
}

function formatTime(seconds: number): string {
  if (seconds === 0) return '0:00'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function QueueStats({
  liveState,
  jamId,
  isLoading = false,
  onStart,
  onStop,
  onNext,
  onPrevious,
  onError,
}: QueueStatsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [actionLoading, setActionLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  if (!liveState) {
    return (
      <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow">
        <div className="card-body p-4">
          <p className="text-sm text-base-content/70">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  const { currentSong, nextSongs, previousSongs } = liveState

  const totalSongs = previousSongs.length + (currentSong ? 1 : 0) + nextSongs.length
  const completedCount = previousSongs.length
  const upcomingCount = nextSongs.length

  // Calculate total duration
  const calculateDuration = (songs: LiveStateSongDto[]) => {
    return songs.reduce((acc, song) => {
      return acc + (song.music?.duration || 0)
    }, 0)
  }

  const totalDuration = calculateDuration(previousSongs) +
    (currentSong ? currentSong.music.duration || 0 : 0) +
    calculateDuration(nextSongs)

  const remainingDuration = (currentSong ? currentSong.music.duration || 0 : 0) + calculateDuration(nextSongs)

  const completedDuration = calculateDuration(previousSongs)

  // Button state logic
  const isStopped = liveState.playbackState === 'STOPPED'
  const hasCurrentSong = !!currentSong
  const hasNextSong = nextSongs.length > 0
  const isStartDisabled = isLoading || actionLoading || !isStopped || !hasNextSong
  const isStopDisabled = isLoading || actionLoading || isStopped
  const isNextDisabled = isLoading || actionLoading || !hasCurrentSong || !hasNextSong
  const isPreviousDisabled = isLoading || actionLoading || !hasCurrentSong

  const handleAction = async (action: () => Promise<void>) => {
    setActionLoading(true)
    setLocalError(null)
    try {
      await action()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('dj_control.errors.action_failed')
      setLocalError(message)
      onError?.(message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow">
      <div className="card-body p-4">
        <h3 className="font-bold text-lg mb-4">{t('dj_control.stats.title_with_emoji')}</h3>

        <div className="space-y-3">
          {/* Total Songs */}
          <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
            <span className="text-sm font-medium">{t('dj_control.stats.total_songs')}</span>
            <span className="badge badge-lg badge-primary">{totalSongs}</span>
          </div>

          {/* Completed */}
          <div className="flex justify-between items-center p-2">
            <span className="text-xs">{t('dj_control.stats.completed_with_icon')}</span>
            <span className="text-xs font-bold">{completedCount}</span>
          </div>

          {/* Upcoming */}
          <div className="flex justify-between items-center p-2">
            <span className="text-xs">{t('dj_control.stats.upcoming_with_icon')}</span>
            <span className="text-xs font-bold">{upcomingCount}</span>
          </div>
        </div>

        <hr className="my-4 border-base-300" />

        <div className="flex justify-between text-sm">
          <h3 className="font-bold text-sm">{t('dj_control.stats.duration_with_emoji')}</h3>
          <span className="font-bold">{formatTime(totalDuration)}</span>
        </div>

        <progress
          className="progress progress-primary"
          value={totalDuration ? (completedDuration / totalDuration) * 100 : 0}
          max="100"
        ></progress>

        <div className="flex justify-between text-xs text-base-content/70">
          <span>{t('dj_control.stats.remaining')}</span>
          <span>{formatTime(remainingDuration)}</span>
        </div>

        {/* Control Buttons */}
        {onStart && (
          <>
            <hr className="my-4 border-base-300" />

            <Alert type="error" message={localError} onDismiss={() => setLocalError(null)} className="alert-sm" />

            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => { void handleAction(onStart) }}
                  className="btn btn-success btn-xs sm:btn-sm flex-1"
                  disabled={isStartDisabled}
                  title={t('dj_control.actions.start_tooltip')}
                >
                  {t('dj_control.actions.start')}
                </button>
                <button
                  onClick={() => { void handleAction(onStop!) }}
                  className="btn btn-error btn-xs sm:btn-sm flex-1"
                  disabled={isStopDisabled}
                  title={t('dj_control.actions.stop_tooltip')}
                >
                  {t('dj_control.actions.stop')}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { void handleAction(onPrevious!) }}
                  className="btn btn-secondary btn-xs sm:btn-sm flex-1"
                  disabled={isPreviousDisabled}
                  title={t('dj_control.actions.previous_tooltip')}
                >
                  {t('dj_control.actions.previous')}
                </button>
                <button
                  onClick={() => { void handleAction(onNext!) }}
                  className="btn btn-primary btn-xs sm:btn-sm flex-1"
                  disabled={isNextDisabled}
                  title={t('dj_control.actions.next_tooltip')}
                >
                  {t('dj_control.actions.next')}
                </button>
              </div>
            </div>

            {jamId && (
              <button
                onClick={() => navigate(`/host/jams/${jamId}/manage`)}
                className="btn btn-secondary btn-xs sm:btn-sm w-full mt-2"
              >
                <span className="hidden sm:inline">{t('dj_control.actions.add_songs')}</span>
                <span className="sm:hidden">{t('dj_control.actions.add_songs_short')}</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
