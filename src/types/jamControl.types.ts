/**
 * Jam Control Type Definitions
 * Types for the new /control endpoints and live state management
 */

import type {PlaybackState, ScheduleStatus} from './api.types'

export type { PlaybackState, ScheduleStatus }

// ============================================================================
// LIVE STATE TYPES (from /jams/{id}/live/state endpoint)
// ============================================================================

/**
 * Slim music data - only fields used by the DJ control UI
 */
export interface LiveStateMusic {
  title: string
  artist: string
  duration?: number | null
}

/**
 * Flattened musician (matches backend DashboardMusicianDto)
 */
export interface LiveStateMusicianDto {
  id: string
  name: string | null
  instrument: string
}

/**
 * Song in the live state response
 * Contains only performance-relevant data with timestamps
 */
export interface LiveStateSongDto {
  id: string
  order: number
  status: ScheduleStatus
  startedAt?: string | null
  completedAt?: string | null
  music: LiveStateMusic
  musicians: LiveStateMusicianDto[]
}

/**
 * Live state response from GET /jams/{id}/live/state
 * Lean payload optimized for polling (5-10s intervals)
 */
export interface LiveStateResponseDto {
  currentSong: LiveStateSongDto | null
  nextSongs: LiveStateSongDto[]
  previousSongs: LiveStateSongDto[]
  suggestedSongs: LiveStateSongDto[]
  jamStatus: 'ACTIVE' | 'INACTIVE' | 'FINISHED'
  playbackState: PlaybackState
}

// ============================================================================
// CONTROL ACTION TYPES (for /jams/{id}/live/control endpoint)
// ============================================================================

// ============================================================================
// CUSTOM HOOK TYPES
// ============================================================================

/**
 * Return type for useJamControl hook
 */
export interface UseJamControlReturn {
  // State
  liveState: LiveStateResponseDto | null
  isLoading: boolean
  error: string | null

  // Actions
  start: () => Promise<void>
  stop: () => Promise<void>
  resume: () => Promise<void>
  pause: () => Promise<void>
  next: () => Promise<void>
  previous: () => Promise<void>

  // Manual refresh
  refresh: () => Promise<void>
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// ============================================================================
// QUEUE REORDERING TYPES (for /jams/{id}/control/reorder endpoint)
// ============================================================================

/**
 * Individual schedule order update
 * Explicit order value for Prisma batch updates
 */
export interface ScheduleOrderUpdate {
  scheduleId: string
  order: number
}

/**
 * Request payload for reorder endpoint
 * POST /jams/:id/control/reorder
 * Uses explicit order values instead of array index derivation
 */
export interface ReorderQueueRequest {
  updates: ScheduleOrderUpdate[]
}

/**
 * Standardized response from reorder endpoint
 * Returns full jam object with updated schedules
 */
export interface ReorderQueueResponse {
  success: boolean
  data?: import('./api.types').JamResponseDto
  error?: {
    message: string
    code: string
    status: number
  }
}

/**
 * Hook return type for useQueueReorder
 * Provides reorder method and state management
 */
export interface UseQueueReorderReturn {
  reorderQueue: (newQueue: import('./api.types').ScheduleResponseDto[]) => Promise<void>
  isReordering: boolean
  error: string | null
  resetError: () => void
}
