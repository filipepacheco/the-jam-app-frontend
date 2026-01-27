/**
 * Confirm Dialog Component
 * Reusable confirmation dialog for destructive actions
 */

import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface ConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      confirmBtnRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <dialog
      className="modal modal-open"
      role="alertdialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className="modal-box max-w-sm">
        <h3 id="confirm-dialog-title" className="font-bold text-lg mb-2">
          {title}
        </h3>
        <p id="confirm-dialog-message" className="text-base-content/80 whitespace-pre-line">
          {message}
        </p>
        <div className="modal-action">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost"
            disabled={loading}
          >
            {cancelLabel || t('common.cancel')}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className={`btn ${variant === 'destructive' ? 'btn-error' : 'btn-primary'}`}
            disabled={loading}
          >
            {loading && <span className="loading loading-spinner loading-sm" />}
            {confirmLabel || t('common.confirm', 'Confirm')}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onCancel}>
          {t('common.close')}
        </button>
      </form>
    </dialog>
  )
}
