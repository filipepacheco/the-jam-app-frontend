/**
 * Queue Stats Component V2
 * Displays statistics about the song queue + playback control buttons
 * Uses new LiveStateResponseDto structure
 *
 * Legacy: consumed only by the legacy DJControlTab. Kept alongside CompactStats
 * (the V2, presentation-only equivalent) because it also owns the embedded
 * start/stop/previous/next actions the legacy tab layout expects. See
 * docs/design-system/dj-control-migration.md for the recorded decision.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LiveStateResponseDto, LiveStateSongDto } from '../../types/jamControl.types'
import { Action } from '../Action'
import { ErrorState } from '../FeedbackStates'
import { DataCard, Badge } from '../data-display'

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
      <DataCard className="bg-gradient-to-br from-primary/10 to-secondary/10 shadow">
        <p className="text-sm text-base-content/70">{t('common.loading')}</p>
      </DataCard>
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
    <DataCard className="bg-gradient-to-br from-primary/10 to-secondary/10 shadow">
      <h3 className="font-bold text-lg mb-4">{t('dj_control.stats.title_with_emoji')}</h3>

      <div className="space-y-3">
        {/* Total Songs */}
        <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
          <span className="text-sm font-medium">{t('dj_control.stats.total_songs')}</span>
          <Badge tone="neutral" size="lg">{totalSongs}</Badge>
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

          {localError && (
            <ErrorState
              title={t('dj_control.errors.action_failed')}
              description={localError}
              action={{ label: t('common.dismiss'), onClick: () => setLocalError(null), variant: 'quiet' }}
            />
          )}

          <div className="space-y-2">
            <div className="flex gap-2">
              <Action
                onClick={() => { void handleAction(onStart) }}
                variant="primary"
                state={isStartDisabled ? 'disabled' : 'idle'}
                className="flex-1"
                aria-label={t('dj_control.actions.start_tooltip')}
              >
                <Action.Label>{t('dj_control.actions.start')}</Action.Label>
              </Action>
              <Action
                onClick={() => { void handleAction(onStop!) }}
                variant="destructive"
                state={isStopDisabled ? 'disabled' : 'idle'}
                className="flex-1"
                aria-label={t('dj_control.actions.stop_tooltip')}
              >
                <Action.Label>{t('dj_control.actions.stop')}</Action.Label>
              </Action>
            </div>

            <div className="flex gap-2">
              <Action
                onClick={() => { void handleAction(onPrevious!) }}
                variant="secondary"
                state={isPreviousDisabled ? 'disabled' : 'idle'}
                className="flex-1"
                aria-label={t('dj_control.actions.previous_tooltip')}
              >
                <Action.Label>{t('dj_control.actions.previous')}</Action.Label>
              </Action>
              <Action
                onClick={() => { void handleAction(onNext!) }}
                variant="primary"
                state={isNextDisabled ? 'disabled' : 'idle'}
                className="flex-1"
                aria-label={t('dj_control.actions.next_tooltip')}
              >
                <Action.Label>{t('dj_control.actions.next')}</Action.Label>
              </Action>
            </div>
          </div>

          {jamId && (
            <Action
              onClick={() => navigate(`/host/jams/${jamId}/manage`)}
              variant="secondary"
              className="w-full mt-2"
            >
              <Action.Label className="hidden sm:inline">{t('dj_control.actions.add_songs')}</Action.Label>
              <Action.Label className="sm:hidden">{t('dj_control.actions.add_songs_short')}</Action.Label>
            </Action>
          )}
        </>
      )}
    </DataCard>
  )
}
