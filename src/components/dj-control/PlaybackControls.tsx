import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, Square, SkipBack, SkipForward } from 'lucide-react'
import type { PlaybackState } from '../../types/jamControl.types'
import { Alert } from '../Alert'

interface PlaybackControlsProps {
  playbackState: PlaybackState
  hasCurrentSong: boolean
  hasNextSong: boolean
  isLoading: boolean
  onStart: () => Promise<void>
  onStop: () => Promise<void>
  onNext: () => Promise<void>
  onPrevious: () => Promise<void>
  onPause: () => Promise<void>
  onResume: () => Promise<void>
}

export function PlaybackControls({
  playbackState,
  hasCurrentSong,
  hasNextSong,
  isLoading,
  onStart,
  onStop,
  onNext,
  onPrevious,
  onPause,
  onResume,
}: PlaybackControlsProps) {
  const { t } = useTranslation()
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const busy = isLoading || actionLoading

  const handleAction = useCallback(async (action: () => Promise<void>) => {
    setActionLoading(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dj_control.errors.action_failed'))
    } finally {
      setActionLoading(false)
    }
  }, [t])

  const isStopped = playbackState === 'STOPPED'
  const isPlaying = playbackState === 'PLAYING'
  const isPaused = playbackState === 'PAUSED'

  // Center button config based on state
  const centerButton = isPlaying
    ? { action: onPause, label: t('dj_control.actions.pause', 'Pausar'), Icon: Pause, className: 'btn-warning' }
    : isPaused
      ? { action: onResume, label: t('dj_control.actions.resume', 'Retomar'), Icon: Play, className: 'btn-success' }
      : { action: onStart, label: t('dj_control.actions.start', 'Iniciar'), Icon: Play, className: 'btn-success' }

  const centerDisabled = busy || (isStopped && !hasNextSong)
  const prevDisabled = busy || !hasCurrentSong
  const nextDisabled = busy || !hasCurrentSong || !hasNextSong

  return (
    <div className="space-y-2">
      <Alert type="error" message={error} onDismiss={() => setError(null)} className="alert-sm" />

      {/* Transport row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { void handleAction(onPrevious) }}
          className="btn btn-sm btn-secondary flex-1"
          disabled={prevDisabled}
          title={t('dj_control.actions.previous_tooltip', 'Anterior')}
        >
          <SkipBack className="size-4" />
          <span className="hidden sm:inline">{t('dj_control.actions.previous', 'Anterior')}</span>
        </button>

        <button
          onClick={() => { void handleAction(centerButton.action) }}
          className={`btn btn-md ${centerButton.className} flex-[2]`}
          disabled={centerDisabled}
        >
          <centerButton.Icon className="size-5" />
          {centerButton.label}
        </button>

        <button
          onClick={() => { void handleAction(onNext) }}
          className="btn btn-sm btn-primary flex-1"
          disabled={nextDisabled}
          title={t('dj_control.actions.next_tooltip', 'Proxima')}
        >
          <span className="hidden sm:inline">{t('dj_control.actions.next', 'Proxima')}</span>
          <SkipForward className="size-4" />
        </button>
      </div>

      {/* Stop button */}
      {!isStopped && (
        <div className="flex items-center">
          <button
            onClick={() => { void handleAction(onStop) }}
            className="btn btn-xs btn-ghost text-error gap-1"
            disabled={busy}
            title={t('dj_control.actions.stop_tooltip', 'Parar')}
          >
            <Square className="size-3" />
            {t('dj_control.actions.stop', 'Parar')}
          </button>
        </div>
      )}
    </div>
  )
}
