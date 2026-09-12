import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  ConfirmationDialog,
  Disclosure,
  OverlayDrawer,
  OverlayModal,
} from '../components/overlays'

function ModalHarness({ portal = true }: { portal?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div data-testid="application-content">
      <button type="button" onClick={() => setIsOpen(true)}>Edit performance</button>
      <OverlayModal
        isOpen={isOpen}
        onDismiss={() => setIsOpen(false)}
        closeLabel="Close dialog"
        portal={portal}
        title="Edit performance"
        description="Update the arrangement before the next song."
      >
        <label htmlFor="arrangement">Arrangement</label>
        <input id="arrangement" defaultValue="End on the final chorus" />
      </OverlayModal>
    </div>
  )
}

describe('canonical overlays', () => {
  it('names a modal, contains focus and scrolling, and restores the invoking control after Escape or backdrop dismissal', async () => {
    const user = userEvent.setup()
    render(<ModalHarness />)

    const trigger = screen.getByRole('button', { name: 'Edit performance' })
    await user.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Edit performance' })
    expect(dialog).toHaveAccessibleDescription('Update the arrangement before the next song.')
    expect(screen.getByRole('textbox', { name: 'Arrangement' })).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')
    expect(screen.getByTestId('application-content').closest('[inert]')).not.toBeNull()
    await user.tab()
    expect(within(dialog).getByRole('button', { name: 'Close dialog' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('textbox', { name: 'Arrangement' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    await user.click(screen.getByTestId('overlay-backdrop'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('defaults confirmation focus to the safe action and keeps a destructive decision explicit', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ConfirmationDialog
        isOpen
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="Remove Midnight Train?"
        description="This cannot be undone."
        confirmLabel="Remove song"
        cancelLabel="Cancel"
        closeLabel="Close confirmation"
      />,
    )

    const dialog = screen.getByRole('alertdialog', { name: 'Remove Midnight Train?' })
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus()
    expect(within(dialog).getByRole('button', { name: 'Remove song' })).toHaveAttribute('data-action-variant', 'destructive')

    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('isolates the surrounding application even when a consumer renders locally', async () => {
    const user = userEvent.setup()
    render(<ModalHarness portal={false} />)

    const trigger = screen.getByRole('button', { name: 'Edit performance' })
    await user.click(trigger)
    expect(trigger).toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('hidden')

    await user.keyboard('{Escape}')
    expect(trigger).not.toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('')
  })

  it('does not dismiss a confirmation while its destructive action is submitting', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(
      <ConfirmationDialog
        isOpen
        onCancel={onCancel}
        onConfirm={vi.fn()}
        title="Remove Midnight Train?"
        description="The song is being removed."
        confirmLabel="Remove song"
        cancelLabel="Cancel"
        closeLabel="Close confirmation"
        confirming
        confirmingLabel="Removing song…"
      />,
    )

    const close = screen.getByRole('button', { name: 'Close confirmation' })
    expect(close).toBeDisabled()
    await user.click(close)
    await user.keyboard('{Escape}')
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('uses a modal dialog only for the drawer and leaves disclosure in the document flow', async () => {
    const onDismiss = vi.fn()
    render(
      <>
        <OverlayDrawer isOpen onDismiss={onDismiss} closeLabel="Close navigation menu" title="Navigation menu">
          <a href="/jams">Browse jams</a>
        </OverlayDrawer>
        <Disclosure summary="Schedule filters">Filters stay in the page flow.</Disclosure>
      </>,
    )

    expect(screen.getByRole('dialog', { name: 'Navigation menu' })).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Filters stay in the page flow.').closest('[role="dialog"]')).toBeNull()
    expect(screen.getByText('Schedule filters').closest('details')).not.toBeNull()
  })

  it('keeps a disclosure interactive without applying dialog semantics', async () => {
    const user = userEvent.setup()
    render(<Disclosure summary="Schedule filters">Filters stay in the page flow.</Disclosure>)

    const summary = screen.getByText('Schedule filters')
    const disclosure = summary.closest('details')
    expect(disclosure).not.toHaveAttribute('open')
    await user.click(summary)
    expect(disclosure).toHaveAttribute('open')
    expect(disclosure?.closest('[role="dialog"]')).toBeNull()
  })

  it('keeps scrolling and responsive action layout inside the canonical overlay tokens', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/overlays/CanonicalOverlays.css'), 'utf8')

    expect(css).toContain('.ds-overlay__body')
    expect(css).toContain('overflow-y: auto')
    expect(css).toContain('overscroll-behavior: contain')
    expect(css).toContain('@media (min-width: 64rem)')
    expect(css).toContain('flex-direction: row')
    expect(css).toContain('var(--ds-space-cluster)')
  })
})
