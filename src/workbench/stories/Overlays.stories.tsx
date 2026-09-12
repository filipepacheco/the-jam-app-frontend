import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { Action } from '../../components/Action'
import { FeedbackModal } from '../../components/FeedbackModal'
import {
  ConfirmationDialog,
  Disclosure,
  OverlayActions,
  OverlayDrawer,
  OverlayModal,
} from '../../components/overlays'

const meta = { title: 'Overlays/Canonical family', parameters: { layout: 'fullscreen', a11y: { test: 'error' } } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

const dismissModal = fn()
const dismissDrawer = fn()

export const ModalKeyboardAndLongScroll: Story = {
  render: () => (
    <OverlayModal
      actions={<OverlayActions><Action variant="quiet"><Action.Label>Cancel</Action.Label></Action><Action variant="primary"><Action.Label>Save arrangement</Action.Label></Action></OverlayActions>}
      description="Long instructions and fields scroll inside the overlay while the decision actions remain available."
      isOpen
      onDismiss={dismissModal}
      closeLabel="Close arrangement editor"
      title="A deliberately long overlay title that must remain readable"
    >
      <div className="space-y-4">{Array.from({ length: 18 }, (_, index) => <label key={index} className="form-control"><span className="label">Field {index + 1}</span><input className="input input-bordered" /></label>)}</div>
    </OverlayModal>
  ),
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await expect(page.getByRole('dialog', { name: /long overlay title/i })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await expect(dismissModal).toHaveBeenCalled()
  },
}

export const DestructiveConfirmation: Story = {
  render: () => <ConfirmationDialog isOpen onConfirm={fn()} onCancel={fn()} title="Delete song?" description="This removes the song from every scheduled performance and cannot be undone." confirmLabel="Delete song" cancelLabel="Cancel" closeLabel="Close confirmation" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body)
    await expect(page.getByRole('alertdialog', { name: 'Delete song?' })).toBeInTheDocument()
    await expect(page.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  },
}

export const DesktopActionLayout: Story = {
  render: () => (
    <OverlayModal
      actions={<OverlayActions><Action variant="quiet"><Action.Label>Cancel</Action.Label></Action><Action variant="primary"><Action.Label>Save arrangement</Action.Label></Action></OverlayActions>}
      description="At the host-console breakpoint, actions align inline without compressing their labels."
      isOpen
      onDismiss={fn()}
      closeLabel="Close arrangement editor"
      title="Edit performance"
    >
      <p className="ds-type-body">Keep the full action label visible while the panel remains a readable width.</p>
    </OverlayModal>
  ),
  globals: { viewport: { value: 'desktop', isRotated: false } },
}
export const ConfirmationSubmitting: Story = {
  render: () => <ConfirmationDialog isOpen onConfirm={fn()} onCancel={fn()} title="Delete song?" description="The deletion is being applied." confirmLabel="Delete song" cancelLabel="Cancel" closeLabel="Close confirmation" confirming confirmingLabel="Deleting song…" />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body)
    await expect(page.getByRole('button', { name: 'Deleting song…' })).toBeDisabled()
  },
}

export const FeedbackValidationAndSubmission: Story = {
  render: () => <FeedbackModal isOpen onClose={fn()} portal={false} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole('radio', { hidden: true })[4])
    await userEvent.type(canvas.getByRole('textbox', { hidden: true }), 'The mobile flow felt clear.')
    await userEvent.click(canvas.getByRole('button', { name: /enviar|submit/i, hidden: true }))
    await expect(await canvas.findByText(/obrigad|thank|gracias/i)).toBeInTheDocument()
  },
}

export const DrawerAndNonModalDisclosure: Story = {
  render: () => (
    <OverlayDrawer isOpen onDismiss={dismissDrawer} closeLabel="Close navigation menu" title="Navigation menu">
      <nav aria-label="Overlay navigation" className="flex flex-col gap-3"><a href="/jams">Browse jams</a><a href="/host">Host dashboard</a></nav>
    </OverlayDrawer>
  ),
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await expect(dismissDrawer).toHaveBeenCalled()
  },
}

export const NonModalDisclosure: Story = {
  render: () => <div className="max-w-lg p-6"><Disclosure defaultOpen summary="Schedule filters">Filters remain in the page flow and do not lock the background.</Disclosure></div>,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Filters remain in the page flow and do not lock the background.').closest('details')).not.toBeNull()
  },
}
