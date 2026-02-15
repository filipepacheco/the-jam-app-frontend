/**
 * Components Module Exports
 * Central export point for all components
 */

export { Alert } from './Alert'
export { FullPageSpinner } from './FullPageSpinner'
export { PageAlerts } from './PageAlerts'
export { Modal } from './Modal'
export { ModalFooter } from './ModalFooter'
export { EmptyState } from './EmptyState'

export {
  ProtectedRoute,
  HostOnly,
  UserOnly,
  AuthenticatedOnly,
  ViewerOnly,
} from './RouteGuards'

// Phase 4: Components
export { JamContextDisplay } from './JamContextDisplay'
export { JamCard } from './JamCard'
export { JamCardSkeleton } from './JamCardSkeleton'
export { PageHeaderSkeleton } from './PageHeaderSkeleton'
export { ScheduleCardSkeleton } from './ScheduleCardSkeleton'
export { SidebarSectionSkeleton } from './SidebarSectionSkeleton'

// Music Components
export { MusicTableRow, MusiciansBadges } from './MusicTable'
export { MusicCard } from './MusicCard'
export { MusicFilters } from './MusicFilters'
export { MusicModalFormFields } from './MusicModalFormFields'
export { MusicEmptyState } from './MusicEmptyState'
export { MusicModal } from './MusicModal'
export { ConfirmDialog } from './ConfirmDialog'

// Schedule Components
export {
  ScheduleCardManagement,
  ScheduleStatusBadge,
  ScheduleActionButtons,
  SongInfo,
  RegistrationList,
  ScheduleDisplayItem,
  ScheduleEnrollmentModal,
} from './schedule'
export { SupabaseLoginForm } from './forms/SupabaseLoginForm'
export { OAuthButton } from './forms/OAuthButton'
export { JamRegistrationForm } from './forms/JamRegistrationForm'
export { OnboardingModal } from './OnboardingModal'
export { ProfileSetupModal } from './ProfileSetupModal'

// Spotify Components
export { SpotifyImportModal } from './SpotifyImportModal'
export { SpotifyExportModal } from './SpotifyExportModal'
export { SpotifyPreview, SpotifyPlayButton, isSpotifyTrackLink } from './SpotifyPreview'

// DJ Control Components
export { SongQueueTimeline, TimelineSongItem, QueueStats } from './dj-control'
