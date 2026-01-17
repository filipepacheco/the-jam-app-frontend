/**
 * DJ Control Actions Component
 * Reusable actions section with Previous, Next, Refresh, Add Songs buttons and Auto Refresh control
 */

import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import type {ScheduleResponseDto} from '../../types/api.types'
import {scheduleService} from '../../services'
import {useTranslation} from 'react-i18next'

interface DJControlActionsProps {
  jamId: string
  schedules: ScheduleResponseDto[]
  onReload: () => void
  loading: boolean
  onAutoRefreshChange?: (interval: number) => void
  autoRefreshInterval?: number
  onError?: (error: string) => void
}

export function DJControlActions({
  jamId,
  schedules,
  onReload,
  loading,
  onAutoRefreshChange,
  autoRefreshInterval = 0,
  onError,
}: DJControlActionsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const handleAutoPlayNext = async () => {
    setActionLoading(true)
    setError(null)
    try {
      // Get current song
      const current = schedules.find(s => s.status === 'IN_PROGRESS')
      const next = schedules.find(
        s => s.status === 'SCHEDULED' && (!current || s.order > current.order)
      )

      if (!current) {
        const errorMsg = t('dj_control.errors.no_current_song')
        setError(errorMsg)
        onError?.(errorMsg)
        return
      }

      if (!next) {
        const errorMsg = t('dj_control.errors.no_next_song')
        setError(errorMsg)
        onError?.(errorMsg)
        return
      }

      // Complete current and start next
      await scheduleService.update(current.id, { status: 'COMPLETED' })
      await scheduleService.update(next.id, { status: 'IN_PROGRESS' })
      onReload()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('dj_control.errors.next_failed')
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAutoPlayPrevious = async () => {
    setActionLoading(true)
    setError(null)
    try {
      // Get current song
      const current = schedules.find(s => s.status === 'IN_PROGRESS')
      // Get previous completed song (most recent one)
      const previous = [...schedules]
        .reverse()
        .find(s => s.status === 'COMPLETED' && (!current || s.order < current.order))

      if (!current) {
        const errorMsg = t('dj_control.errors.no_current_song')
        setError(errorMsg)
        onError?.(errorMsg)
        return
      }

      if (!previous) {
        const errorMsg = t('dj_control.errors.no_previous_song')
        setError(errorMsg)
        onError?.(errorMsg)
        return
      }

      // Mark current as scheduled again and start previous
      await scheduleService.update(current.id, { status: 'SCHEDULED' })
      await scheduleService.update(previous.id, { status: 'IN_PROGRESS' })
      onReload()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('dj_control.errors.previous_failed')
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefreshIntervalChange = (value: number) => {
    onAutoRefreshChange?.(value)
  }

  // Check if Next/Previous buttons should be enabled
  const current = schedules.find(s => s.status === 'IN_PROGRESS')
  const hasNextSong = schedules.some(
    s => s.status === 'SCHEDULED' && (!current || s.order > current.order)
  )
  const hasPreviousSong = schedules.some(
    s => s.status === 'COMPLETED' && (!current || s.order < current.order)
  )

  const isNextDisabled = loading || actionLoading || !current || !hasNextSong
  const isPreviousDisabled = loading || actionLoading || !current || !hasPreviousSong

  return (
    <div className="card bg-base-200 shadow">
      <div className="card-body p-3 sm:p-6 space-y-3">
        <h3 className="font-bold text-base sm:text-lg">{t('dj_control.actions.title_with_emoji')}</h3>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error alert-sm">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="btn btn-xs btn-ghost">✕</button>
          </div>
        )}

        {/* Refresh button */}
        <button
          onClick={() => onReload()}
          className="btn btn-ghost btn-xs sm:btn-sm w-full"
          title={t('dj_control.actions.refresh_data')}
          disabled={loading || actionLoading}
        >
          🔄 {loading ? t('dj_control.actions.updating') : t('dj_control.actions.refresh')}
        </button>

        {/* Previous and Next buttons side by side */}
        <div className="flex gap-2">
          <button
            onClick={handleAutoPlayPrevious}
            className="btn btn-warning btn-xs sm:btn-sm flex-1 whitespace-nowrap"
            disabled={isPreviousDisabled}
            title={t('dj_control.actions.previous_tooltip')}
          >
            <span className="hidden sm:inline">⏮️ {t('dj_control.actions.previous')}</span>
            <span className="sm:hidden">{t('dj_control.actions.previous_short')}</span>
          </button>
          <button
            onClick={handleAutoPlayNext}
            className="btn btn-primary btn-xs sm:btn-sm flex-1 whitespace-nowrap"
            disabled={isNextDisabled}
            title={t('dj_control.actions.next_tooltip')}
          >
            <span className="hidden sm:inline">⏭️ {t('dj_control.actions.next')}</span>
            <span className="sm:hidden">{t('dj_control.actions.next_short')}</span>
          </button>
        </div>

        <button
          onClick={() => navigate(`/host/jams/${jamId}/manage`)}
          className="btn btn-secondary btn-xs sm:btn-sm w-full"
        >
          ➕ <span className="hidden sm:inline">{t('dj_control.actions.add_songs')}</span><span className="sm:hidden">{t('dj_control.actions.add_songs_short')}</span>
        </button>

        <div className="divider my-1"></div>

        <div className="space-y-2">
          <label className="label p-0">
            <span className="label-text text-xs sm:text-sm">{t('dj_control.actions.auto_refresh')}</span>
          </label>
          <select
            value={autoRefreshInterval}
            onChange={(e) => handleRefreshIntervalChange(Number(e.target.value))}
            className="select select-xs sm:select-sm select-bordered w-full"
          >
            <option value={0}>{t('dj_control.actions.auto_refresh_off')}</option>
            <option value={3000}>{t('dj_control.actions.auto_refresh_3s')}</option>
            <option value={5000}>{t('dj_control.actions.auto_refresh_5s')}</option>
            <option value={10000}>{t('dj_control.actions.auto_refresh_10s')}</option>
          </select>
        </div>
      </div>
    </div>
  )
}

