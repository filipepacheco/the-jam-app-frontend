import { useEffect, useRef, useState } from 'react'
import { EmptyState } from '../../../components/EmptyState'

export function ActionableEmptyStateExample() {
  const [composerOpen, setComposerOpen] = useState(false)

  return (
    <section className="card max-w-2xl bg-base-200 shadow-sm" aria-labelledby="empty-state-heading">
      <div className="card-body">
        <h2 id="empty-state-heading" className="card-title">Empty state with a next step</h2>
        <EmptyState
          icon="🎵"
          title="No songs in tonight’s schedule"
          description="Add the first song to give musicians something to join."
          action={(
            <button
              type="button"
              className="btn btn-primary ds-control ds-focusable"
              onClick={() => setComposerOpen(true)}
            >
              Add the first song
            </button>
          )}
        />
        {composerOpen && <p role="status">Song picker opened. Choose a song to add to the schedule.</p>}
      </div>
    </section>
  )
}

export function DestructiveActionExample() {
  const [open, setOpen] = useState(false)
  const [removed, setRemoved] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const shouldRestoreFocusRef = useRef(false)

  useEffect(() => {
    if (open) {
      closeRef.current?.focus()
    } else if (shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false
      triggerRef.current?.focus()
    }
  }, [open])

  const close = () => {
    shouldRestoreFocusRef.current = true
    setOpen(false)
  }

  return (
    <section className="card max-w-2xl bg-base-200 shadow-sm" aria-labelledby="destructive-heading">
      <div className="card-body gap-4">
        <div data-testid="destructive-background" inert={open} aria-hidden={open}>
          <div>
            <h2 id="destructive-heading" className="card-title">Destructive action</h2>
            <p id="song-description">Midnight Train — The Commuters · scheduled for 22:10</p>
          </div>
          <button
            ref={triggerRef}
            type="button"
            className="btn btn-error mt-4 w-fit ds-control ds-focusable"
            aria-describedby="song-description"
            onClick={() => setOpen(true)}
          >
            Remove song
          </button>

          {removed && <p className="mt-4" role="status">Song removed from the schedule.</p>}
        </div>

        {open && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-neutral/70 p-4" onKeyDown={(event) => {
            if (event.key === 'Escape') close()
          }}>
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="remove-title"
              aria-describedby="remove-description"
              className="card w-full max-w-md bg-base-100 shadow-xl"
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  event.stopPropagation()
                  close()
                  return
                }

                if (event.key !== 'Tab') return
                const first = closeRef.current
                const last = confirmRef.current
                if (!first || !last) return
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault()
                  last.focus()
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault()
                  first.focus()
                }
              }}
            >
              <div className="card-body">
                <div className="flex items-start justify-between gap-3">
                  <h3 id="remove-title" className="card-title">Remove “Midnight Train”?</h3>
                  <button
                    ref={closeRef}
                    type="button"
                    className="btn btn-ghost btn-sm ds-focusable"
                    aria-label="Close confirmation"
                    onClick={close}
                  >
                    ×
                  </button>
                </div>
                <p id="remove-description">This removes the song from tonight’s schedule. This action cannot be undone.</p>
                <div className="card-actions justify-end">
                  <button type="button" className="btn ds-control ds-focusable" onClick={close}>Cancel</button>
                  <button ref={confirmRef} type="button" className="btn btn-error ds-control ds-focusable" onClick={() => {
                    setRemoved(true)
                    close()
                  }}>
                    Remove song
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
