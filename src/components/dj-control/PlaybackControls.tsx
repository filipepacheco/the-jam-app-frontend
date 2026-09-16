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
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const busy = isLoading || actionLoading !== null

  const handleAction = useCallback(async (action: () => Promise<void>, actionId: string) => {
    setActionLoading(actionId)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dj_control.errors.action_failed'))
    } finally {
      setActionLoading(null)
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
    ? { action: onPause, label: t('dj_control.actions.pause'), Icon: Pause, variant: 'secondary' as ActionVariant }
    : isPaused
      ? { action: onResume, label: t('dj_control.actions.resume'), Icon: Play, variant: 'primary' as ActionVariant }
      : { action: onStart, label: t('dj_control.actions.start'), Icon: Play, variant: 'primary' as ActionVariant }

  const centerDisabled = busy || (isStopped && !hasNextSong)
  const prevDisabled = busy || !hasCurrentSong
  const nextDisabled = busy || !hasCurrentSong || !hasNextSong
  const actionState = (actionId: string, disabled: boolean) => {
    if (actionLoading === actionId) {
      return { state: 'loading' as const, loadingLabel: t('dj_control.actions.updating') }
    }
    return { state: disabled ? 'disabled' as const : 'idle' as const }
  }

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
      <div className="grid w-full grid-cols-3 items-center gap-2 overflow-hidden [&>.ds-action]:w-full">
        <Action
          onClick={() => { void handleAction(onPrevious, 'previous') }}
          variant="secondary"
          {...actionState('previous', prevDisabled)}
          className="min-w-0 justify-center overflow-hidden px-2"
          aria-label={t('dj_control.actions.previous_tooltip')}
        >
          <Action.Icon><SkipBack className="size-4" /></Action.Icon>
          <Action.Label className="hidden sm:inline lg:hidden 2xl:inline">{t('dj_control.actions.previous')}</Action.Label>
        </Action>

        <Action
          onClick={() => { void handleAction(centerButton.action, 'center') }}
          variant={centerButton.variant}
          {...actionState('center', centerDisabled)}
          className="min-w-0 justify-center overflow-hidden px-2"
        >
          <Action.Icon><centerButton.Icon className="size-5" /></Action.Icon>
          <Action.Label>{centerButton.label}</Action.Label>
        </Action>

        <Action
          onClick={() => { void handleAction(onNext, 'next') }}
          variant="primary"
          {...actionState('next', nextDisabled)}
          className="min-w-0 justify-center overflow-hidden px-2"
          aria-label={t('dj_control.actions.next_tooltip')}
        >
          <Action.Label className="hidden sm:inline lg:hidden 2xl:inline">{t('dj_control.actions.next')}</Action.Label>
          <Action.Icon><SkipForward className="size-4" /></Action.Icon>
        </Action>
      </div>

      {/* Stop button - hidden for now */}
    </div>
  )
}
