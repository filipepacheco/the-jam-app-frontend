import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import type { PlaybackState } from '../../types/api.types.ts'
import { Action, type ActionVariant } from '../Action'
import { ErrorState } from '../FeedbackStates'

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

  // Center button config based on state.
  // The canonical Action family exposes primary/secondary/quiet/destructive only,
  // so the legacy success (start/resume) and warning (pause) tones both collapse
  // onto the closest available semantic variant. This is a forced, documented
  // color change, not an intentional redesign.
  const centerButton = isPlaying
    ? { action: onPause, label: t('dj_control.actions.pause', 'Pausar'), Icon: Pause, variant: 'secondary' as ActionVariant }
    : isPaused
      ? { action: onResume, label: t('dj_control.actions.resume', 'Retomar'), Icon: Play, variant: 'primary' as ActionVariant }
      : { action: onStart, label: t('dj_control.actions.start', 'Iniciar'), Icon: Play, variant: 'primary' as ActionVariant }

  const centerDisabled = busy || (isStopped && !hasNextSong)
  const prevDisabled = busy || !hasCurrentSong
  const nextDisabled = busy || !hasCurrentSong || !hasNextSong

  return (
    <div className="space-y-2">
      {error && (
        <ErrorState
          title={t('dj_control.errors.action_failed')}
          description={error}
          action={{ label: t('common.dismiss'), onClick: () => setError(null), variant: 'quiet' }}
        />
      )}

      {/* Transport row */}
      <div className="flex items-center gap-2">
        <Action
          onClick={() => { void handleAction(onPrevious) }}
          variant="secondary"
          state={prevDisabled ? 'disabled' : 'idle'}
          className="flex-1"
          aria-label={t('dj_control.actions.previous_tooltip', 'Anterior')}
        >
          <Action.Icon><SkipBack className="size-4" /></Action.Icon>
          <Action.Label className="hidden sm:inline">{t('dj_control.actions.previous', 'Anterior')}</Action.Label>
        </Action>

        <Action
          onClick={() => { void handleAction(centerButton.action) }}
          variant={centerButton.variant}
          state={centerDisabled ? 'disabled' : 'idle'}
          className="flex-[2]"
        >
          <Action.Icon><centerButton.Icon className="size-5" /></Action.Icon>
          <Action.Label>{centerButton.label}</Action.Label>
        </Action>

        <Action
          onClick={() => { void handleAction(onNext) }}
          variant="primary"
          state={nextDisabled ? 'disabled' : 'idle'}
          className="flex-1"
          aria-label={t('dj_control.actions.next_tooltip', 'Proxima')}
        >
          <Action.Label className="hidden sm:inline">{t('dj_control.actions.next', 'Proxima')}</Action.Label>
          <Action.Icon><SkipForward className="size-4" /></Action.Icon>
        </Action>
      </div>

      {/* Stop button - hidden for now */}
    </div>
  )
}
