/**
 * DJ Control Actions Component V2
 * Control panel for jam playback using new /control endpoints
 * Provides play, pause, skip, and refresh buttons
 */

import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import type {LiveStateResponseDto} from '../../types/jamControl.types'

interface DJControlActionsProps {
  jamId: string
  liveState: LiveStateResponseDto | null
  isLoading: boolean
  error: string | null
  onStart: () => Promise<void>
  onStop: () => Promise<void>
  onResume: () => Promise<void>
  onPause: () => Promise<void>
  onNext: () => Promise<void>
  onPrevious: () => Promise<void>
  onRefresh: () => Promise<void>
  onError?: (error: string) => void
}

export function DJControlActions({
  jamId,
  liveState,
  isLoading,
  error,
  onStart,
  onStop,
  onResume,
  onPause,
  onNext,
  onPrevious,
  onRefresh,
  onError,
}: DJControlActionsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [actionLoading, setActionLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const displayError = localError || error

  // Determine if buttons should be enabled
  const isStopped = liveState?.playbackState === 'STOPPED'
  const isPlaying = liveState?.playbackState === 'PLAYING'
  const isPaused = liveState?.playbackState === 'PAUSED'
  const hasCurrentSong = !!liveState?.currentSong
  const hasNextSong = (liveState?.nextSongs?.length || 0) > 0

  // Button state logic
  const isStartDisabled = isLoading || actionLoading || !isStopped || !hasNextSong
  const isStopDisabled = isLoading || actionLoading || isStopped
  const isResumeDisabled = isLoading || actionLoading || !isPaused || !hasCurrentSong
  const isPauseDisabled = isLoading || actionLoading || !isPlaying || !hasCurrentSong
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
    <div className="space-y-3">
      <h3 className="font-bold text-base sm:text-lg">
        {t('dj_control.actions.title_with_emoji')}
      </h3>

        {/* Error Alert */}
        {displayError && (
          <div className="alert alert-error alert-sm">
            <span>{displayError}</span>
            <button
              onClick={() => setLocalError(null)}
              className="btn btn-xs btn-ghost"
            >
              ✕
            </button>
          </div>
        )}

        {/* Playback State Display */}
        {liveState && (
          <div className="text-xs text-base-content/70 space-y-1">
            <div>
              <span className="font-semibold">{t('dj_control.actions.status')}:</span>
              <span className="ml-2 badge badge-outline">
                {liveState.playbackState === 'PLAYING' && '▶️ Playing'}
                {liveState.playbackState === 'PAUSED' && '⏸️ Paused'}
                {liveState.playbackState === 'STOPPED' && '⏹️ Stopped'}
              </span>
            </div>
          </div>
        )}

        {/* Refresh button */}
        <button
          onClick={() => { void handleAction(onRefresh) }}
          className="btn btn-ghost btn-xs sm:btn-sm w-full"
          title={t('dj_control.actions.refresh_data')}
          disabled={isLoading || actionLoading}
        >
          🔄 {isLoading || actionLoading ? t('dj_control.actions.updating') : t('dj_control.actions.refresh')}
        </button>

        {/* Playback Control Buttons */}
        <div className="space-y-2">
          {/* Start/Stop buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => { void handleAction(onStart) }}
              className="btn btn-success btn-xs sm:btn-sm flex-1"
              disabled={isStartDisabled}
              title={t('dj_control.actions.start_tooltip')}
            >
              ▶️ {t('dj_control.actions.start')}
            </button>
            <button
              onClick={() => { void handleAction(onStop) }}
              className="btn btn-error btn-xs sm:btn-sm flex-1"
              disabled={isStopDisabled}
              title={t('dj_control.actions.stop_tooltip')}
            >
              ⏹️ {t('dj_control.actions.stop')}
            </button>
          </div>

          {/* Resume/Pause buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => { void handleAction(onResume) }}
              className="btn btn-info btn-xs sm:btn-sm flex-1"
              disabled={isResumeDisabled}
              title={t('dj_control.actions.resume_tooltip')}
            >
              ▶️ {t('dj_control.actions.resume')}
            </button>
            <button
              onClick={() => { void handleAction(onPause) }}
              className="btn btn-warning btn-xs sm:btn-sm flex-1"
              disabled={isPauseDisabled}
              title={t('dj_control.actions.pause_tooltip')}
            >
              ⏸️ {t('dj_control.actions.pause')}
            </button>
          </div>

          {/* Previous/Next buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => { void handleAction(onPrevious) }}
              className="btn btn-secondary btn-xs sm:btn-sm flex-1"
              disabled={isPreviousDisabled}
              title={t('dj_control.actions.previous_tooltip')}
            >
              <span className="hidden sm:inline">⏮️ {t('dj_control.actions.previous')}</span>
              <span className="sm:hidden">⏮️</span>
            </button>
            <button
              onClick={() => { void handleAction(onNext) }}
              className="btn btn-primary btn-xs sm:btn-sm flex-1"
              disabled={isNextDisabled}
              title={t('dj_control.actions.next_tooltip')}
            >
              <span className="hidden sm:inline">⏭️ {t('dj_control.actions.next')}</span>
              <span className="sm:hidden">⏭️</span>
            </button>
          </div>
        </div>

        {/* Add Songs button */}
        <button
          onClick={() => navigate(`/host/jams/${jamId}/manage`)}
          className="btn btn-secondary btn-xs sm:btn-sm w-full"
        >
          ➕{' '}
          <span className="hidden sm:inline">{t('dj_control.actions.add_songs')}</span>
          <span className="sm:hidden">{t('dj_control.actions.add_songs_short')}</span>
        </button>
    </div>
  )
}
