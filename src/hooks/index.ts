/**
 * Hooks Module Exports
 * Central export point for all custom hooks
 */

// Authentication hook
export { useAuth } from './useAuth'

// Base hook
export { useQuery, type UseQueryResult } from './useQuery'

// Jam hooks
export { useJam, useJams } from './useJam'

// Musician hooks
export { useMusician, useMusicians } from './useMusician'

// Music hooks
export { useMusic, useAllMusic, useMusicByJam } from './useMusic'

// Registration hooks
export { useRegistrationsByJam, useRegistrationsByMusician } from './useRegistration'

// Schedule hooks
export { useScheduleByJam, useScheduleByMusician } from './useSchedule'


// Jam state hook
export { useJamState } from './useJamState'

// Dashboard live hook (polling for public dashboard)
export { useDashboardLive, type UseDashboardLiveReturn } from './useDashboardLive'

// Offline queue hook
export { useOfflineQueue, type OfflineQueueState } from './useOfflineQueue'

// UI utility hooks
export { useAppLanguage } from './useAppLanguage'
export { useFullscreen } from './useFullscreen'
export { useConfettiOnSongChange, type UseConfettiOnSongChangeOptions } from './useConfettiOnSongChange'
