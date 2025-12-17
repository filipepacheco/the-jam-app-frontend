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

// Live Jam Socket hook
export { useLiveJamSocket } from './useLiveJamSocket'

// Socket hooks
export { useSocket, type UseSocketReturn } from './useSocket'
export { useSocketListeners } from './useSocketListeners'
export { useSocketEmitter } from './useSocketEmitter'
export { useSocketStatus, type SocketStatus } from './useSocketStatus'
export { useSocketError, type SocketErrorState } from './useSocketError'

// Jam state hook
export { useJamState } from './useJamState'

// Offline queue hook
export { useOfflineQueue, type OfflineQueueState } from './useOfflineQueue'

// Connection status hook
export { useConnectionStatus, type ConnectionStatusState } from './useConnectionStatus'


