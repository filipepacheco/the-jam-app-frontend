/**
 * DJ Control Tab V2 - Mobile-first rework
 * Layout: NowPlayingBar -> PlaybackControls -> CompactStats -> Timeline
 */

import { useTranslation } from 'react-i18next'
import { useMemo, useState } from 'react'
import { useJamControl } from '../../hooks'
import { Alert } from '../../components'
import { NowPlayingBar } from '../../components/dj-control'
import { PlaybackControls } from '../../components/dj-control'
import { CompactStats } from '../../components/dj-control'
import { SongQueueTimeline } from '../../components'
import { scheduleService } from '../../services'
import { formatError } from '../../lib/api'

interface DJControlTabV2Props {
  jamId: string
  onReload?: () => void | Promise<unknown>
}

export function DJControlTabV2({ jamId, onReload }: DJControlTabV2Props) {
  const { t } = useTranslation()
  const [actionLoading, setActionLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { liveState, isLoading, error, start, stop, next, previous, pause, resume, refresh } =
    useJamControl(jamId, {
      autoRefreshEnabled: true,
      autoRefreshInterval: 5000,
    })

  const handleRefresh = async (refreshLiveState: boolean) => {
    // Playback commands already revalidate live state in useJamControl.
    if (refreshLiveState) await refresh()
    await onReload?.()
  }

  const executeAction = async (action: () => Promise<unknown>, successMsg: string, refreshLiveState = false) => {
    setActionLoading(true)
    setActionError(null)
    setSuccess(null)
    try {
      const result = await action()
      if (result && typeof result === 'object' && 'success' in result && result.success === false) {
        const message = 'error' in result && typeof result.error === 'string'
          ? result.error
          : t('dj_control.errors.action_failed')
        throw new Error(message)
      }
      await handleRefresh(refreshLiveState)
      setSuccess(successMsg)
    } catch (err) {
      setActionError(formatError(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleApproveSong = async (scheduleId: string) => {
    await executeAction(() => scheduleService.update(scheduleId, { status: 'SCHEDULED' }), t('dj_control.song_approved'), true)
  }

  const handleRemoveSong = async (scheduleId: string) => {
    if (!confirm(t('dj_control.confirm_remove'))) return
    await executeAction(() => scheduleService.remove(scheduleId), t('dj_control.song_removed'), true)
  }

  // Derived stats
  const { totalCount, remainingDuration } = useMemo(() => {
    if (!liveState) return { totalCount: 0, remainingDuration: 0 }
    const { previousSongs, currentSong, nextSongs } = liveState
    const total = previousSongs.length + (currentSong ? 1 : 0) + nextSongs.length
    const remaining =
      (currentSong?.music.duration || 0) +
      nextSongs.reduce((acc, s) => acc + (s.music.duration || 0), 0)
    return { totalCount: total, remainingDuration: remaining }
  }, [liveState])

  const skeletonTimeline = (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-base-200 rounded-lg p-3 space-y-2">
          <div className="skeleton h-5 w-2/3 rounded" />
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="flex gap-2">
            <div className="skeleton h-5 w-16 rounded-full" />
            <div className="skeleton h-5 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )

  const skeletonControls = (
    <div className="space-y-3 animate-pulse">
      {/* Now playing bar skeleton */}
      <div className="bg-base-200 rounded-lg p-3 space-y-2">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-6 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
      </div>
      {/* Playback controls skeleton */}
      <div className="bg-base-200 rounded-lg p-3 flex justify-center gap-3">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="skeleton h-10 w-10 rounded-full" />
      </div>
      {/* Compact stats skeleton */}
      <div className="bg-base-200 rounded-lg p-3 flex justify-between">
        <div className="skeleton h-4 w-16 rounded" />
        <div className="skeleton h-4 w-16 rounded" />
        <div className="skeleton h-4 w-16 rounded" />
      </div>
    </div>
  )

  const timelineContent = isLoading && !liveState ? (
    skeletonTimeline
  ) : liveState ? (
    <SongQueueTimeline
      liveState={liveState}
      suggestedSongs={liveState.suggestedSongs}
      onRemoveSong={handleRemoveSong}
      onApproveSong={handleApproveSong}
      loading={isLoading || actionLoading}
    />
  ) : (
    <Alert
      type="error"
      message={t('dj_control.errors.failed_to_load')}
      onDismiss={() => {}}
    />
  )

  const controlBlock = isLoading && !liveState ? (
    skeletonControls
  ) : liveState ? (
    <>
      <NowPlayingBar
        currentSong={liveState.currentSong}
        playbackState={liveState.playbackState}
        nextSong={liveState.nextSongs[0] ?? null}
      />
      <PlaybackControls
        playbackState={liveState.playbackState}
        hasCurrentSong={!!liveState.currentSong}
        hasNextSong={liveState.nextSongs.length > 0}
        isLoading={isLoading}
        onStart={() => executeAction(start, t('live_control.song_playing_feedback'))}
        onStop={() => executeAction(stop, t('dj_control.now_playing.stopped'))}
        onNext={() => executeAction(next, t('live_control.skipped_feedback'))}
        onPrevious={() => executeAction(previous, t('dj_control.actions.previous'))}
        onPause={() => executeAction(pause, t('live_control.song_paused_feedback'))}
        onResume={() => executeAction(resume, t('live_control.song_playing_feedback'))}
      />
      <CompactStats
        completedCount={liveState.previousSongs.length}
        totalCount={totalCount}
        remainingDuration={remainingDuration}
      />
    </>
  ) : null

  return (
    <div className="space-y-3">
      {error && <Alert type="error" message={error} onDismiss={() => {}} />}
      {actionError && <Alert type="error" message={actionError} onDismiss={() => setActionError(null)} />}
      {success && <Alert type="success" message={success} onDismiss={() => setSuccess(null)} />}

      {/* Mobile: controls on top, timeline below */}
      <div className="lg:hidden space-y-3">
        {controlBlock}
        {timelineContent}
      </div>

      {/* Desktop: timeline left, controls right */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 min-w-0">
          {timelineContent}
        </div>
        <div className="lg:col-span-1 space-y-3">
          {controlBlock}
        </div>
      </div>
    </div>
  )
}
