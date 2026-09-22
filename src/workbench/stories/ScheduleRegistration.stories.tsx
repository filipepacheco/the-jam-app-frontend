import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { MusicianSlotList } from '../../components/schedule/MusicianSlotList'
import { RegistrationList } from '../../components/schedule/RegistrationList'
import { ScheduleCollapsibleCard } from '../../components/schedule/ScheduleCollapsibleCard'
import { scheduleWorkbenchFixtures } from '../scheduleFixtures'

const meta = {
  title: 'Domain/Schedule/Registration and cards',
  parameters: { a11y: { test: 'todo' } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const approve = fn()

export const PendingAndEmptySlots: Story = {
  render: () => (
    <MusicianSlotList
      registrations={scheduleWorkbenchFixtures.pending.registrations}
      showActions
      onApprove={approve}
      onReject={fn()}
      neededDrums={1}
      neededGuitars={2}
      neededBass={1}
      neededVocals={1}
    />
  ),
  globals: { viewport: { value: 'phone', isRotated: false }, locale: 'en' },
  play: async ({ canvas, userEvent }) => {
    const approveButton = canvas.getByRole('button', { name: /approve/i })
    await userEvent.click(approveButton)
    await expect(approve).toHaveBeenCalledWith('registration-pending-guitar')
  },
}

export const ApprovedDenseRegistrationList: Story = {
  render: () => (
    <RegistrationList
      registrations={scheduleWorkbenchFixtures.approved.registrations}
      showActions
      onDelete={fn()}
      onAddMusician={fn()}
      neededDrums={1}
      neededGuitars={2}
      neededBass={1}
      neededVocals={1}
    />
  ),
  globals: { theme: 'jam-dark', locale: 'es', viewport: { value: 'desktop', isRotated: false } },
}

export const EmptyRegistrationList: Story = {
  render: () => <RegistrationList registrations={[]} neededDrums={1} neededGuitars={1} />,
}

export const HostCardExpanded: Story = {
  render: () => (
    <div className="max-w-3xl">
      <ScheduleCollapsibleCard
        schedule={scheduleWorkbenchFixtures.pending}
        defaultExpanded
        notes="Repeat the bridge twice and wait for the host's visual cue before the final chorus."
        jamMusicId="jam-music-long-notes"
        onSaveNotes={fn()}
        onApproveRegistration={fn()}
        onRejectRegistration={fn()}
        onDelete={fn()}
        onAddMusician={fn()}
        onApproveAllRegistrations={fn()}
        onEditMusic={fn()}
      />
    </div>
  ),
  globals: { locale: 'pt', theme: 'jam-dark', viewport: { value: 'desktop', isRotated: false } },
}

export const KeyboardExpansion: Story = {
  render: () => <ScheduleCollapsibleCard schedule={scheduleWorkbenchFixtures.empty} />,
  play: async ({ canvas, userEvent }) => {
    const card = canvas.getByRole('button', { name: /song title deliberately long/i })
    await expect(card).toHaveAttribute('aria-expanded', 'false')
    card.focus()
    await userEvent.keyboard('{Enter}')
    await expect(card).toHaveAttribute('aria-expanded', 'true')
  },
}

export const DestructiveActionsDisabled: Story = {
  render: () => (
    <ScheduleCollapsibleCard
      schedule={scheduleWorkbenchFixtures.suggested}
      isSuggested
      loading
      onStatusChange={fn()}
      onDelete={fn()}
    />
  ),
}
