/**
 * Host Dashboard Page
 * Overview of all jams created by the current host
 * Route: /host/dashboard
 */

import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useAuth} from '../hooks'
import {jamService} from '../services'
import type {JamResponseDto} from '../types/api.types'
import {ErrorAlert, SuccessAlert} from '../components'
import {useTranslation} from 'react-i18next'
import {safeT} from '../lib/i18nUtils'

interface JamCategory {
  planned: JamResponseDto[]
  inProgress: JamResponseDto[]
  past: JamResponseDto[]
}

export function HostDashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [jams, setJams] = useState<JamResponseDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    // If not authenticated after auth is loaded, redirect to login
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Auth is ready and user is authenticated, load jams
    loadJams()
  }, [authLoading, isAuthenticated, navigate])

  const loadJams = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await jamService.findAll()
      setJams(result.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('jam_management.host_dashboard.failed_to_load')
      console.error('❌ Error loading jams:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const categorizeJams = (): JamCategory => {
    const categorized: JamCategory = {
      planned: [],
      inProgress: [],
      past: [],
    }

    jams.forEach((jam) => {
      if (jam.status === 'FINISHED') {
        categorized.past.push(jam)
      } else if (jam.status === 'ACTIVE') {
        categorized.inProgress.push(jam)
      } else {
        categorized.planned.push(jam)
      }
    })

    return categorized
  }

  const calculateStats = () => {
    const totalJams = jams.length

    // Deduplicate musicians by musicianId across all registrations
    const uniqueMusicians = new Set<string>()
    jams.forEach((jam) => {
      jam.registrations?.forEach((reg) => {
        uniqueMusicians.add(reg.musicianId)
      })
    })
    const totalMusicians = uniqueMusicians.size

    // Count schedules for total songs
    const totalSongs = jams.reduce((sum, jam) => sum + (jam.schedules?.length || 0), 0)

    return { totalJams, totalMusicians, totalSongs }
  }

  const handleDeleteJam = async (jamId: string) => {
    if (!confirm(t('jam_management.host_dashboard.confirm_delete'))) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await jamService.deleteFn(jamId)
      setSuccess(t('jam_management.host_dashboard.delete_success'))
      await loadJams()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('jam_management.host_dashboard.delete_failed'))
    } finally {
      setLoading(false)
    }
  }

  const categories = categorizeJams()
  const stats = calculateStats()

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="text-sm sm:text-base font-semibold text-base-content/70">{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100 px-2 sm:px-4 py-4 sm:py-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">🎭 {t('jam_management.host_dashboard.title')}</h1>
            <button
              onClick={() => navigate('/host/create-jam')}
              className="btn btn-primary btn-sm sm:btn-md"
              disabled={loading}
            >
              {t('jam_management.host_dashboard.create_jam_btn')}
            </button>
          </div>

          {/* Alerts */}
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
          {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="stats shadow bg-base-200 p-3 sm:p-6 w-full">
            <div className="stat w-full">
              <div className="stat-title text-xs sm:text-sm">{t('jam_management.host_dashboard.stats.total_jams')}</div>
              <div className="stat-value text-primary text-xl sm:text-2xl lg:text-3xl">{stats.totalJams}</div>
            </div>
          </div>

          <div className="stats shadow bg-base-200 p-3 sm:p-6 w-full">
            <div className="stat w-full">
              <div className="stat-title text-xs sm:text-sm">{t('jam_management.host_dashboard.stats.musicians')}</div>
              <div className="stat-value text-secondary text-xl sm:text-2xl lg:text-3xl">{stats.totalMusicians}</div>
            </div>
          </div>

          <div className="stats shadow bg-base-200 p-3 sm:p-6 w-full">
            <div className="stat w-full">
              <div className="stat-title text-xs sm:text-sm">{t('jam_management.host_dashboard.stats.songs')}</div>
              <div className="stat-value text-accent text-xl sm:text-2xl lg:text-3xl">{stats.totalSongs}</div>
            </div>
          </div>

          <div className="stats shadow bg-base-200 p-3 sm:p-6 w-full">
            <div className="stat w-full">
              <div className="stat-title text-xs sm:text-sm">{t('jam_management.host_dashboard.stats.upcoming')}</div>
              <div className="stat-value text-success text-xl sm:text-2xl lg:text-3xl">{categories.planned.length}</div>
            </div>
          </div>
        </div>

        {loading && jams.length === 0 ? (
          <div className="flex justify-center py-8 sm:py-12">
            <div className="flex flex-col items-center gap-3">
              <span className="loading loading-spinner loading-lg"></span>
              <span className="text-sm sm:text-base font-semibold text-base-content/70">{t('jam_management.host_dashboard.loading_jams')}</span>
            </div>
          </div>
        ) : jams.length === 0 ? (
          <div className="alert alert-info mb-6 sm:mb-8">
            <p className="text-sm sm:text-base">{t('jam_management.host_dashboard.no_jams_desc')}</p>
          </div>
        ) : (
          <>
            {/* Planned Jams */}
            {categories.planned.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">{t('jam_management.host_dashboard.categories.planned')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {categories.planned.map((jam) => (
                    <JamCard
                      key={jam.id}
                      jam={jam}
                      onDelete={handleDeleteJam}
                      onNavigate={navigate}
                      loading={loading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Jams */}
            {categories.inProgress.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">{t('jam_management.host_dashboard.categories.in_progress')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {categories.inProgress.map((jam) => (
                    <JamCard
                      key={jam.id}
                      jam={jam}
                      onDelete={handleDeleteJam}
                      onNavigate={navigate}
                      loading={loading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Jams */}
            {categories.past.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">{t('jam_management.host_dashboard.categories.past')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {categories.past.map((jam) => (
                    <JamCard
                      key={jam.id}
                      jam={jam}
                      onDelete={handleDeleteJam}
                      onNavigate={navigate}
                      loading={loading}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Jam Card Component for Dashboard
 */
interface JamCardProps {
  jam: JamResponseDto
  onDelete: (jamId: string) => void
  onNavigate: (path: string) => void
  loading: boolean
}

function JamCard({ jam, onDelete, onNavigate, loading }: JamCardProps) {
  const { t } = useTranslation()
  function getStatusLabel(status: string) {
    switch (status) {
      case 'ACTIVE':
        return t('jam_management.host_dashboard.statuses.active')
      case 'INACTIVE':
        return t('jam_management.host_dashboard.statuses.inactive')
      case 'FINISHED':
        return t('jam_management.host_dashboard.statuses.finished')
      default:
        return t('common.unknown')
    }
  }
  const getStatusBadgeColor = () => {
    switch (jam.status) {
      case 'ACTIVE':
        return 'badge-success'
      case 'INACTIVE':
        return 'badge-warning'
      case 'FINISHED':
        return 'badge-error'
      default:
        return 'badge-outline'
    }
  }

  // Calculate unique musicians in this jam
  const uniqueMusiciansInJam = new Set<string>()
  jam.registrations?.forEach((reg) => {
    uniqueMusiciansInJam.add(reg.musicianId)
  })

  const songCount = jam.schedules?.length || 0
  const musicianCount = uniqueMusiciansInJam.size

  return (
    <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
      <div className="card-body p-3 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="card-title text-base sm:text-lg">{jam.name}</h3>
          <div className={`badge badge-sm sm:badge-md ${getStatusBadgeColor()}`}>{getStatusLabel(jam.status)}</div>
        </div>

        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
          {jam.date && (
            <p className="text-base-content/70">
              📅 {new Date(jam.date).toLocaleDateString()}
            </p>
          )}
          {jam.description && (
            <p className="text-base-content/70 truncate">{jam.description}</p>
          )}
        </div>

        <div className="flex gap-2 mt-3 sm:mt-4 flex-wrap">
          <span className="badge badge-outline badge-xs sm:badge-sm">
            🎵 {safeT(t, 'jam_management.host_dashboard.songs_count', { count: songCount })}
          </span>
          <span className="badge badge-outline badge-xs sm:badge-sm">
            👥 {safeT(t, 'jam_management.host_dashboard.musicians_count', { count: musicianCount })}
          </span>
        </div>

        <div className="card-actions justify-between mt-4 sm:mt-6 flex-wrap gap-2">
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => onNavigate(`/jams/${jam.id}`)}
              className="btn btn-xs sm:btn-sm btn-ghost"
              disabled={loading}
            >
              {t('jam_management.host_dashboard.view_public')}
            </button>
            <button
              onClick={() => onNavigate(`/host/jams/${jam.id}/manage`)}
              className="btn btn-xs sm:btn-sm btn-primary"
              disabled={loading}
            >
              {t('jam_management.host_dashboard.manage_btn')}
            </button>
          </div>
          <button
            onClick={() => onDelete(jam.id)}
            className="btn btn-xs sm:btn-sm btn-error btn-outline"
            disabled={loading}
          >
            {t('jam_management.host_dashboard.delete_btn')}
          </button>
        </div>
      </div>
    </div>
  )
}

