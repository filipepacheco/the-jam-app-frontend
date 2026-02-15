/**
 * DJ Control Tab Component V2
 * Stats + controls in sidebar, timeline below (mobile) or beside (desktop)
 */

import {useTranslation} from 'react-i18next'
import {useState} from 'react'
import {useJamControl} from '../../hooks'
import {Alert} from '../../components'
import {QueueStats, SongQueueTimeline} from '../../components/dj-control'
import {scheduleService} from '../../services'
import {formatError} from '../../lib/api/errorHandler'

interface DJControlTabV2Props {
  jamId: string
  onReload?: () => void
}

/**
 * DJ Control Tab V2
 * Stats card includes control buttons at the bottom
 */
export function DJControlTabV2({ jamId, onReload }: DJControlTabV2Props) {
  const { t } = useTranslation()
  const [actionLoading, setActionLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Use the custom hook for jam control (live state)
  const { liveState, isLoading, error, start, stop, next, previous, refresh } =
    useJamControl(jamId, {
      autoRefreshEnabled: true,
      autoRefreshInterval: 5000, // 5 seconds
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

  const timelineContent = isLoading && !liveState ? (
    <div className="card bg-base-200 shadow">
      <div className="card-body text-center">
        <p className="text-sm text-base-content/70">{t('common.loading')}</p>
        <progress className="progress progress-primary w-full mt-2"></progress>
      </div>
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

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t('dj_control.title_with_emoji')}</h2>

      {error && (
        <Alert type="error" message={error} onDismiss={() => {}} />
      )}
      {actionError && <Alert type="error" message={actionError} onDismiss={() => setActionError(null)} />}
      {success && <Alert type="success" message={success} onDismiss={() => setSuccess(null)} />}

      {/* Mobile Layout: Stats+Controls at top, timeline below */}
      <div className="lg:hidden space-y-4">
        <QueueStats
          liveState={liveState}
          jamId={jamId}
          isLoading={isLoading}
          onStart={start}
          onStop={stop}
          onNext={next}
          onPrevious={previous}
        />
        {timelineContent}
      </div>

      {/* Desktop Layout: Timeline left, Stats+Controls right */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 min-w-0">
          {timelineContent}
        </div>
        <div className="lg:col-span-1">
          <QueueStats
            liveState={liveState}
            jamId={jamId}
            isLoading={isLoading}
            onStart={start}
            onStop={stop}
            onNext={next}
            onPrevious={previous}
          />
        </div>
      </div>
    </div>
  )
}
