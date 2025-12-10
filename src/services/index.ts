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

export type { JamDetails } from './jamService'

