import { CanonicalEmptyState, type CanonicalEmptyStateProps } from './FeedbackStates'

export type EmptyStateProps = CanonicalEmptyStateProps

export function EmptyState(props: EmptyStateProps) {
  return <CanonicalEmptyState {...props} />
}
