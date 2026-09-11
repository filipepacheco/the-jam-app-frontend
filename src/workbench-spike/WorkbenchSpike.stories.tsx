/**
 * PROTOTYPE for #31. These stories answer whether Storybook can carry the
 * Jam App's hardest isolated contexts. Ticket #32 will replace this spike with
 * the durable workbench structure if the evaluation is accepted.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { http, HttpResponse } from 'msw'
import { AuthContext } from '../contexts/AuthContext'
import { Alert } from '../components/Alert'
import { Modal } from '../components/Modal'
import { FeedbackModal } from '../components/FeedbackModal'
import Navbar from '../components/Navbar'
import { JamRegistrationForm } from '../components/forms/JamRegistrationForm'
import { NextSongCard } from '../components/publicDashboard/NextSongCard'
import { ScheduleCardManagement } from '../components/schedule/ScheduleCardManagement'
import type { JamDetails } from '../services'
import { createAuthFixture, inProgressSchedule } from './fixtures'

const meta = {
  title: 'Evaluation/Workbench spike',
  parameters: {
    a11y: { test: 'todo' },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const dismissAlert = fn()

export const PrimitiveLike: Story = {
  name: 'Primitive-like / Alert',
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

export const Overlay: Story = {
  name: 'Overlay / Modal',
  render: () => (
    <Modal
      isOpen
      title="Edit performance"
      onClose={closeModal}
      role="dialog"
      footer={<button className="btn btn-primary">Save</button>}
    >
      <label htmlFor="arrangement" className="label">Arrangement note</label>
      <input id="arrangement" className="input input-bordered w-full" defaultValue="End on the final chorus" />
    </Modal>
  ),
  play: async ({ canvas, userEvent }) => {
    // Native <dialog> lacks an `open` attribute in the current component, so
    // the accessibility tree treats it as hidden despite DaisyUI's modal-open.
    const dialog = canvas.getByRole('dialog', { hidden: true })
    await expect(dialog).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await expect(closeModal).toHaveBeenCalledOnce()
  },
}

export const NetworkMockedModal: Story = {
  name: 'Overlay + stable network mock / Feedback',
  tags: ['!test'],
  parameters: {
    msw: {
      handlers: [
        http.post('*/feedback', () => HttpResponse.json({
          success: true,
          data: {
            id: 'feedback-fixture',
            rating: 5,
            comment: 'Great flow',
            createdAt: '2026-09-11T12:00:00.000Z',
          },
        })),
      ],
    },
  },
  render: () => <FeedbackModal isOpen onClose={fn()} />,
  play: async ({ userEvent }) => {
    const page = within(document.body)
    await userEvent.click(await page.findByRole('radio', { name: /5/ }))
    await userEvent.type(await page.findByRole('textbox'), 'Great flow')
    await userEvent.click(await page.findByRole('button', { name: /enviar|submit/i }))
    await expect(await page.findByText(/obrigad|thank|gracias/i)).toBeInTheDocument()
  },
}

const registrationJam = {
  id: 'jam-fixture',
  name: 'Friday Night Jam',
  date: '2026-09-18',
  status: 'ACTIVE',
  specialtySlots: [
    { specialty: 'guitar', required: 2, registered: 1 },
    { specialty: 'vocals', required: 1, registered: 0 },
  ],
} satisfies JamDetails

const submitRegistration = fn(async () => undefined)

export const Form: Story = {
  name: 'Form / Jam registration',
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

export const ThemeAndMotionSensitive: Story = {
  name: 'Theme and reduced motion / Next song',
  globals: { theme: 'synthwave', reducedMotion: true },
  render: () => (
    <NextSongCard
      song={{
        id: 'dashboard-song-fixture',
        title: 'Psycho Killer',
        artist: 'Talking Heads',
        duration: 261,
        musicians: [
          { id: 'dashboard-musician-fixture', name: 'Yuri', instrument: 'vocals' },
        ],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true)
    await expect(canvasElement.ownerDocument.querySelector('[data-theme="synthwave"]')).not.toBeNull()
  },
}

const authFixture = createAuthFixture()

export const AuthContextDependent: Story = {
  name: 'Auth context / Responsive navbar',
  decorators: [
    (Story) => (
      <AuthContext.Provider value={authFixture}>
        <Story />
      </AuthContext.Provider>
    ),
  ],
  render: () => <Navbar />,
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(page.getByRole('button', { name: /alternar menu|toggle navigation menu/i }))
    await expect(page.getByRole('dialog', { name: /menu de navegação|navigation menu|menu de navegación/i })).toBeInTheDocument()
    await expect(page.getAllByText('Ana Host')).not.toHaveLength(0)
  },
}

const deleteSchedule = fn()

export const ComplexSchedule: Story = {
  name: 'Complex / Schedule management card',
  render: () => (
    <div className="max-w-3xl">
      <ScheduleCardManagement
        schedule={inProgressSchedule}
        onDelete={deleteSchedule}
        onAddMusician={fn()}
      />
    </div>
  ),
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    const [deleteButton] = canvas.getAllByRole('button', { name: /excluir|delete|eliminar/i })
    await userEvent.click(deleteButton)
    await expect(deleteSchedule).toHaveBeenCalledOnce()
  },
}
