import { useId, type ReactNode } from 'react'
import { Action } from './Action'
import './FeedbackStates.css'

export type FeedbackTone = 'info' | 'success' | 'warning' | 'error'
export type EmptyStateKind = 'results' | 'first-use' | 'content'

export interface FeedbackAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'quiet' | 'destructive'
}

interface FeedbackActionProps {
  action?: FeedbackAction
}

function renderRecoveryAction({ action }: FeedbackActionProps) {
  if (!action) return null

  return (
    <Action variant={action.variant ?? 'primary'} onClick={action.onClick}>
      <Action.Label>{action.label}</Action.Label>
    </Action>
  )
}

export interface StatusProps extends FeedbackActionProps {
  tone?: FeedbackTone
  title: string
  description?: string
  className?: string
  role?: 'status' | 'alert'
}

/** Persistent, non-blocking feedback placed beside the affected content. */
export function Status({
  action,
  className = '',
  description,
  title,
  tone = 'info',
  role = 'status',
}: StatusProps) {
  const titleId = useId()
  const descriptionId = useId()

  return (
    <section
      className={`ds-feedback ds-feedback--${tone} ${className}`}
      role={role}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      data-feedback-tone={tone}
    >
      <span className="ds-feedback__marker" aria-hidden="true">{tone === 'success' ? '✓' : tone === 'error' ? '!' : tone === 'warning' ? '!' : 'i'}</span>
      <div className="ds-feedback__body">
        <strong id={titleId}>{title}</strong>
        {description && <p id={descriptionId}>{description}</p>}
      </div>
      {renderRecoveryAction({ action })}
    </section>
  )
}

export interface LoadingStateProps {
  label: string
  className?: string
}

/** Progress feedback for a region whose content is not ready yet. */
export function LoadingState({ className = '', label }: LoadingStateProps) {
  return (
    <div className={`ds-feedback ds-feedback--loading ${className}`} role="status" aria-live="polite" aria-busy="true">
      <span data-testid="feedback-spinner" className="loading loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export interface SkeletonProps {
  label: string
  lines?: number
  className?: string
}

/** Structural placeholder that preserves the loading announcement without speaking shapes. */
export function Skeleton({ className = '', label, lines = 3 }: SkeletonProps) {
  const safeLines = Math.max(1, Math.floor(lines))

  return (
    <div className={`ds-feedback-skeleton ${className}`} role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: safeLines }, (_, index) => (
        <span
          key={index}
          data-testid="feedback-skeleton-line"
          className="skeleton h-4 w-full rounded"
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export type SuccessStateProps = Omit<StatusProps, 'tone'>

export function SuccessState(props: SuccessStateProps) {
  return <Status {...props} tone="success" />
}

export type ErrorStateProps = Omit<StatusProps, 'tone'>

export function ErrorState(props: ErrorStateProps) {
  return <Status {...props} tone="error" role="alert" />
}

export interface CanonicalEmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: FeedbackAction | ReactNode
  kind?: EmptyStateKind
  className?: string
}

/** Constructive empty or first-use guidance with one clear next step. */
export function CanonicalEmptyState({
  action,
  className = '',
  description,
  icon,
  kind = 'content',
  title,
}: CanonicalEmptyStateProps) {
  const headingId = useId()
  const actionElement = action && typeof action === 'object' && 'label' in action && 'onClick' in action
    ? renderRecoveryAction({ action: action as FeedbackAction })
    : action

  return (
    <section className={`ds-empty-state ${className}`} aria-labelledby={headingId} role="region" data-empty-kind={kind}>
      {icon && <div className="ds-empty-state__icon" aria-hidden="true">{icon}</div>}
      <h2 id={headingId}>{title}</h2>
      {description && <p>{description}</p>}
      {actionElement && <div className="ds-empty-state__action">{actionElement}</div>}
    </section>
  )
}
