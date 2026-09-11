/**
 * Custom hook for jam control using SWR
 * Manages jam playback state and control actions via new /control endpoints
 * Uses SWR for efficient caching and automatic revalidation
 */

import {useCallback} from 'react'
import useSWR from 'swr'
import {jamControlService} from '../services'
import {SWR_DEFAULTS} from '../config/swrDefaults'
import type {LiveStateResponseDto, UseJamControlReturn} from '../types/jamControl.types'

interface UseJamControlOptions {
  autoRefreshEnabled?: boolean
  autoRefreshInterval?: number // milliseconds, default 5000
}

/**
 * Hook for managing jam playback control with SWR
 * @param jamId - The jam ID to control
 * @param options - Configuration options
 * @returns Control state and action methods
 */
export function useJamControl(jamId: string, options?: UseJamControlOptions): UseJamControlReturn {
  const autoRefreshEnabled = options?.autoRefreshEnabled ?? true
  const autoRefreshInterval = options?.autoRefreshInterval ?? 10000

  // SWR key - null disables fetching
  const swrKey = jamId ? `/jams/${jamId}/live/state` : null

  // Fetcher function for SWR
  const fetcher = async () => {
    return jamControlService.getLiveState(jamId)
  }

  // Use SWR for data fetching with automatic revalidation
  const {
    data: liveState,
    error: swrError,
    isLoading,
    mutate,
  } = useSWR<LiveStateResponseDto>(swrKey, fetcher, {
    ...SWR_DEFAULTS,
    refreshInterval: autoRefreshEnabled ? autoRefreshInterval : 0,
    shouldRetryOnError: true,
  })

  // Convert SWR error to string
  const error = swrError ? (swrError instanceof Error ? swrError.message : 'Failed to load jam state') : null

  /**
   * Refresh live state manually
   * Forces SWR to revalidate
   */
  const refresh = useCallback(async () => {
    await mutate()
  }, [mutate])

  /**
   * Execute action and refresh state
   * Helper to reduce duplication in action handlers
   */
  const executeAction = useCallback(
    async (action: () => Promise<any>, errorMessage: string) => {
      try {
        await action()
        // Force immediate revalidation after action
        await mutate()
      } catch (err) {
        const message = err instanceof Error ? err.message : errorMessage
        console.error(errorMessage, err)
        throw new Error(message)
      }
    },
    [mutate]
  )

  /**
   * Start jam playback
   * Starts with first scheduled song
   */
  const start = useCallback(async () => {
    await executeAction(
      () => jamControlService.startJam(jamId),
      'Failed to start jam'
    )
  }, [jamId, executeAction])

  /**
   * Stop jam playback
   * Stops current playback and marks current song as completed
   */
  const stop = useCallback(async () => {
    await executeAction(
      () => jamControlService.stopJam(jamId),
      'Failed to stop jam'
    )
  }, [jamId, executeAction])

  /**
   * Resume paused song
   * Resumes playback if currently paused
   */
  const resume = useCallback(async () => {
    await executeAction(
      () => jamControlService.resume(jamId),
      'Failed to resume playback'
    )
  }, [jamId, executeAction])

  /**
   * Pause current song
   * Pauses playback with timestamp
   */
  const pause = useCallback(async () => {
    await executeAction(
      () => jamControlService.pause(jamId),
      'Failed to pause'
    )
  }, [jamId, executeAction])

  /**
   * Skip to next song
   * Advances to next scheduled song
   */
  const next = useCallback(async () => {
    await executeAction(
      () => jamControlService.next(jamId),
      'Failed to skip to next song'
    )
  }, [jamId, executeAction])

  /**
   * Go back to previous song
   * Replays the previous completed song
   */
  const previous = useCallback(async () => {
    await executeAction(
      () => jamControlService.previous(jamId),
      'Failed to go to previous song'
    )
  }, [jamId, executeAction])

  return {
    // State
    liveState: liveState ?? null,
    isLoading,
    error,

    // Actions
    start,
    stop,
    resume,
    pause,
    next,
    previous,

    // Manual refresh
    refresh,
  }
}
