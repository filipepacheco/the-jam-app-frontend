/**
 * Jam Control Service
 * Handles jam playback control via new /control endpoints
 * Provides simplified API for DJ control actions (play, pause, skip, reorder)
 */

import {apiClient, withLegacyResponse} from '../lib/api'
import type {JamResponseDto} from '../types/api.types'
import type {LiveStateResponseDto, ReorderQueueRequest, ReorderQueueResponse, ScheduleOrderUpdate} from '../types/jamControl.types'

/**
 * Get the current live state of a jam
 */
export function getLiveState(jamId: string) {
  return withLegacyResponse(
    () => apiClient.get<LiveStateResponseDto>(`/jams/${jamId}/live/state`),
    'Failed to load jam live state',
  )
}

/**
 * Start jam playback
 */
export function startJam(jamId: string) {
  return withLegacyResponse(
    () => apiClient.post<void>(`/jams/${jamId}/control/start`),
    'Failed to start jam',
  )
}

/**
 * Stop jam playback
 */
export function stopJam(jamId: string) {
  return withLegacyResponse(
    () => apiClient.post<void>(`/jams/${jamId}/control/stop`),
    'Failed to stop jam',
  )
}

/**
 * Resume paused song
 */
export function resume(jamId: string) {
  return withLegacyResponse(
    () => apiClient.post<JamResponseDto>(`/jams/${jamId}/control/resume`),
    'Failed to resume playback',
  )
}

/**
 * Pause current song
 */
export function pause(jamId: string) {
  return withLegacyResponse(
    () => apiClient.post<JamResponseDto>(`/jams/${jamId}/control/pause`),
    'Failed to pause playback',
  )
}

/**
 * Skip to next song
 */
export function next(jamId: string) {
  return withLegacyResponse(
    () => apiClient.post<JamResponseDto>(`/jams/${jamId}/control/next`),
    'Failed to skip to next song',
  )
}

/**
 * Go back to previous completed song
 */
export function previous(jamId: string) {
  return withLegacyResponse(
    () => apiClient.post<JamResponseDto>(`/jams/${jamId}/control/previous`),
    'Failed to go to previous song',
  )
}

/**
 * Reorder schedules in jam queue
 * Uses different response format - not wrapped with withLegacyResponse
 */
export async function reorderQueue(
  jamId: string,
  updates: ScheduleOrderUpdate[]
): Promise<ReorderQueueResponse> {
  try {
    const payload: ReorderQueueRequest = { updates }

    const response = await apiClient.post<JamResponseDto>(
      `/jams/${jamId}/control/reorder`,
      payload
    )

    if (!response.success) {
      return {
        success: false,
        error: {
          message: response.error || 'Failed to reorder queue',
          code: 'REORDER_FAILED',
          status: 500
        }
      }
    }

    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR',
        status: 0
      }
    }
  }
}

/**
 * Service object with all jam control methods
 */
export const jamControlService = {
  getLiveState,
  startJam,
  stopJam,
  resume,
  pause,
  next,
  previous,
  reorderQueue,
}
