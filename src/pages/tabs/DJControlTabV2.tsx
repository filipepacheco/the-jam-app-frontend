/**
 * DJ Control Tab Component V2
 * Controls at top for easy access, timeline below
 */

import {useTranslation} from 'react-i18next'
import {useState} from 'react'
import {useJamControl} from '../../hooks'
import {Alert} from '../../components'
import {DJControlActions, QueueStats, SongQueueTimeline,} from '../../components/dj-control'
import {scheduleService} from '../../services'

interface DJControlTabV2Props {
  jamId: string
  onReload?: () => void
}

/**
 * DJ Control Tab V2
 * Controls at top for better UX on mobile
 */
export function DJControlTabV2({ jamId, onReload }: DJControlTabV2Props) {
  const { t } = useTranslation()
  const [actionLoading, setActionLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  // Use the custom hook for jam control (live state)
  const { liveState, isLoading, error, start, stop, resume, pause, next, previous, refresh } =
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
    try {
      await scheduleService.update(scheduleId, { status: 'SCHEDULED' })
      setSuccess(t('dj_control.song_approved'))
      await handleRefresh()
    } catch (err) {
      console.error('Failed to approve song:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveSong = async (scheduleId: string) => {
    if (!confirm(t('dj_control.confirm_remove'))) return
    setActionLoading(true)
    try {
      await scheduleService.remove(scheduleId)
      setSuccess(t('dj_control.song_removed'))
      await handleRefresh()
    } catch (err) {
      console.error('Failed to remove song:', err)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t('dj_control.title_with_emoji')}</h2>

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          message={error}
          onDismiss={() => {
            /* Error is auto-cleared on next state update */
          }}
        />
      )}

      {/* Success Alert */}
      {success && <Alert type="success" message={success} onDismiss={() => setSuccess(null)} />}

      {/* Mobile Layout: Actions and Stats at top */}
      <div className="lg:hidden space-y-4">
        {/* Controls */}
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-3 sm:p-4">
            <DJControlActions
              jamId={jamId}
              liveState={liveState}
              isLoading={isLoading}
              error={error}
              onStart={start}
              onStop={stop}
              onResume={resume}
              onPause={pause}
              onNext={next}
              onPrevious={previous}
              onRefresh={handleRefresh}
              onError={() => {
                /* Error is handled by hook */
              }}
            />
          </div>
        </div>

        {/* Queue Stats */}
        <QueueStats liveState={liveState} />

        {/* Timeline */}
        {isLoading && !liveState ? (
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
        )}
      </div>

      {/* Desktop Layout: Timeline left, Actions+Stats right */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4">
        {/* Timeline - Main Content */}
        <div className="lg:col-span-3 min-w-0">
          {isLoading && !liveState ? (
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
          )}
        </div>

        {/* Sidebar - Actions + Stats */}
        <div className="lg:col-span-1 space-y-4">
          {/* Controls */}
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-3 sm:p-4">
              <DJControlActions
                jamId={jamId}
                liveState={liveState}
                isLoading={isLoading}
                error={error}
                onStart={start}
                onStop={stop}
                onResume={resume}
                onPause={pause}
                onNext={next}
                onPrevious={previous}
                onRefresh={handleRefresh}
                onError={() => {
                  /* Error is handled by hook */
                }}
              />
            </div>
          </div>

          {/* Queue Stats */}
          <QueueStats liveState={liveState} />
        </div>
      </div>
    </div>
  )
}
