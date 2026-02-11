/**
 * Confirm Dialog Component
 * Reusable confirmation dialog for destructive actions
 */

import { useTranslation } from 'react-i18next'
import { Modal } from './Modal'
import { ModalFooter } from './ModalFooter'

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

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      role="alertdialog"
      footer={
        <ModalFooter
          onCancel={onCancel}
          onSubmit={onConfirm}
          submitLabel={confirmLabel || t('common.confirm', 'Confirm')}
          cancelLabel={cancelLabel}
          submitVariant={variant === 'destructive' ? 'error' : 'primary'}
          submitting={loading}
        />
      }
    >
      <p className="text-base-content/80 whitespace-pre-line">
        {message}
      </p>
    </Modal>
  )
}
