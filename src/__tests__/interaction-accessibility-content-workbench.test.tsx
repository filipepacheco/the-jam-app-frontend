import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  ActionableEmptyStateExample,
  DestructiveActionExample,
} from '../workbench/stories/Foundations/InteractionAccessibilityContentExamples'

describe('interaction, accessibility, and content workbench examples', () => {
  it('gives the empty state a clear action and confirms its result', async () => {
    const user = userEvent.setup()
    render(<ActionableEmptyStateExample />)

    await user.click(screen.getByRole('button', { name: 'Add the first song' }))

    expect(screen.getByRole('status')).toHaveTextContent('Song picker opened')
  })

  it('isolates destructive-dialog background content and restores focus for cancel and close', async () => {
    const user = userEvent.setup()
    render(<DestructiveActionExample />)

    const trigger = screen.getByRole('button', { name: 'Remove song' })
    trigger.focus()
    await user.keyboard('{Enter}')

    const dialog = screen.getByRole('alertdialog', { name: 'Remove “Midnight Train”?' })
    const background = screen.getByTestId('destructive-background')
    expect(dialog).toHaveAccessibleDescription(/cannot be undone/i)
    expect(background).toHaveAttribute('inert')
    expect(background).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: 'Close confirmation' })).toHaveFocus()

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(screen.getByRole('button', { name: 'Remove song' })).toHaveFocus()
    await user.keyboard('{Tab}')
    expect(screen.getByRole('button', { name: 'Close confirmation' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(background).not.toHaveAttribute('inert')
    expect(trigger).toHaveFocus()

    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'Close confirmation' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    await user.keyboard('{Enter}')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
