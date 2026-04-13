/**
 * Base Modal Component
 * Provides dialog wrapper with escape key, focus management, and backdrop handling
 */

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string | React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  closeDisabled?: boolean
  className?: string
  scrollable?: boolean
  portal?: boolean
  responsive?: boolean
  role?: 'dialog' | 'alertdialog'
  headingLevel?: 'h2' | 'h3' | 'h4' | 'h5'
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
} as const

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeDisabled = false,
  className = '',
  scrollable = false,
  portal = false,
  responsive = false,
  role,
  headingLevel,
}: ModalProps) {
  const { t } = useTranslation()
  const Heading = headingLevel || 'h3'
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus management
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    if (firstElement) firstElement.focus()
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !closeDisabled) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeDisabled, onClose])

  if (!isOpen) return null

  const responsiveClass = responsive ? 'modal-bottom sm:modal-middle' : ''
  const scrollableClass = scrollable
    ? 'max-h-[90vh] flex flex-col p-0'
    : ''

  const content = (
    <dialog className={`modal modal-open ${responsiveClass}`} role={role}>
      <div
        ref={modalRef}
        className={`modal-box ${SIZE_CLASSES[size]} w-full ${scrollableClass} ${className}`}
      >
        {scrollable ? (
          <>
            {/* Fixed Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-base-300 flex items-center justify-between shrink-0">
              <Heading className="font-bold text-lg sm:text-xl">
                {title}
              </Heading>
              {!closeDisabled && (
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost btn-sm btn-circle"
                  aria-label={t('common.close')}
                >
                  <X className="size-5" />
                </button>
              )}
            </div>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {children}
            </div>
            {/* Fixed Footer */}
            {footer && (
              <div className="px-4 sm:px-6 py-4 border-t border-base-300 flex justify-end gap-3 shrink-0 bg-base-100">
                {footer}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Heading className="font-bold text-lg">
                {title}
              </Heading>
              {!closeDisabled && (
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost btn-sm btn-circle"
                  aria-label={t('common.close')}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {/* Content */}
            {children}
            {/* Footer */}
            {footer && (
              <div className="modal-action">
                {footer}
              </div>
            )}
          </>
        )}
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop">
        <button
          type="button"
          onClick={() => { if (!closeDisabled) onClose() }}
          disabled={closeDisabled}
        >
          {t('common.close')}
        </button>
      </form>
    </dialog>
  )

  return portal ? createPortal(content, document.body) : content
}
