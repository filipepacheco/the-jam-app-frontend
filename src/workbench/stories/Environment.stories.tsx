import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { Alert } from '../../components/Alert'
import { FeedbackModal } from '../../components/FeedbackModal'
import { Modal } from '../../components/Modal'
import Navbar from '../../components/Navbar'
import { JamRegistrationForm } from '../../components/forms/JamRegistrationForm'
import { NextSongCard } from '../../components/publicDashboard/NextSongCard'
import { nextSong, registrationJam } from '../fixtures'

const meta = {
  title: 'Workbench/Shared environment',
  parameters: { a11y: { test: 'todo' } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const dismissAlert = fn()

export const AlertInteraction: Story = {
  render: () => (
    <div className="max-w-xl">
      <Alert type="success" title="Setlist saved" message="Everyone can now see the updated order." onDismiss={dismissAlert} />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const dismiss = canvas.getByRole('button')
    await userEvent.click(dismiss)
    await expect(dismissAlert).toHaveBeenCalledOnce()
  },
}

const closeModal = fn()

export const OverlayInteraction: Story = {
  render: () => (
    <Modal isOpen title="Edit performance" onClose={closeModal} role="dialog">
      <label htmlFor="arrangement" className="label">Arrangement note</label>
      <input id="arrangement" className="input input-bordered w-full" defaultValue="End on the final chorus" />
    </Modal>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('dialog', { hidden: true })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await expect(closeModal).toHaveBeenCalledOnce()
  },
}

export const FeedbackRequestMock: Story = {
  render: () => <FeedbackModal isOpen onClose={fn()} portal={false} />,
  play: async ({ canvas, userEvent }) => {
    const ratings = await canvas.findAllByRole('radio', { hidden: true })
    await userEvent.click(ratings[4])
    await userEvent.type(await canvas.findByRole('textbox', { hidden: true }), 'Great flow')
    await userEvent.click(await canvas.findByRole('button', { name: /enviar|submit/i, hidden: true }))
    await expect(await canvas.findByText(/obrigad|thank|gracias/i)).toBeInTheDocument()
  },
}

const submitRegistration = fn(async () => undefined)

export const FormInteraction: Story = {
  render: () => <JamRegistrationForm jam={registrationJam} onSubmit={submitRegistration} />,
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    const selects = canvas.getAllByRole('combobox')
    await userEvent.selectOptions(selects[0], 'guitar')
    await userEvent.click(canvas.getByRole('checkbox'))
    await userEvent.click(canvas.getByRole('button', { name: /participar|join|unirme/i }))
    await expect(submitRegistration).toHaveBeenCalledWith('guitar', '')
  },
}

export const ThemeLocaleAndMotion: Story = {
  globals: { theme: 'synthwave', locale: 'es', reducedMotion: true },
  render: () => <NextSongCard song={nextSong} />,
  play: async ({ canvasElement }) => {
    await expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true)
    await expect(canvasElement.ownerDocument.documentElement.dataset.theme).toBe('synthwave')
    await expect(canvasElement.ownerDocument.documentElement.lang).toBe('es')
  },
}

export const RouterAndAuthRole: Story = {
  globals: {
    route: '/host',
    authRole: 'host',
    viewport: { value: 'phone', isRotated: false },
  },
  render: () => <Navbar />,
  play: async ({ canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(page.getByRole('button', { name: /alternar menu|toggle navigation menu/i }))
    await expect(page.getByRole('dialog', { name: /menu de navegação|navigation menu|menu de navegación/i })).toBeInTheDocument()
    await expect(page.getAllByText('Ana Host')).not.toHaveLength(0)
  },
}
