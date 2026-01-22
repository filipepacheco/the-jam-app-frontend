/**
 * Hooks Module Exports
 * Central export point for all custom hooks
 */

// Authentication hook
export { useAuth } from './useAuth'

// Base hook
export { useQuery, type UseQueryResult } from './useQuery'

// Jam state hook
export { useJamState } from './useJamState'

// Offline queue hook
export { useOfflineQueue, type OfflineQueueState } from './useOfflineQueue'

// UI utility hooks
export { useAppLanguage } from './useAppLanguage'
export { useFullscreen } from './useFullscreen'
export { useConfettiOnSongChange, type UseConfettiOnSongChangeOptions } from './useConfettiOnSongChange'

// Form state hook
export { useFormState } from './useFormState'

// Jam control hook
export { useJamControl } from './useJamControl'
export type { UseJamControlReturn } from '../types/jamControl.types'

// Queue reorder hook
export { useQueueReorder } from './useQueueReorder'
export type { UseQueueReorderReturn } from '../types/jamControl.types'
