import type { Meta, StoryObj } from '@storybook/react-vite'
import { Check, MoreHorizontal, Trash2 } from 'lucide-react'
import { expect, fn } from 'storybook/test'
import { Action, IconAction } from '../../../components/Action'

const approve = fn()

const meta = {
  title: 'Foundations/Action controls',
  parameters: { a11y: { test: 'error' } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const SemanticVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-[var(--ds-space-cluster)]">
      <Action variant="primary" onClick={approve}>
        <Action.Icon><Check className="size-4" /></Action.Icon>
        <Action.Label>Approve performance</Action.Label>
      </Action>
      <Action variant="secondary"><Action.Label>Save as draft</Action.Label></Action>
      <Action variant="quiet"><Action.Label>Cancel changes</Action.Label></Action>
      <Action variant="destructive"><Action.Label>Remove performance</Action.Label></Action>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const primary = canvas.getByRole('button', { name: 'Approve performance' })
    primary.focus()
    await userEvent.keyboard('{Enter}')
    await expect(approve).toHaveBeenCalledOnce()
    await userEvent.keyboard(' ')
    await expect(approve).toHaveBeenCalledTimes(2)
  },
}

export const LoadingAndDisabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-[var(--ds-space-cluster)]">
      <Action variant="primary" state="loading" loadingLabel="Saving setlist…">
        <Action.Label>Save setlist</Action.Label>
      </Action>
      <Action variant="quiet" state="disabled">
        <Action.Label>Unavailable until a song is selected</Action.Label>
      </Action>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const loading = canvas.getByRole('button', { name: 'Saving setlist…' })
    const disabled = canvas.getByRole('button', { name: 'Unavailable until a song is selected' })
    await expect(loading).toBeDisabled()
    await expect(loading).toHaveAttribute('aria-busy', 'true')
    await expect(canvas.getByRole('status')).toHaveTextContent('Saving setlist…')
    await userEvent.click(loading)
    await expect(disabled).toBeDisabled()
  },
}

export const IconOnly: Story = {
  render: () => (
    <div className="flex gap-[var(--ds-space-compact)]">
      <IconAction variant="quiet" label="Open performance actions"><MoreHorizontal className="size-5" /></IconAction>
      <IconAction variant="destructive" label="Remove performance"><Trash2 className="size-5" /></IconAction>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Open performance actions' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Remove performance' })).toBeVisible()
  },
}
