/**
 * DJ Control Page
 * Dedicated page for managing music order and controlling song progression
 * Route: /host/jams/:id/dj-control
 */

import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useAuth} from '../hooks'
import {jamService, scheduleService} from '../services'
import type {JamResponseDto, ScheduleResponseDto} from '../types/api.types'
import {ErrorAlert, QueueStats, SongQueueTimeline, SuccessAlert} from '../components'
import {useTranslation} from 'react-i18next'

export function JamDJControlPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id: jamId } = useParams<{ id: string }>()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [jam, setJam] = useState<JamResponseDto | null>(null)
  const [schedules, setSchedules] = useState<ScheduleResponseDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0)

  // Auth check
  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (jamId) {
      loadJamData(jamId)
    }
  }, [jamId, isAuthenticated, authLoading, navigate])

  // Auto-refresh setup
  useEffect(() => {
    if (!jamId || autoRefreshInterval === 0) return

    const interval = setInterval(() => {
      loadJamData(jamId)
    }, autoRefreshInterval)

    return () => clearInterval(interval)
  }, [jamId, autoRefreshInterval])

  const loadJamData = async (id: string) => {
    try {
      const result = await jamService.findOne(id)
      setJam(result.data)
      // Get sorted schedules
      const sorted = (result.data.schedules || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setSchedules(sorted)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('common.error')
      console.error('❌ Error loading jam:', err)
      setError(errorMessage)
    }
  }


  const handleRemoveSong = async (scheduleId: string) => {
    if (!confirm(t('dj_control.confirm_remove'))) return
    setLoading(true)
    setError(null)
    try {
      await scheduleService.remove(scheduleId)
      setSuccess(t('dj_control.song_removed'))
      if (jamId) await loadJamData(jamId)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleApproveSong = async (scheduleId: string) => {
    if (!jamId) return
    setLoading(true)
    setError(null)
    try {
      await scheduleService.update(scheduleId, { status: 'SCHEDULED' })
      setSuccess(t('dj_control.song_approved'))
      await loadJamData(jamId)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleAutoPlayNext = async () => {
    if (!jamId) return
    setLoading(true)
    setError(null)
    try {
      // Get current song
      const current = schedules.find(s => s.status === 'IN_PROGRESS')
      const next = schedules.find(
        s => s.status === 'SCHEDULED' && (!current || s.order > current.order)
      )

      if (!current || !next) {
        setError(t('dj_control.no_songs_to_play'))
        return
      }

      // Complete current and start next
      await scheduleService.update(current.id, { status: 'COMPLETED' })
      await scheduleService.update(next.id, { status: 'IN_PROGRESS' })
      setSuccess(t('dj_control.next_song_playing'))
      await loadJamData(jamId)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleAutoPlayPrevious = async () => {
    if (!jamId) return
    setLoading(true)
    setError(null)
    try {
      // Get current song
      const current = schedules.find(s => s.status === 'IN_PROGRESS')
      // Get previous completed song (most recent one)
      const previous = [...schedules]
        .reverse()
        .find(s => s.status === 'COMPLETED' && (!current || s.order < current.order))

      if (!current || !previous) {
        setError(t('dj_control.no_previous_song'))
        return
      }

      // Mark current as scheduled again and start previous
      await scheduleService.update(current.id, { status: 'SCHEDULED' })
      await scheduleService.update(previous.id, { status: 'IN_PROGRESS' })
      setSuccess(t('dj_control.previous_song_playing'))
      await loadJamData(jamId)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

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

  if (!jam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">{t('common.loading')}</p>
        </div>
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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">🎛️ {jam.name}</h1>
              <p className="text-xs sm:text-sm text-base-content/70 mt-1">DJ Control Panel</p>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="text-xs sm:text-sm breadcrumbs overflow-x-auto">
            <ul>
              <li>
                <button onClick={() => navigate('/host/dashboard')} className="link link-hover">
                  Dashboard
                </button>
              </li>
              <li className="truncate">{jam.name}</li>
              <li className="whitespace-nowrap">DJ Control</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="container sticky top-0 z-40 mx-auto max-w-6xl px-2 sm:px-4 mt-2 sm:mt-4">
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
        {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />}
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-2 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Timeline - appears last on mobile, first on desktop */}
          <div className="lg:col-span-3 min-w-0 order-2 lg:order-1">
            <SongQueueTimeline
              schedules={schedules}
              onRemoveSong={handleRemoveSong}
              onApproveSong={handleApproveSong}
              loading={loading}
            />
          </div>

          {/* Sidebar - appears first on mobile, last on desktop */}
          <div className="lg:col-span-1 space-y-4 order-1 lg:order-2">
            {/* Queue Stats */}
            <QueueStats schedules={schedules} />

            {/* Controls */}
            <div className="card bg-base-200 shadow">
              <div className="card-body p-3 sm:p-6 space-y-3">
                <h3 className="font-bold text-base sm:text-lg">⚡ Actions</h3>

                {/* Previous and Next buttons side by side */}
                <div className="flex gap-2">
                  <button
                    onClick={handleAutoPlayPrevious}
                    className="btn btn-warning btn-xs sm:btn-sm flex-1 whitespace-nowrap"
                    disabled={loading || !schedules.some(s => s.status === 'IN_PROGRESS') || !schedules.some(s => s.status === 'COMPLETED')}
                    title="Go back to previous song"
                  >
                    <span className="hidden sm:inline">⏮️ Previous</span>
                    <span className="sm:hidden">⏮️</span>
                  </button>
                  <button
                    onClick={handleAutoPlayNext}
                    className="btn btn-primary btn-xs sm:btn-sm flex-1 whitespace-nowrap"
                    disabled={loading || !schedules.some(s => s.status === 'IN_PROGRESS')}
                    title="Skip to next song"
                  >
                    <span className="hidden sm:inline">⏭️ Next</span>
                    <span className="sm:hidden">⏭️</span>
                  </button>
                </div>

                <button
                  onClick={() => navigate(`/host/jams/${jam.id}/manage`)}
                  className="btn btn-secondary btn-xs sm:btn-sm w-full"
                >
                  ➕ <span className="hidden sm:inline">Add Songs</span><span className="sm:hidden">Add</span>
                </button>

                <div className="divider my-2"></div>

                <div className="space-y-2">
                  <label className="label p-0">
                    <span className="label-text text-xs sm:text-sm">Auto Refresh</span>
                  </label>
                  <select
                    value={autoRefreshInterval}
                    onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                    className="select select-xs sm:select-sm select-bordered w-full"
                  >
                    <option value={0}>Off</option>
                    <option value={3000}>3s</option>
                    <option value={5000}>5s</option>
                    <option value={10000}>10s</option>
                  </select>
                </div>

                <button
                  onClick={() => navigate(`/host/jams/${jam.id}/manage`)}
                  className="btn btn-ghost btn-xs w-full text-xs"
                >
                  ⚙️ <span className="hidden sm:inline">Full Management</span><span className="sm:hidden">Manage</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

