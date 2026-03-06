/**
 * API Type Definitions
 * Generated from Swagger specification (.GitHub/swagger.json)
 *
 * This file contains all TypeScript interfaces and types matching the backend API
 */

// ============================================================================
// TYPE CONSTANTS (String Literal Types)
// ============================================================================

/**
 * Jam session status
 */
export type JamStatus = 'ACTIVE' | 'INACTIVE' | 'LIVE' | 'FINISHED'

/**
 * Musician experience level
 */
export type MusicianLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL'

/**
 * Schedule/Performance status
 */
export type ScheduleStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'SUGGESTED'

// ============================================================================
// AUTHENTICATION DTOs (from backend auth endpoints)
// ============================================================================

// ============================================================================
// RESPONSE DTOs (from backend)
// ============================================================================

/**
 * Musician response from API
 */
export interface MusicianResponseDto {
  id: string
  name?: string | null
  instrument?: string | null
  level?: MusicianLevel | null
  contact?: string | null
  phone?: string | null
  email?: string | null
  supabaseUserId?: string | null
  bio?: string | null
  otherInstruments?: string | null
  isHost: boolean
  createdAt: string
}

/**
 * Musician profile with participation stats (from GET /musicos/:id)
 */
export interface MusicianProfileWithStats extends MusicianResponseDto {
  stats: {
    totalJams: number
    totalSongs: number
    instruments: string[]
  }
}

/**
 * Music response from API
 * Backend returns English field names via Prisma (Portuguese only in DB columns via @map)
 */
export interface MusicResponseDto {
  id: string
  title: string
  artist: string
  genre?: string
  duration?: number
  description?: string
  link?: string
  status?: 'APPROVED' | 'SUGGESTED'
  createdAt: string
  registrations?: RegistrationResponseDto[]
  schedules?: ScheduleResponseDto[]
  neededDrums?: number
  neededGuitars?: number
  neededVocals?: number
  neededBass?: number
  neededKeys?: number
}

/**
 * Registration response from API
 */
export interface RegistrationResponseDto {
  id: string
  musicianId: string
  jamId: string
  jamMusicId?: string
  scheduleId?: string
  instrument: string
  status?: string
  createdAt?: string
  musician?: MusicianResponseDto
}

/**
 * Schedule response from API
 */
export interface ScheduleResponseDto {
  id: string
  jamId: string
  musicId: string
  order: number
  status: ScheduleStatus
  createdAt: string
  registrationId?: string
  music: MusicResponseDto
  registrations?: RegistrationResponseDto[]
  registration?: RegistrationResponseDto
}

/**
 * Jam-Music link response (junction table)
 */
export interface JamMusicResponseDto {
  id: string
  jamId: string
  musicId: string
  notes?: string | null
  music?: MusicResponseDto
}

/**
 * Playback state for a jam session
 */
export type PlaybackState = 'PLAYING' | 'PAUSED' | 'STOPPED'

/**
 * Count summary for jam-related entities
 */
export interface JamCountDto {
  jamMusics: number
  registrations: number
  schedules: number
}

/**
 * Jam session response from API
 */
export interface JamResponseDto {
  id: string
  name: string
  hostName: string
  hostMusicianId?: string | null
  description?: string
  date?: string
  location?: string
  qrCode?: string
  slug?: string | null
  shortCode?: string | null
  spotifyPlaylistUrl?: string | null
  status: JamStatus
  createdAt: string
  updatedAt: string
  playbackState?: PlaybackState
  currentScheduleId?: string
  _count?: JamCountDto
  schedules?: ScheduleResponseDto[]
  jamMusics?: JamMusicResponseDto[]
}

// ============================================================================
// REQUEST DTOs (to backend)
// ============================================================================

/**
 * Create musician request
 */
export interface CreateMusicianDto {
  name: string
  contact?: string
  instrument: string
  level: MusicianLevel
}

/**
 * Update musician request
 */
export interface UpdateMusicianDto {
  name?: string
  contact?: string
  instrument?: string
  level?: MusicianLevel
  bio?: string
  otherInstruments?: string
}

/**
 * Create music request
 */
export interface CreateMusicDto {
  title: string
  artist: string
  genre?: string
  description?: string
  link?: string
  duration?: number
  status?: 'APPROVED' | 'SUGGESTED'
  neededDrums?: number
  neededGuitars?: number
  neededVocals?: number
  neededBass?: number
  neededKeys?: number
}

/**
 * Update music request
 */
export interface UpdateMusicDto {
  title?: string
  artist?: string
  genre?: string
  description?: string
  link?: string
  duration?: number
  status?: 'APPROVED' | 'SUGGESTED'
  neededDrums?: number
  neededGuitars?: number
  neededVocals?: number
  neededBass?: number
  neededKeys?: number
}

/**
 * Create registration request
 */
export interface CreateRegistrationDto {
  musicianId?: string
  scheduleId: string
  instrument?: string
}

/**
 * Create schedule request
 */
export interface CreateScheduleDto {
  jamId: string
  musicId: string
  order: number
  status?: ScheduleStatus
}

/**
 * Update schedule request
 */
export interface UpdateScheduleDto {
  status?: ScheduleStatus
  order?: number
  musicId?: string
}

// ============================================================================
// LIVE DASHBOARD DTOs (from /jams/{id}/live/dashboard endpoint)
// ============================================================================

/**
 * Musician data for dashboard display
 */
export interface DashboardMusicianDto {
  id: string
  name: string
  instrument: string
}

/**
 * Song data for dashboard display (with musicians)
 */
export interface DashboardSongDto {
  id: string
  title: string
  artist: string
  duration: number | null
  musicians: DashboardMusicianDto[]
}

/**
 * Live dashboard response from GET /jams/{id}/live/dashboard
 * Optimized for public dashboard display with current and next songs
 */
export interface LiveDashboardResponseDto {
  jamId: string
  jamName: string
  qrCode: string | null
  slug: string | null
  shortCode: string | null
  jamStatus: JamStatus
  currentSong: DashboardSongDto | null
  nextSongs: DashboardSongDto[]
}

/**
 * Standardized API response wrapper
 * All API responses will be normalized to this format
 */
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

/**
 * API Error object
 */
export interface ApiError {
  message: string
  statusCode: number
  error?: string
  details?: unknown
}

// ============================================================================
// PAGINATION SUPPORT
// ============================================================================

/**
 * Pagination metadata from paginated endpoints
 */
export interface PaginationMeta {
  total: number
  skip: number
  take: number
  hasMore: boolean
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

