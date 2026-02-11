/**
 * Page Alerts Component
 * Renders error and success alerts for page-level state
 */

import { Alert } from './Alert'

interface PageAlertsProps {
  error: string | null
  success: string | null
  onDismissError: () => void
  onDismissSuccess: () => void
  className?: string
}

export function PageAlerts({
  error,
  success,
  onDismissError,
  onDismissSuccess,
  className = '',
}: PageAlertsProps) {
  if (!error && !success) return null

  return (
    <div className={className}>
      <Alert type="error" message={error} onDismiss={onDismissError} />
      <Alert type="success" message={success} onDismiss={onDismissSuccess} autoHide autoHideDelay={5000} />
    </div>
  )
}
