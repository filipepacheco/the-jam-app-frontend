import { memo, useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

type AlertType = 'error' | 'warning' | 'success' | 'info'

export interface AlertProps {
  type: AlertType
  message: string | null | undefined
  title?: string
  onDismiss?: () => void
  className?: string
  autoHide?: boolean
  autoHideDelay?: number
  action?: ReactNode
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
  action,
}: AlertProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!autoHide || !onDismiss || !message) return
    const timeoutId = setTimeout(onDismiss, autoHideDelay)
    return () => clearTimeout(timeoutId)
  }, [autoHide, onDismiss, autoHideDelay, message])

  if (!message) return null

  return (
    <div
      className={`alert ${ALERT_CLASSES[type]} flex flex-col items-stretch gap-1.5 rounded-box border border-current/15 px-3 py-2.5 sm:px-4 sm:py-3 ${className}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mt-0.5 size-4 shrink-0 stroke-current"
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
        <div className="min-w-0">
          {title && <h3 className="font-bold">{title}</h3>}
          <div className="text-sm leading-snug">{message}</div>
        </div>
        {onDismiss && (
          <button className="btn btn-sm btn-ghost btn-circle ds-focusable -m-1" onClick={onDismiss} aria-label={t('common.dismiss')}>
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {action && (
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap [&_.ds-action]:w-full sm:[&_.ds-action]:w-auto">
          {action}
        </div>
      )}
    </div>
  )
})
