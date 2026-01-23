/**
 * Jam Control Service
 * Handles jam playback control via new /control endpoints
 * Provides simplified API for DJ control actions (play, pause, skip, reorder)
 */

import {apiClient} from '../lib/api'
import type {JamResponseDto} from '../types/api.types'
import type {LiveStateResponseDto, ReorderQueueRequest, ReorderQueueResponse, ScheduleOrderUpdate} from '../types/jamControl.types'

interface ApiResponse<T> {
  data: T
  status: number
}

/**
 * Get the current live state of a jam
 * Returns pre-organized current, next, and previous songs
 * @param jamId - Jam ID
 * @returns Promise with live state response
 */
export async function getLiveState(jamId: string): Promise<ApiResponse<LiveStateResponseDto>> {
  try {
    const response = await apiClient.get<LiveStateResponseDto>(`/jams/${jamId}/live/state`)

    if (!response.success) {
      throw new Error(response.error || 'Failed to load jam live state')
    }

    return {
      data: response.data as LiveStateResponseDto,
      status: 200,
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}

/**
 * Start jam playback
 * Initializes playback with the first scheduled song
 * @param jamId - Jam ID
 * @returns Promise with confirmation
 */
export async function startJam(jamId: string): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.post<void>(`/jams/${jamId}/control/start`)

    if (!response.success) {
      throw new Error(response.error || 'Failed to start jam')
    }

    return {
      data: undefined,
      status: 200,
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}

/**
 * Stop jam playback
 * Stops current playback and returns to idle state
 * @param jamId - Jam ID
 * @returns Promise with confirmation
 */
export async function stopJam(jamId: string): Promise<ApiResponse<void>> {
  try {
    const response = await apiClient.post<void>(`/jams/${jamId}/control/stop`)

    if (!response.success) {
      throw new Error(response.error || 'Failed to stop jam')
    }

    return {
      data: undefined,
      status: 200,
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}

/**
 * Resume paused song
 * Resumes playback if paused
 * @param jamId - Jam ID
 * @returns Promise with updated jam
 */
export async function resume(jamId: string): Promise<ApiResponse<JamResponseDto>> {
  try {
    const response = await apiClient.post<JamResponseDto>(`/jams/${jamId}/control/resume`)

    if (!response.success) {
      throw new Error(response.error || 'Failed to resume playback')
    }

    return {
      data: response.data as JamResponseDto,
      status: 200,
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}

/**
 * Pause current song
 * Pauses playback of the current song with timestamp
 * @param jamId - Jam ID
 * @returns Promise with updated jam
 */
export async function pause(jamId: string): Promise<ApiResponse<JamResponseDto>> {
  try {
    const response = await apiClient.post<JamResponseDto>(`/jams/${jamId}/control/pause`)

    if (!response.success) {
      throw new Error(response.error || 'Failed to pause playback')
    }

    return {
      data: response.data as JamResponseDto,
      status: 200,
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}

/**
 * Skip to next song
 * Moves current song to completed, advances to next scheduled song
 * @param jamId - Jam ID
 * @returns Promise with updated jam
 */
export async function next(jamId: string): Promise<ApiResponse<JamResponseDto>> {
  try {
    const response = await apiClient.post<JamResponseDto>(`/jams/${jamId}/control/next`)

    if (!response.success) {
      throw new Error(response.error || 'Failed to skip to next song')
    }

    return {
      data: response.data as JamResponseDto,
      status: 200,
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}

/**
 * Go back to previous completed song
 * Replays the previous completed song
 * @param jamId - Jam ID
 * @returns Promise with updated jam
 */
export async function previous(jamId: string): Promise<ApiResponse<JamResponseDto>> {
  try {
    const response = await apiClient.post<JamResponseDto>(`/jams/${jamId}/control/previous`)

    if (!response.success) {
      throw new Error(response.error || 'Failed to go to previous song')
    }

    return {
      data: response.data as JamResponseDto,
      status: 200,
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Connection error. Please try again.')
  }
}

/**
 * Reorder schedules in jam queue
 * Uses new dedicated endpoint: POST /jams/:id/control/reorder
 * @param jamId - Jam ID
 * @param updates - Array of schedule order updates with explicit order values
 * @returns Promise with standardized response containing full jam with updated schedules
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
 * Provides convenient namespace for jam control operations
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
