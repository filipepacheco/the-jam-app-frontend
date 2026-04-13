/**
 * Modal Footer Component
 * Standard cancel/submit button pattern for modals
 */

import { useTranslation } from 'react-i18next'
import React from "react";

interface ModalFooterProps {
  onCancel: () => void
  onSubmit?: () => void
  submitLabel: string
  cancelLabel?: string
  submitVariant?: 'primary' | 'error'
  submitting?: boolean
  submitDisabled?: boolean
  children?: React.ReactNode
}

export function ModalFooter({
  onCancel,
  onSubmit,
  submitLabel,
  cancelLabel,
  submitVariant = 'primary',
  submitting = false,
  submitDisabled = false,
  children,
}: ModalFooterProps) {
  const { t } = useTranslation()

  if (children) return <>{children}</>

  const btnClass = submitVariant === 'error' ? 'btn-error' : 'btn-primary'

  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="btn btn-ghost"
        disabled={submitting}
      >
        {cancelLabel || t('common.cancel')}
      </button>
      {onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          className={`btn ${btnClass}`}
          disabled={submitting || submitDisabled}
        >
          {submitting && <span className="loading loading-spinner loading-sm"></span>}
          {submitLabel}
        </button>
      )}
    </>
  )
}
