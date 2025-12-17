/**
 * Services Module Exports
 * Central export point for all service functions
 */

export { loginOrRegister, logout } from './authService'
export {
  syncSupabaseUserToBackend,
  updateMusicianProfile,
  logoutFromBackend,
  type BackendSyncResponse,
  type SyncResult,
} from './backendAuthService'

export * as jamService from './jamService'
export { musicianService } from './musicianService'
export { musicService } from './musicService'
export { registrationService } from './registrationService'
export { scheduleService } from './scheduleService'
export { getSocketService } from './socket'
export { getOfflineQueueManager, type QueuedAction, type QueueStats } from './offlineQueue'
export { mapSocketError, getUserErrorMessage, getErrorRecoveryAction, type ErrorInfo } from './socketErrorHandler'

export type { JamDetails } from './jamService'
export type { ISocketService } from '../types/socket.types'

