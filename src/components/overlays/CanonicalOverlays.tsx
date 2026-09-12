import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Action } from '../Action'
import './CanonicalOverlays.css'

type OverlaySize = 'sm' | 'md' | 'lg'
type OverlayRole = 'dialog' | 'alertdialog'

interface OverlayProps {
  isOpen: boolean
  onDismiss: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  actions?: ReactNode
  size?: OverlaySize
  className?: string
  closeLabel: string
  dismissible?: boolean
  dismissOnBackdrop?: boolean
  dismissOnEscape?: boolean
  initialFocusRef?: RefObject<HTMLElement | null>
  initialFocus?: 'first-task' | 'heading' | 'safe-action'
  portal?: boolean
  portalTarget?: Element | DocumentFragment | null
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hasAttribute('inert') && element.getAttribute('aria-hidden') !== 'true')
}

function getTaskFocusableElements(container: HTMLElement): HTMLElement[] {
  return getFocusableElements(container)
    .filter((element) => !element.classList.contains('ds-overlay__close'))
}

function isolatePage(root: HTMLElement): () => void {
  const previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  const records: Array<{ element: Element; ariaHidden: string | null; inert: boolean }> = []
  let current: Element = root
  while (current.parentElement) {
    const parent = current.parentElement
    for (const sibling of parent.children) {
      if (sibling !== current) {
        records.push({
          element: sibling,
          ariaHidden: sibling.getAttribute('aria-hidden'),
          inert: sibling.hasAttribute('inert'),
        })
      }
    }
    current = parent
  }

  for (const { element } of records) {
    element.setAttribute('aria-hidden', 'true')
    element.setAttribute('inert', '')
  }

  return () => {
    document.body.style.overflow = previousBodyOverflow
    for (const record of records) {
      if (record.ariaHidden === null) record.element.removeAttribute('aria-hidden')
      else record.element.setAttribute('aria-hidden', record.ariaHidden)
      if (!record.inert) record.element.removeAttribute('inert')
    }
  }
}

function OverlaySurface({
  actions,
  children,
  className = '',
  closeLabel,
  description,
  dismissible = true,
  dismissOnBackdrop = true,
  dismissOnEscape = true,
  initialFocus = 'first-task',
  initialFocusRef,
  isOpen,
  onDismiss,
  portal = true,
  portalTarget,
  role,
  size = 'md',
  title,
  type,
}: OverlayProps & { role: OverlayRole; type: 'modal' | 'drawer' }) {
  const surfaceRef = useRef<HTMLDialogElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!isOpen) return
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const surface = surfaceRef.current
    if (!surface) return

    if (initialFocus === 'heading') {
      headingRef.current?.focus()
      return
    }
    const safeAction = initialFocus === 'safe-action'
      ? surface.querySelector<HTMLElement>('[data-overlay-safe-action]:not(:disabled)')
      : null
    const initialTarget = initialFocusRef?.current ?? safeAction ?? getTaskFocusableElements(surface)[0] ?? getFocusableElements(surface)[0] ?? surface
    initialTarget.focus()
  }, [initialFocus, initialFocusRef, isOpen])

  useEffect(() => {
    if (isOpen) return
    const target = returnFocusRef.current
    if (!target || !document.contains(target)) return
    queueMicrotask(() => target.focus())
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !surfaceRef.current) return
    return isolatePage(surfaceRef.current)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible && dismissOnEscape) {
        event.preventDefault()
        onDismiss()
        return
      }
      if (event.key !== 'Tab' || !surfaceRef.current) return

      const focusable = getFocusableElements(surfaceRef.current)
      if (focusable.length === 0) {
        event.preventDefault()
        surfaceRef.current.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dismissOnEscape, dismissible, isOpen, onDismiss])

  if (!isOpen) return null

  const content = (
    <dialog
      ref={surfaceRef}
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      aria-modal="true"
      className={`ds-overlay ds-overlay--${type}`}
      data-overlay-type={type}
      open
      role={role}
      tabIndex={-1}
    >
      <div
        aria-hidden="true"
        className="ds-overlay__backdrop"
        data-testid="overlay-backdrop"
        onClick={() => { if (dismissible && dismissOnBackdrop) onDismiss() }}
      />
      <div
        className={`ds-overlay__surface ds-overlay__surface--${size} ${className}`}
      >
        <header className="ds-overlay__header">
          <h2 ref={headingRef} id={titleId} className="ds-overlay__title" tabIndex={-1}>{title}</h2>
          <Action aria-label={closeLabel} className="ds-overlay__close" onClick={onDismiss} state={dismissible ? 'idle' : 'disabled'} variant="quiet">
            <Action.Icon><X size={20} /></Action.Icon>
          </Action>
        </header>
        <div className="ds-overlay__body">
          {description && <div id={descriptionId} className="ds-overlay__description">{description}</div>}
          {children}
        </div>
        {actions && <footer className="ds-overlay__footer">{actions}</footer>}
      </div>
    </dialog>
  )

  return portal ? createPortal(content, portalTarget ?? document.body) : content
}

export function OverlayModal(props: OverlayProps) {
  return <OverlaySurface {...props} role="dialog" type="modal" />
}

export function OverlayDrawer(props: OverlayProps) {
  return <OverlaySurface {...props} role="dialog" size="md" type="drawer" />
}

interface ConfirmationDialogProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  title: ReactNode
  description: ReactNode
  confirmLabel: string
  cancelLabel: string
  closeLabel: string
  confirming?: boolean
  confirmingLabel?: string
}

export function ConfirmationDialog({
  cancelLabel,
  closeLabel,
  confirmLabel,
  confirming = false,
  confirmingLabel = `${confirmLabel}…`,
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmationDialogProps) {
  return (
    <OverlaySurface
      actions={
        <OverlayActions>
          <Action data-overlay-safe-action onClick={onCancel} state={confirming ? 'disabled' : 'idle'} variant="quiet">
            <Action.Label>{cancelLabel}</Action.Label>
          </Action>
          {confirming ? (
            <Action loadingLabel={confirmingLabel} state="loading" variant="destructive">
              <Action.Label>{confirmLabel}</Action.Label>
            </Action>
          ) : (
            <Action onClick={onConfirm} variant="destructive">
              <Action.Label>{confirmLabel}</Action.Label>
            </Action>
          )}
        </OverlayActions>
      }
      closeLabel={closeLabel}
      description={description}
      dismissOnBackdrop={!confirming}
      dismissOnEscape={!confirming}
      dismissible={!confirming}
      initialFocus="safe-action"
      isOpen={isOpen}
      onDismiss={onCancel}
      role="alertdialog"
      size="sm"
      title={title}
      type="modal"
    >{null}</OverlaySurface>
  )
}

export function OverlayActions({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`ds-overlay-actions ${className}`}>{children}</div>
}

export function Disclosure({ children, defaultOpen = false, summary }: {
  children: ReactNode
  defaultOpen?: boolean
  summary: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <details className="ds-disclosure" open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <summary className="ds-disclosure__summary ds-focusable ds-type-ui">{summary}</summary>
      <div className="ds-disclosure__content">{children}</div>
    </details>
  )
}
