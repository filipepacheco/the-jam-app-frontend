import { memo, useEffect } from 'react'

type AlertType = 'error' | 'warning' | 'success' | 'info'

interface AlertProps {
  type: AlertType
  message: string | null | undefined
  title?: string
  onDismiss?: () => void
  className?: string
  autoHide?: boolean
  autoHideDelay?: number
}

const ALERT_ICONS: Record<AlertType, string> = {
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
}

const ALERT_CLASSES: Record<AlertType, string> = {
  error: 'alert-error',
  warning: 'alert-warning',
  success: 'alert-success',
  info: 'alert-info',
}

export const Alert = memo(function Alert({
  type,
  message,
  title,
  onDismiss,
  className = '',
  autoHide = false,
  autoHideDelay = 3000,
}: AlertProps) {
  useEffect(() => {
    if (!autoHide || !onDismiss || !message) return
    const timeoutId = setTimeout(onDismiss, autoHideDelay)
    return () => clearTimeout(timeoutId)
  }, [autoHide, onDismiss, autoHideDelay, message])

  if (!message) return null

  return (
    <div className={`alert ${ALERT_CLASSES[type]} ${className}`} role="alert">
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
          d={ALERT_ICONS[type]}
        />
      </svg>
      <div className="flex-1">
        {title && <h3 className="font-bold">{title}</h3>}
        <div className="text-sm">{message}</div>
      </div>
      {onDismiss && (
        <button className="btn btn-sm btn-ghost" onClick={onDismiss} aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  )
})
