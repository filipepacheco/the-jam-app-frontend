/**
 * DJ Control Actions Component
 * Reusable actions section with Previous, Next, Refresh, Add Songs buttons and Auto Refresh control
 */

import {useEffect, useState} from 'react'
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
}

export function DJControlActions({
  jamId,
  schedules,
  onReload,
  loading,
  onAutoRefreshChange,
  autoRefreshInterval = 0,
}: DJControlActionsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [localAutoRefreshInterval, setLocalAutoRefreshInterval] = useState(autoRefreshInterval)
  const [actionLoading, setActionLoading] = useState(false)

  // Auto-refresh setup
  useEffect(() => {
    if (localAutoRefreshInterval === 0) return

    const interval = setInterval(() => {
      onReload()
    }, localAutoRefreshInterval)

    return () => clearInterval(interval)
  }, [localAutoRefreshInterval, onReload])

  const handleAutoPlayNext = async () => {
    setActionLoading(true)
    try {
      // Get current song
      const current = schedules.find(s => s.status === 'IN_PROGRESS')
      const next = schedules.find(
        s => s.status === 'SCHEDULED' && (!current || s.order > current.order)
      )

      if (!current || !next) {
        // Error is handled by parent component
        return
      }

      // Complete current and start next
      await scheduleService.update(current.id, { status: 'COMPLETED' })
      await scheduleService.update(next.id, { status: 'IN_PROGRESS' })
      onReload()
    } finally {
      setActionLoading(false)
    }
  }

  const handleAutoPlayPrevious = async () => {
    setActionLoading(true)
    try {
      // Get current song
      const current = schedules.find(s => s.status === 'IN_PROGRESS')
      // Get previous completed song (most recent one)
      const previous = [...schedules]
        .reverse()
        .find(s => s.status === 'COMPLETED' && (!current || s.order < current.order))

      if (!current || !previous) {
        // Error is handled by parent component
        return
      }

      // Mark current as scheduled again and start previous
      await scheduleService.update(current.id, { status: 'SCHEDULED' })
      await scheduleService.update(previous.id, { status: 'IN_PROGRESS' })
      onReload()
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefreshIntervalChange = (value: number) => {
    setLocalAutoRefreshInterval(value)
    onAutoRefreshChange?.(value)
  }

  return (
    <div className="card bg-base-200 shadow">
      <div className="card-body p-3 sm:p-6 space-y-3">
        <h3 className="font-bold text-base sm:text-lg">⚡ Actions</h3>

        {/* Refresh button */}
        <button
          onClick={() => onReload()}
          className="btn btn-ghost btn-xs sm:btn-sm w-full"
          title="Refresh data"
          disabled={loading || actionLoading}
        >
          🔄 {loading ? 'Updating...' : 'Refresh'}
        </button>

        {/* Previous and Next buttons side by side */}
        <div className="flex gap-2">
          <button
            onClick={handleAutoPlayPrevious}
            className="btn btn-warning btn-xs sm:btn-sm flex-1 whitespace-nowrap"
            disabled={loading || actionLoading || !schedules.some(s => s.status === 'IN_PROGRESS') || !schedules.some(s => s.status === 'COMPLETED')}
            title="Go back to previous song"
          >
            <span className="hidden sm:inline">⏮️ Previous</span>
            <span className="sm:hidden">⏮️</span>
          </button>
          <button
            onClick={handleAutoPlayNext}
            className="btn btn-primary btn-xs sm:btn-sm flex-1 whitespace-nowrap"
            disabled={loading || actionLoading || !schedules.some(s => s.status === 'IN_PROGRESS')}
            title="Skip to next song"
          >
            <span className="hidden sm:inline">⏭️ Next</span>
            <span className="sm:hidden">⏭️</span>
          </button>
        </div>

        <button
          onClick={() => navigate(`/host/jams/${jamId}/manage`)}
          className="btn btn-secondary btn-xs sm:btn-sm w-full"
        >
          ➕ <span className="hidden sm:inline">Add Songs</span><span className="sm:hidden">Add</span>
        </button>

        <div className="divider my-1"></div>

        <div className="space-y-2">
          <label className="label p-0">
            <span className="label-text text-xs sm:text-sm">Auto Refresh</span>
          </label>
          <select
            value={localAutoRefreshInterval}
            onChange={(e) => handleRefreshIntervalChange(Number(e.target.value))}
            className="select select-xs sm:select-sm select-bordered w-full"
          >
            <option value={0}>Off</option>
            <option value={3000}>3s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
          </select>
        </div>
      </div>
    </div>
  )
}

