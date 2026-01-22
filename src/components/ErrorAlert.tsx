/**
 * Error Alert Component
 * Displays error messages with daisyUI styling
 */

import {memo} from 'react'

interface ErrorAlertProps {
  message?: string | null
  title?: string
  onDismiss?: () => void
  className?: string
}

/**
 * Error Alert Component
 * Shows error message in a red alert box
 */
export const ErrorAlert = memo(function ErrorAlert({ message, title, onDismiss, className = '' }: ErrorAlertProps) {
  if (!message) return null

  return (
    <div className={`alert alert-error ${className}`} role="alert">
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
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="flex-1">
        {title && <h3 className="font-bold">{title}</h3>}
        <div className="text-sm">{message}</div>
      </div>
      {onDismiss && (
        <button className="btn btn-sm btn-ghost" onClick={onDismiss} aria-label="Dismiss error">
          ✕
        </button>
      )}
    </div>
  )
})

