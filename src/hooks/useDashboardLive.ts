/**
 * useDashboardLive Hook
 * Dashboard-specific polling hook for live jam data
 * Polls the /jams/{id}/live/dashboard endpoint with configurable interval
 */

import {useCallback, useEffect, useRef, useState} from 'react'
import {jamService} from '../services'
import {compareDashboardSnapshots} from '../utils/dashboardDiff'
import type {LiveDashboardResponseDto} from '../types/api.types'

export interface UseDashboardLiveOptions {
  pollingIntervalMs?: number
  enabled?: boolean
}

export interface UseDashboardLiveReturn {
  // Data from dashboard endpoint
  jamId: string | null
  jamName: string | null
  qrCode: string | null
  jamStatus: string | null
  currentSong: LiveDashboardResponseDto['currentSong']
  nextSongs: LiveDashboardResponseDto['nextSongs']

  // State
  isLoading: boolean
  error: Error | null

  // Controls
  setPollingIntervalMs(ms: number): void
  refresh(): Promise<void>
}

export function useDashboardLive(
  jamId: string | undefined,
  options?: UseDashboardLiveOptions
): UseDashboardLiveReturn {
  // Polling configuration
  const pollingIntervalMsRef = useRef<number>(options?.pollingIntervalMs ?? 5000)
  const pollingTimerRef = useRef<number | null>(null)
  const prevSnapshotRef = useRef<LiveDashboardResponseDto | null>(null)
  const isPageVisibleRef = useRef<boolean>(true)
  const isOnlineRef = useRef<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)

  // State
  const [dashboard, setDashboard] = useState<LiveDashboardResponseDto | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch dashboard data from API
   */
  const fetchDashboard = useCallback(async () => {
    if (!jamId) return

    try {
      setError(null)
      const resp = await jamService.getLiveDashboard(jamId)
      if (resp && resp.data) {
        setDashboard(resp.data)
        prevSnapshotRef.current = resp.data
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      setError(errorObj)
      console.error('Dashboard polling error:', err)
    }
  }, [jamId])

  /**
   * Manual refresh trigger
   */
  const refresh = useCallback(async () => {
    await fetchDashboard()
  }, [fetchDashboard])

  /**
   * Start polling loop
   */
  const startPollingLoop = useCallback(() => {
    stopPollingLoop()

    const tick = async () => {
      try {
        if (!jamId) return
        if (!isPageVisibleRef.current) return
        if (!isOnlineRef.current) return

        const resp = await jamService.getLiveDashboard(jamId)
        if (resp && resp.data) {
          const changes = compareDashboardSnapshots(prevSnapshotRef.current, resp.data)
          // Only update state when differences exist
          if (Object.keys(changes).length > 0) {
            setDashboard(resp.data)
            prevSnapshotRef.current = resp.data
          }
        }
      } catch (err) {
        console.error('Dashboard polling error:', err)
      }
    }

    // Initial immediate fetch
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    tick()

    // Set up interval if enabled
    if (pollingIntervalMsRef.current > 0) {
      pollingTimerRef.current = window.setInterval(tick, pollingIntervalMsRef.current) as unknown as number
    }
  }, [jamId])

  /**
   * Stop polling loop
   */
  const stopPollingLoop = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current)
      pollingTimerRef.current = null
    }
  }, [])

  /**
   * Set polling interval (restarts polling with new interval)
   */
  const setPollingIntervalMs = useCallback(
    (ms: number) => {
      pollingIntervalMsRef.current = Math.max(0, Math.floor(ms))
      // Restart polling with new interval
      if (jamId) {
        startPollingLoop()
      }
    },
    [jamId, startPollingLoop]
  )

  /**
   * Initialize polling on mount and when jamId changes
   */
  useEffect(() => {
    if (!jamId) return

    setIsLoading(true)
    setDashboard(null)
    prevSnapshotRef.current = null

    startPollingLoop()

    return () => {
      stopPollingLoop()
    }
  }, [jamId, startPollingLoop, stopPollingLoop])

  /**
   * Handle page visibility changes
   */
  useEffect(() => {
    const onVisibility = () => {
      isPageVisibleRef.current = !document.hidden
      // Trigger immediate refresh when page becomes visible
      if (isPageVisibleRef.current && jamId) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchDashboard()
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [jamId, fetchDashboard])

  /**
   * Handle online/offline changes
   */
  useEffect(() => {
    const onOnline = () => {
      isOnlineRef.current = true
      if (jamId) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        fetchDashboard()
      }
    }

    const onOffline = () => {
      isOnlineRef.current = false
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [jamId, fetchDashboard])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopPollingLoop()
    }
  }, [stopPollingLoop])

  return {
    jamId: dashboard?.jamId ?? null,
    jamName: dashboard?.jamName ?? null,
    qrCode: dashboard?.qrCode ?? null,
    jamStatus: dashboard?.jamStatus ?? null,
    currentSong: dashboard?.currentSong ?? null,
    nextSongs: dashboard?.nextSongs ?? [],
    isLoading,
    error,
    setPollingIntervalMs,
    refresh,
  }
}

