/**
 * Hooks Module Exports
 * Central export point for all custom hooks
 */

// Authentication hook
export { useAuth } from './useAuth'

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

// Queue reorder hooks
export { useQueueReorder } from './useQueueReorder'
export type { UseQueueReorderReturn } from '../types/jamControl.types'
export { useMouseReorder } from './useMouseReorder'
export type { UseMouseReorderReturn } from './useMouseReorder'
export { useTouchReorder } from './useTouchReorder'
export type { UseTouchReorderReturn } from './useTouchReorder'
export { useKeyboardReorder } from './useKeyboardReorder'
export type { UseKeyboardReorderReturn } from './useKeyboardReorder'

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
