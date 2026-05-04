/**
 * Hooks Module Exports
 * Central export point for all custom hooks
 */

// Authentication hook
export { useAuth } from './useAuth'

// Jam state hook
export { useJamState } from './useJamState'

// Offline queue hook
export { useOfflineQueue, type OfflineQueueState } from './useOfflineQueue'

// UI utility hooks
export { useAppLanguage } from './useAppLanguage'
export { useTheme } from './useTheme'
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

// Page-level alert state hook
export { usePageAlerts } from './usePageAlerts'

// Accessibility hook
export { useReducedMotion } from './useReducedMotion'

// Searchable select hook
export { useSearchableSelect } from './useSearchableSelect'

// Dashboard carousel hooks
export { useCarouselCycle } from './useCarouselCycle'
export { useDashboardLayout } from './useDashboardLayout'
export type { DashboardLayout } from './useDashboardLayout'
