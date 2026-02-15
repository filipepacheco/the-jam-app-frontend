/**
 * DJ Control Actions Component V2
 * Control panel for jam playback using new /control endpoints
 * Provides play, stop, skip buttons
 */

import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import type {LiveStateResponseDto} from '../../types/jamControl.types'
import {Alert} from '../Alert'

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
  const hasCurrentSong = !!liveState?.currentSong
  const hasNextSong = (liveState?.nextSongs?.length || 0) > 0

  // Button state logic
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
    <div className="space-y-3">
      <h3 className="font-bold text-base sm:text-lg">
        {t('dj_control.actions.title_with_emoji')}
      </h3>

        {/* Error Alert */}
        <Alert type="error" message={displayError} onDismiss={() => setLocalError(null)} className="alert-sm" />

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
              {t('dj_control.actions.start')}
            </button>
            <button
              onClick={() => { void handleAction(onStop) }}
              className="btn btn-error btn-xs sm:btn-sm flex-1"
              disabled={isStopDisabled}
              title={t('dj_control.actions.stop_tooltip')}
            >
              {t('dj_control.actions.stop')}
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
              <span className="hidden sm:inline">{t('dj_control.actions.previous')}</span>
              <span className="sm:hidden">&#x23EE;&#xFE0F;</span>
            </button>
            <button
              onClick={() => { void handleAction(onNext) }}
              className="btn btn-primary btn-xs sm:btn-sm flex-1"
              disabled={isNextDisabled}
              title={t('dj_control.actions.next_tooltip')}
            >
              <span className="hidden sm:inline">{t('dj_control.actions.next')}</span>
              <span className="sm:hidden">&#x23ED;&#xFE0F;</span>
            </button>
          </div>
        </div>

        {/* Add Songs button */}
        <button
          onClick={() => navigate(`/host/jams/${jamId}/manage`)}
          className="btn btn-secondary btn-xs sm:btn-sm w-full"
        >
          <span className="hidden sm:inline">{t('dj_control.actions.add_songs')}</span>
          <span className="sm:hidden">{t('dj_control.actions.add_songs_short')}</span>
        </button>
    </div>
  )
}
