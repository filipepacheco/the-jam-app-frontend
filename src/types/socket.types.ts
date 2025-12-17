/**
 * Socket.IO Event Type Definitions
 * TypeScript interfaces for all client↔server WebSocket events
 */

import type {JamResponseDto, MusicianResponseDto, RegistrationResponseDto, ScheduleResponseDto,} from './api.types'

// ============================================================================
// RESPONSE PAYLOADS (Server → Client)
// ============================================================================

/**
 * Live state synchronization payload
 * Sent when client requests state or on initial connection
 * Matches AsyncAPI spec: live:state-sync message
 */
export interface LiveStateSyncPayload {
  jamId: string
  state: JamResponseDto
  timestamp: string // ISO date-time format
}

/**
 * Schedule creation event payload
 */
export interface ScheduleCreatedPayload {
  jamId: string
  schedule: ScheduleResponseDto
  timestamp?: string // ISO date-time
}

/**
 * Schedule update event payload
 */
export interface ScheduleUpdatedPayload {
  jamId: string
  scheduleId: string
  updates: Partial<ScheduleResponseDto>
  timestamp?: string // ISO date-time
}

/**
 * Schedule reorder event payload
 */
export interface ScheduleReorderedPayload {
  jamId: string
  newOrder: string[] // scheduleIds in new order
  schedules: ScheduleResponseDto[]
  timestamp: number
}

/**
 * Registration creation event payload
 */
export interface RegistrationCreatedPayload {
  jamId: string
  registration: RegistrationResponseDto
  timestamp: number
}

/**
 * Registration approval event payload
 */
export interface RegistrationApprovedPayload {
  jamId: string
  registrationId: string
  musicianId: string
  scheduleId: string
  registration: RegistrationResponseDto
  timestamp: number
}

/**
 * Registration rejection event payload
 */
export interface RegistrationRejectedPayload {
  jamId: string
  registrationId: string
  musicianId: string
  scheduleId: string
  reason?: string
  timestamp: number
}

/**
 * Musician joined event payload
 * Matches AsyncAPI spec: musicianJoined message
 */
export interface MusicianJoinedPayload {
  jamId: string
  musicianId: string | null
  musicianName: string | null
  role: 'host' | 'musician' | 'public'
  timestamp: string // ISO date-time format
}

/**
 * Musician left event payload
 * Matches AsyncAPI spec: musicianLeft message
 */
export interface MusicianLeftPayload {
  jamId: string
  musicianId: string | null
  musicianName: string | null
  role: 'host' | 'musician' | 'public'
  timestamp: string // ISO date-time format
}

/**
 * Musician connected event payload
 */
export interface MusicianConnectedPayload {
  jamId: string
  musician: MusicianResponseDto
  timestamp: string // ISO date-time format
}

/**
 * Musician disconnected event payload
 */
export interface MusicianDisconnectedPayload {
  jamId: string
  musicianId: string
  musicianName: string | null
  disconnectedAt: string // ISO date-time format
}

/**
 * Socket error event payload
 */
export interface SocketErrorPayload {
  code: string
  message: string
  context?: Record<string, any>
  timestamp: number
}

/**
 * Action executed event payload (generic jam action)
 */
export interface ActionExecutedPayload {
  jamId: string
  action: string
  data: any
  timestamp: number
}

/**
 * Current performance update payload
 * Matches AsyncAPI spec: currentPerformance message
 */
export interface CurrentPerformancePayload {
  jamId: string
  currentSchedule: ScheduleResponseDto | null
  nextSchedules: ScheduleResponseDto[]
  timestamp?: string // ISO date-time
}

/**
 * Schedule status changed payload
 * Matches AsyncAPI spec: schedule:status-changed message
 */
export interface ScheduleStatusChangedPayload {
  jamId: string
  scheduleId: string
  previousStatus: string
  newStatus: string
  timestamp: string // ISO date-time
}

// ============================================================================
// REQUEST PAYLOADS (Client → Server)
// ============================================================================

/**
 * Join jam request payload
 */
export interface JoinJamPayload {
  jamId: string
  token?: string
}

/**
 * Leave jam request payload
 */
export interface LeaveJamPayload {
  jamId: string
}

/**
 * Host request state payload
 */
export interface HostRequestStatePayload {
  jamId: string
}

/**
 * Musician request state payload
 */
export interface MusicianRequestStatePayload {
  jamId: string
}

/**
 * Public request state payload
 */
export interface PublicRequestStatePayload {
  jamId: string
}

/**
 * Musician ready signal payload
 */
export interface MusicianReadyPayload {
  jamId: string
  scheduleId: string
}

// ============================================================================
// SOCKET EVENT INTERFACES
// ============================================================================

/**
 * Server to Client Events
 * Events sent from backend socket server to frontend clients
 */
export interface ServerToClientEvents {
  // Connection events (Socket.IO native)
  connect: () => void
  disconnect: (reason: string) => void
  connect_error: (error: Error) => void

  // State management
  'live:state-sync': (data: LiveStateSyncPayload) => void
  'jam:action-executed': (data: ActionExecutedPayload) => void

  // Schedule events
  'schedule:created': (data: ScheduleCreatedPayload) => void
  'schedule:updated': (data: ScheduleUpdatedPayload) => void
  'schedule:reordered': (data: ScheduleReorderedPayload) => void
  'schedule:status-changed': (data: ScheduleStatusChangedPayload) => void

  // Registration events
  'registration:created': (data: RegistrationCreatedPayload) => void
  'registration:approved': (data: RegistrationApprovedPayload) => void
  'registration:rejected': (data: RegistrationRejectedPayload) => void

  // Musician events
  musicianJoined: (data: MusicianJoinedPayload) => void
  musicianLeft: (data: MusicianLeftPayload) => void
  'musician:connected': (data: MusicianConnectedPayload) => void
  'musician:disconnected': (data: MusicianDisconnectedPayload) => void

  // Performance updates
  currentPerformance: (data: CurrentPerformancePayload) => void

  // Error events
  error: (data: SocketErrorPayload) => void
}

/**
 * Client to Server Events
 * Events sent from frontend clients to backend socket server
 */
export interface ClientToServerEvents {
  // Connection
  'joinJam': (data: JoinJamPayload) => void
  'leaveJam': (data: LeaveJamPayload) => void

  // State requests
  'host:request-state': (data: HostRequestStatePayload) => void
  'musician:request-state': (data: MusicianRequestStatePayload) => void
  'public:request-state': (data: PublicRequestStatePayload) => void

  // Actions
  'musician:ready': (data: MusicianReadyPayload) => void
}

// ============================================================================
// CONNECTION STATE TYPES
// ============================================================================

/**
 * Socket connection state
 */
export type SocketConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * Socket service instance interface
 */
export interface ISocketService {
  isConnected(): boolean
  getConnectionState(): SocketConnectionState
  connect(token?: string): Promise<void>
  disconnect(): void
  setToken(token: string): void
  emit<K extends keyof ClientToServerEvents>(
    event: K,
    data: Parameters<ClientToServerEvents[K]>[0]
  ): Promise<void>
  on<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K]
  ): void
  off<K extends keyof ServerToClientEvents>(
    event: K,
    callback?: ServerToClientEvents[K]
  ): void
  once<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K]
  ): void
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Socket error codes
 */
export type SocketErrorCode =
  | 'AUTH_ERROR'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'INVALID_PAYLOAD'
  | 'UNKNOWN_EVENT'
  | 'TIMEOUT'

/**
 * Socket error with code
 */
export interface SocketError extends Error {
  code: SocketErrorCode
  context?: Record<string, any>
}

