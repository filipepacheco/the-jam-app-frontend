/**
 * DJ Control Page
 * Dedicated page for managing music order and controlling song progression
 * Route: /host/jams/:id/dj-control
 *
 * Updated to use new useJamControl hook and LiveStateResponseDto
 */

import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useAuth, useJamControl} from '../../hooks'
import {scheduleService} from '../../services'
import {Alert} from '../../components'
import {DJControlActions, QueueStats, SongQueueTimeline} from '../../components/dj-control'
import {useTranslation} from 'react-i18next'

export function JamDJControlPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id: jamId } = useParams<{ id: string }>()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [actionLoading, setActionLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Use the new jam control hook with auto-refresh
  const { liveState, isLoading, error, start, stop, resume, pause, next, previous, refresh } =
    useJamControl(jamId || '', {
      autoRefreshEnabled: true,
      autoRefreshInterval: 5000, // 5 seconds
    })

  // Auth check
  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, authLoading, navigate])

  const handleRefresh = async () => {
    await refresh()
  }

  const handleRemoveSong = async (scheduleId: string) => {
    if (!confirm(t('dj_control.confirm_remove'))) return
    setActionLoading(true)
    setLocalError(null)
    try {
      await scheduleService.remove(scheduleId)
      setSuccess(t('dj_control.song_removed'))
      await handleRefresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('common.error')
      setLocalError(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApproveSong = async (scheduleId: string) => {
    setActionLoading(true)
    setLocalError(null)
    try {
      await scheduleService.update(scheduleId, { status: 'SCHEDULED' })
      setSuccess(t('dj_control.song_approved'))
      await handleRefresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('common.error')
      setLocalError(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const displayError = localError || error

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="text-sm font-semibold text-base-content/70">{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  if (!jamId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <Alert type="error" message={t('common.error')} onDismiss={() => navigate('/host/dashboard')} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300">
        <div className="container mx-auto max-w-6xl px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{t('dj_control.title_with_emoji')}</h1>
              <p className="text-xs sm:text-sm text-base-content/70 mt-1">{t('dj_control.subtitle')}</p>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="text-xs sm:text-sm breadcrumbs overflow-x-auto">
            <ul>
              <li>
                <button onClick={() => navigate('/host/dashboard')} className="link link-hover">
                  {t('common.dashboard')}
                </button>
              </li>
              <li className="truncate">{liveState ? liveState.jamStatus : '...'}</li>
              <li className="whitespace-nowrap">{t('dj_control.title')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="container sticky top-0 z-40 mx-auto max-w-6xl px-2 sm:px-4 mt-2 sm:mt-4">
        {displayError && <Alert type="error" message={displayError} onDismiss={() => setLocalError(null)} />}
        {success && <Alert type="success" message={success} onDismiss={() => setSuccess(null)} />}
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-2 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Timeline - appears last on mobile, first on desktop */}
          <div className="lg:col-span-3 min-w-0 order-2 lg:order-1">
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

          {/* Sidebar - appears first on mobile, last on desktop */}
          <div className="lg:col-span-1 space-y-4 order-1 lg:order-2">
            {/* Queue Stats */}
            <QueueStats liveState={liveState} />

            {/* Controls */}
            <DJControlActions
              jamId={jamId}
              liveState={liveState}
              isLoading={isLoading}
              error={displayError}
              onStart={start}
              onStop={stop}
              onResume={resume}
              onPause={pause}
              onNext={next}
              onPrevious={previous}
              onRefresh={handleRefresh}
              onError={(err) => setLocalError(err)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default JamDJControlPage
