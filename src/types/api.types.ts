/**
 * API Type Definitions
 * Generated from Swagger specification (.github/swagger.json)
 *
 * This file contains all TypeScript interfaces and types matching the backend API
 */

// ============================================================================
// TYPE CONSTANTS (String Literal Types)
// ============================================================================

/**
 * Jam session status
 */
export type JamStatus = 'ACTIVE' | 'INACTIVE' | 'FINISHED'

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

/**
 * Authentication response from backend
 * Returned by POST /auth/login, POST /auth/sync-user, GET /auth/me
 */
export interface BackendAuthResponseDto {
  userId: string
  name?: string
  email?: string
  phone?: string
  isHost: boolean
  token: string
  isNewUser: boolean
  instrument?: string
  level?: MusicianLevel
}

// ============================================================================
// RESPONSE DTOs (from backend)
// ============================================================================

/**
 * Musician response from API
 */
export interface MusicianResponseDto {
  id: string
  name: string
  instrument: string
  level: MusicianLevel
    contact: string
    phone: string
  createdAt: string
}

/**
 * Music response from API
 */
export interface MusicResponseDto {
  id: string
  title: string
  artist: string
genre?: string
  description?: string
  link?: string
  duration?: number
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
  scheduleId: string
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
  music: MusicResponseDto
}

/**
 * Jam session response from API
 */
export interface JamResponseDto {
  id: string
  name: string
  hostName: string
  description?: string
  date?: string
  qrCode?: string
  status: JamStatus
  createdAt: string
  updatedAt: string
  jamMusics?: JamMusicResponseDto[]
  registrations?: RegistrationResponseDto[]
  schedules?: ScheduleResponseDto[]
}

// ============================================================================
// REQUEST DTOs (to backend)
// ============================================================================

/**
 * Create jam session request
 */
export interface CreateJamDto {
  name: string
  description?: string
  date?: string
  location: string
  hostMusicianId?: string
  hostName?: string
  hostContact?: string
  qrCode?: string
  status?: JamStatus
}

/**
 * Update jam session request
 */
export interface UpdateJamDto {
  status?: JamStatus
}

/**
 * Create musician request
 */
export interface CreateMusicianDto {
  name: string
  contact: string
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
  musicianId: string
  jamMusicId: string
  scheduleId?: string
  instrument?: string
}

/**
 * Create schedule request
 */
export interface CreateScheduleDto {
  jamId: string
  musicId: string
  registrationId: string
  order: number
  status?: ScheduleStatus
}

/**
 * Update schedule request
 */
export interface UpdateScheduleDto {
  order?: number
  status?: ScheduleStatus
}

// ============================================================================
// STANDARDIZED API RESPONSE WRAPPER
// ============================================================================

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
// PAGINATION SUPPORT (for future use)
// ============================================================================

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Loading state for async operations
 */
export interface LoadingState {
  loading: boolean
  error: string | null
}

/**
 * Hook return type with data, loading, and error
 */
export interface UseQueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}
