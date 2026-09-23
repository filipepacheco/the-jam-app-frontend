/**
 * Base Modal Component
 * Provides dialog wrapper with escape key, focus management, and backdrop handling
 */

import React, { useEffect, useId, useRef } from 'react'
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
  portalTarget?: Element | DocumentFragment | null
  responsive?: boolean
  role?: 'dialog' | 'alertdialog'
  headingLevel?: 'h2' | 'h3' | 'h4' | 'h5'
}

const SIZE_CLASSES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
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
  portalTarget,
  responsive = false,
  role,
  headingLevel,
}: ModalProps) {
  const { t } = useTranslation()
  const Heading = headingLevel || 'h3'
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

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
    ? 'max-h-[calc(100dvh-1rem)] min-h-0 flex flex-col overflow-hidden p-0 sm:max-h-[85dvh]'
    : ''

  const content = (
    <dialog
      aria-labelledby={titleId}
      aria-modal="true"
      className={`modal modal-open z-[10000] ${responsiveClass}`}
      open
      role={role}
    >
      <div
        ref={modalRef}
        className={`modal-box w-[calc(100%-1rem)] min-w-0 max-w-[calc(100vw-1rem)] sm:w-full ${SIZE_CLASSES[size]} ${scrollableClass} ${className}`}
      >
        {scrollable ? (
          <>
            {/* Fixed Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-base-300 flex min-w-0 items-center justify-between gap-2 shrink-0">
              <Heading id={titleId} className="min-w-0 ds-wrap-user-content font-bold text-lg sm:text-xl">
                {title}
              </Heading>
              {!closeDisabled && (
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost btn-circle min-h-11 min-w-11 shrink-0"
                  aria-label={t('common.close')}
                >
                  <X className="size-5" />
                </button>
              )}
            </div>
            {/* Scrollable Content */}
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
              {children}
            </div>
            {/* Fixed Footer */}
            {footer && (
              <div className="flex min-w-0 flex-wrap justify-end gap-2 border-t border-base-300 bg-base-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:gap-3 sm:px-6 sm:py-4">
                {footer}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Heading id={titleId} className="font-bold text-lg">
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

  return portal ? createPortal(content, portalTarget ?? document.body) : content
}
