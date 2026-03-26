/**
 * DJ Control Tab V2 - Mobile-first rework
 * Layout: NowPlayingBar -> PlaybackControls -> CompactStats -> Timeline
 */

import { useTranslation } from 'react-i18next'
import { useMemo, useState } from 'react'
import { useJamControl } from '../../hooks'
import { Alert } from '../../components'
import { NowPlayingBar } from '../../components/dj-control/NowPlayingBar'
import { PlaybackControls } from '../../components/dj-control/PlaybackControls'
import { CompactStats } from '../../components/dj-control/CompactStats'
import { SongQueueTimeline } from '../../components/dj-control'
import { scheduleService } from '../../services'
import { formatError } from '../../lib/api/errorHandler'

interface DJControlTabV2Props {
  jamId: string
  onReload?: () => void
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

  const handleRefresh = async () => {
    await refresh()
    onReload?.()
  }

  const handleApproveSong = async (scheduleId: string) => {
    setActionLoading(true)
    setActionError(null)
    try {
      await scheduleService.update(scheduleId, { status: 'SCHEDULED' })
      setSuccess(t('dj_control.song_approved'))
      await handleRefresh()
    } catch (err) {
      setActionError(formatError(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveSong = async (scheduleId: string) => {
    if (!confirm(t('dj_control.confirm_remove'))) return
    setActionLoading(true)
    setActionError(null)
    try {
      await scheduleService.remove(scheduleId)
      setSuccess(t('dj_control.song_removed'))
      await handleRefresh()
    } catch (err) {
      setActionError(formatError(err))
    } finally {
      setActionLoading(false)
    }
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

  const timelineContent = isLoading && !liveState ? (
    <div className="text-center py-8">
      <p className="text-sm text-base-content/70">{t('common.loading')}</p>
      <progress className="progress progress-primary w-48 mt-2" />
    </div>
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

  const controlBlock = liveState ? (
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
        onStart={start}
        onStop={stop}
        onNext={next}
        onPrevious={previous}
        onPause={pause}
        onResume={resume}
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
