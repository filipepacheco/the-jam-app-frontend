/**
 * Jam Control Service
 * Handles jam playback control via new /control endpoints
 * Provides simplified API for DJ control actions (play, pause, skip, reorder)
 */

import {apiClient, unwrapResponse} from '../lib/api'
import i18n from '../i18n'
import type {JamResponseDto} from '../types/api.types'
import type {LiveStateResponseDto, ReorderQueueRequest, ScheduleOrderUpdate} from '../types/jamControl.types'

/**
 * Get the current live state of a jam
 */
export function getLiveState(jamId: string) {
  return unwrapResponse(
    () => apiClient.get<LiveStateResponseDto>(`/jams/${jamId}/live/state`),
    'Failed to load jam live state',
  )
}

/**
 * Start jam playback
 */
export function startJam(jamId: string) {
  return unwrapResponse(
    () => apiClient.post<void>(`/jams/${jamId}/control/start`),
    'Failed to start jam',
  )
}

/**
 * Stop jam playback
 */
export function stopJam(jamId: string) {
  return unwrapResponse(
    () => apiClient.post<void>(`/jams/${jamId}/control/stop`),
    'Failed to stop jam',
  )
}

/**
 * Resume paused song
 */
export function resume(jamId: string) {
  return unwrapResponse(
    () => apiClient.post<JamResponseDto>(`/jams/${jamId}/control/resume`),
    'Failed to resume playback',
  )
}

/**
 * Pause current song
 */
export function pause(jamId: string) {
  return unwrapResponse(
    () => apiClient.post<JamResponseDto>(`/jams/${jamId}/control/pause`),
    'Failed to pause playback',
  )
}

/**
 * Skip to next song
 */
export function next(jamId: string) {
  return unwrapResponse(
    () => apiClient.post<JamResponseDto>(`/jams/${jamId}/control/next`),
    'Failed to skip to next song',
  )
}

/**
 * Go back to previous completed song
 */
export function previous(jamId: string) {
  return unwrapResponse(
    () => apiClient.post<JamResponseDto>(`/jams/${jamId}/control/previous`),
    'Failed to go to previous song',
  )
}

/**
 * Reorder schedules in the jam queue.
 * Throws on failure like every other service call. The backend may answer with
 * the full updated jam or with a bare `true`, so callers must treat the
 * resolved value as possibly lacking `schedules`.
 */
export async function reorderQueue(
  jamId: string,
  updates: ScheduleOrderUpdate[]
): Promise<JamResponseDto | undefined> {
  const payload: ReorderQueueRequest = { updates }
  return unwrapResponse(
    () => apiClient.post<JamResponseDto>(`/jams/${jamId}/control/reorder`, payload),
    i18n.t('errors.reorder_failed'),
  )
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
