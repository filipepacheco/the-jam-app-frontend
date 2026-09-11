import { createRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FeedbackModal } from '../../components/FeedbackModal'
import { MobileDrawer } from '../../components/MobileDrawer'
import { Modal } from '../../components/Modal'
import { ModalFooter } from '../../components/ModalFooter'

const meta = { title: 'Overlays/Current components', parameters: { layout: 'fullscreen', a11y: { test: 'todo' } } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const ModalKeyboardAndLongScroll: Story = {
  render: () => <Modal isOpen onClose={fn()} title="A deliberately long overlay title that must remain readable" scrollable responsive footer={<ModalFooter onCancel={fn()} onSubmit={fn()} submitLabel="Save" />}><div className="space-y-4">{Array.from({ length: 18 }, (_, index) => <label key={index} className="form-control"><span className="label">Field {index + 1}</span><input className="input input-bordered" /></label>)}</div></Modal>,
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('dialog', { hidden: true })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
  },
}

export const DestructiveConfirmation: Story = {
  render: () => <ConfirmDialog isOpen onConfirm={fn()} onCancel={fn()} title="Delete song?" message="This removes the song from every scheduled performance." confirmLabel="Delete" variant="destructive" />,
  play: async ({ canvas }) => { await expect(canvas.getByRole('alertdialog', { hidden: true })).toBeInTheDocument() },
}
export const ConfirmationSubmitting: Story = { render: () => <ConfirmDialog isOpen onConfirm={fn()} onCancel={fn()} title="Delete song?" message="Please wait" confirmLabel="Delete" variant="destructive" loading /> }

export const FeedbackValidationAndSubmission: Story = {
  render: () => <FeedbackModal isOpen onClose={fn()} portal={false} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole('radio', { hidden: true })[4])
    await userEvent.type(canvas.getByRole('textbox', { hidden: true }), 'The mobile flow felt clear.')
    await userEvent.click(canvas.getByRole('button', { name: /enviar|submit/i, hidden: true }))
    await expect(await canvas.findByText(/obrigad|thank|gracias/i)).toBeInTheDocument()
  },
}

export const MobileNavigationDrawer: Story = {
  render: () => <MobileDrawer isOpen onClose={fn()} hamburgerRef={createRef<HTMLButtonElement>()} />,
  globals: { viewport: { value: 'phone', isRotated: false }, authRole: 'host' },
  play: async ({ canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await expect(page.getByRole('dialog')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
  },
}
