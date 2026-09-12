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
  ErrorState,
  LoadingState,
  Skeleton,
  Status,
  SuccessState,
} from './FeedbackStates'
export type {
  EmptyStateKind,
  FeedbackAction,
  FeedbackTone,
  LoadingStateProps,
  SkeletonProps,
  StatusProps,
} from './FeedbackStates'
export { Action, IconAction } from './Action'
export type { ActionProps, ActionState, ActionVariant, IconActionProps } from './Action'
export {
  Badge,
  CompactMetadata,
  DataCard,
  ListRow,
  StatusIndicator,
} from './data-display'
export type {
  BadgeProps,
  BadgeSize,
  CompactMetadataItem,
  CompactMetadataProps,
  DataCardProps,
  DataDisplayDensity,
  DataDisplayTone,
  ListRowProps,
  StatusIndicatorProps,
  StatusTone,
} from './data-display'
export { Field, FormSubmissionFeedback } from './Field'
export type { FieldInputProps, FieldProps, FieldSelectProps, FieldTextareaProps, FormSubmissionState } from './Field'
export { ConfirmationDialog, Disclosure, OverlayActions, OverlayDrawer, OverlayModal } from './overlays'
export {
  DropdownMenu,
  NavigationAction,
  NavigationLink,
  NavigationTabs,
  NavLink,
  OverflowMenu,
  ResponsiveNavigation,
  Tabs,
} from './Navigation'
export type {
  DropdownMenuProps,
  NavigationActionProps,
  NavigationLinkProps,
  NavigationLinkVariant,
  NavigationMenuItem,
  NavigationTabItem,
  NavigationTabsProps,
  OverflowMenuProps,
  ResponsiveNavigationProps,
} from './Navigation'

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
export { MusicCard } from './MusicCard'
export { QuickEditPanel } from './QuickEditPanel'
export { MusicFilters } from './MusicFilters'
export { MusicModalFormFields } from './MusicModalFormFields'
export { MusicEmptyState } from './MusicEmptyState'
export { MusicModal } from './MusicModal'
export { ConfirmDialog } from './ConfirmDialog'

// Schedule Components
export {
  ScheduleStatusBadge,
  ScheduleActionButtons,
  SongInfo,
  RegistrationList,
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
export { SongQueueTimeline, QueueStats } from './dj-control'
