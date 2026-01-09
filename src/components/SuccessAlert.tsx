/**
 * Success Alert Component
 * Displays success messages with daisyUI styling
 */

import {useEffect} from 'react'

interface SuccessAlertProps {
  message: string
  title?: string
  onDismiss?: () => void
  className?: string
  autoHide?: boolean
  autoHideDelay?: number
}

/**
 * Success Alert Component
 * Shows success message in a green alert box
 */
export function SuccessAlert({
  message,
  title,
  onDismiss,
  className = '',
  autoHide = false,
  autoHideDelay = 3000,
}: SuccessAlertProps) {
  // Auto-hide after delay if enabled
  useEffect(() => {
    if (!autoHide || !onDismiss || !message) return

    const timeoutId = setTimeout(() => {
      onDismiss()
    }, autoHideDelay)

    return () => clearTimeout(timeoutId)
  }, [autoHide, onDismiss, autoHideDelay, message])

  if (!message) return null

  return (
    <div className={`alert alert-success ${className}`} role="alert">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="stroke-current shrink-0 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="flex-1">
        {title && <h3 className="font-bold">{title}</h3>}
        <div className="text-sm">{message}</div>
      </div>
      {onDismiss && (
        <button className="btn btn-sm btn-ghost" onClick={onDismiss} aria-label="Dismiss success message">
          ✕
        </button>
      )}
    </div>
  )
}

