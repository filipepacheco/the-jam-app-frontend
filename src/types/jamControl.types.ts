/**
 * Jam Control Type Definitions
 * Types for the new /control endpoints and live state management
 */

import type {RegistrationResponseDto} from './api.types'

/**
 * Playback state of the jam
 */
export type PlaybackState = 'STOPPED' | 'PLAYING' | 'PAUSED'

/**
 * Schedule status types
 */
export type ScheduleStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'SUGGESTED'

// ============================================================================
// LIVE STATE TYPES (from /jams/{id}/live/state endpoint)
// ============================================================================

/**
 * Music data for live state display
 */
export interface LiveStateMusic {
  id: string
  title: string
  artist: string
  duracao?: number
  genre?: string
  description?: string
  link?: string
  status?: 'APPROVED' | 'SUGGESTED'
}

/**
 * Song in the live state response
 * Contains performance data with timestamps
 */
export interface LiveStateSongDto {
  id: string
  jamId: string
  musicId: string
  order: number
  status: ScheduleStatus
  createdAt: string
  startedAt: string | null
  pausedAt: string | null
  completedAt: string | null
  music: LiveStateMusic
  registrations: RegistrationResponseDto[]
}

/**
 * Live state response from GET /jams/{id}/live/state
 * Provides pre-organized current, next, and previous songs
 * Eliminates need for client-side filtering and sorting
 */
export interface LiveStateResponseDto {
  // Current song being performed (status: IN_PROGRESS)
  currentSong: LiveStateSongDto | null

  // Next songs in queue (status: SCHEDULED)
  // Typically includes up to 3 songs
  nextSongs: LiveStateSongDto[]

  // Previously completed songs (status: COMPLETED)
  // Typically includes up to 3 songs
  previousSongs: LiveStateSongDto[]

  suggestedSongs: LiveStateSongDto[]

  // Jam status
  jamStatus: 'ACTIVE' | 'INACTIVE' | 'FINISHED'

  // Current playback state
  playbackState: PlaybackState

  // Timestamp when current song started playback
  currentSongStartedAt: string | null

  // Timestamp when current song was paused
  currentSongPausedAt: string | null

  // Server timestamp for snapshot reference
  timestamp: number
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
 * Request payload for reorder endpoint
 * POST /jams/:id/control/reorder
 */
export interface ReorderQueueRequest {
  scheduleIds: string[]
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
  reorderQueue: (scheduleIds: string[]) => Promise<void>
  isReordering: boolean
  error: string | null
  resetError: () => void
}
