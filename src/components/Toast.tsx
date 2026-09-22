import {useCallback, useEffect, useMemo, useRef, useState, type ReactNode} from 'react'
import {Check, CircleAlert, Info, TriangleAlert, X} from 'lucide-react'
import {useTranslation} from 'react-i18next'
import {ToastContext, type ToastInput, type ToastTone} from './ToastContext'

interface ToastMessage extends Required<Pick<ToastInput, 'message' | 'tone' | 'duration'>> {
  id: string
  title?: string
}

const DEFAULT_DURATION = 4000
const MAX_VISIBLE_TOASTS = 3

const toneClasses: Record<ToastTone, string> = {
  success: 'border-success/30 bg-base-100 text-base-content',
  info: 'border-info/30 bg-base-100 text-base-content',
  warning: 'border-warning/40 bg-base-100 text-base-content',
  error: 'border-error/30 bg-base-100 text-base-content',
}

const iconClasses: Record<ToastTone, string> = {
  success: 'bg-success text-success-content',
  info: 'bg-info text-info-content',
  warning: 'bg-warning text-warning-content',
  error: 'bg-error text-error-content',
}

const toneIcons = {
  success: Check,
  info: Info,
  warning: TriangleAlert,
  error: CircleAlert,
} satisfies Record<ToastTone, typeof Check>

function ToastItem({toast, onDismiss}: {toast: ToastMessage; onDismiss: () => void}) {
  const {t} = useTranslation()
  const Icon = toneIcons[toast.tone]

  return (
    <div
      className={`pointer-events-auto grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-box border p-3 shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 ${toneClasses[toast.tone]}`}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      data-toast-tone={toast.tone}
    >
      <span className={`mt-0.5 inline-flex size-6 items-center justify-center rounded-full ${iconClasses[toast.tone]}`} aria-hidden="true">
        <Icon className="size-4" strokeWidth={2.5} />
      </span>
      <div className="min-w-0 self-center">
        {toast.title && <p className="font-semibold leading-snug">{toast.title}</p>}
        <p className="ds-wrap-user-content text-sm leading-snug">{toast.message}</p>
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-circle ds-control ds-focusable -m-2 size-11 min-h-11"
        onClick={onDismiss}
        aria-label={t('common.dismiss')}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export function ToastProvider({children}: {children: ReactNode}) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const toastsRef = useRef<ToastMessage[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const nextId = useRef(0)

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
    toastsRef.current = toastsRef.current.filter((toast) => toast.id !== id)
    setToasts(toastsRef.current)
  }, [])

  const scheduleDismissal = useCallback((id: string, duration: number) => {
    const currentTimer = timers.current.get(id)
    if (currentTimer) clearTimeout(currentTimer)
    timers.current.set(id, setTimeout(() => dismissToast(id), duration))
  }, [dismissToast])

  const showToast = useCallback((input: ToastInput) => {
    const tone = input.tone ?? 'success'
    const duration = input.duration ?? DEFAULT_DURATION
    const duplicate = toastsRef.current.find((toast) => toast.message === input.message && toast.tone === tone)

    if (duplicate) {
      scheduleDismissal(duplicate.id, duration)
      return duplicate.id
    }

    const id = `toast-${++nextId.current}`
    const toast: ToastMessage = {...input, id, tone, duration}
    const next = [...toastsRef.current, toast]
    const removed = next.slice(0, Math.max(0, next.length - MAX_VISIBLE_TOASTS))
    removed.forEach(({id: removedId}) => {
      const timer = timers.current.get(removedId)
      if (timer) clearTimeout(timer)
      timers.current.delete(removedId)
    })
    toastsRef.current = next.slice(-MAX_VISIBLE_TOASTS)
    setToasts(toastsRef.current)
    scheduleDismissal(id, duration)
    return id
  }, [scheduleDismissal])

  useEffect(() => () => {
    timers.current.forEach((timer) => clearTimeout(timer))
    timers.current.clear()
  }, [])

  const value = useMemo(() => ({showToast, dismissToast}), [dismissToast, showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-50 mx-auto flex max-w-sm flex-col gap-2 sm:bottom-6"
        data-toast-viewport
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
