import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { EmptySlotRow } from '../../components/schedule/EmptySlotRow'
import { InstrumentBadges } from '../../components/schedule/InstrumentBadges'
import { InstrumentsSummary } from '../../components/schedule/InstrumentsSummary'
import { ScheduleActionButtons } from '../../components/schedule/ScheduleActionButtons'
import { ScheduleDetailsCard } from '../../components/schedule/ScheduleDetailsCard'
import { ScheduleOverflowMenu } from '../../components/schedule/ScheduleOverflowMenu'
import { ScheduleStatusBadge } from '../../components/schedule/ScheduleStatusBadge'
import { SlotFillIndicator } from '../../components/schedule/SlotFillIndicator'
import { SongInfo } from '../../components/schedule/SongInfo'
import { StatusDot } from '../../components/schedule/StatusDot'
import { scheduleWorkbenchFixtures } from '../scheduleFixtures'

const meta = {
  title: 'Domain/Schedule/Primitives and actions',
  parameters: { a11y: { test: 'todo' } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const EmptyAndFilledSlots: Story = {
  render: () => (
    <div className="space-y-4 max-w-xl">
      <EmptySlotRow instrument="keys" count={2} />
      <InstrumentBadges neededDrums={1} neededGuitars={2} neededVocals={1} duration={487} />
      <InstrumentsSummary
        highlightInstrument="guitars"
        instrumentOptions={[
          { key: 'drums', label: 'Bateria', emoji: '🥁', needed: 1, registered: 1 },
          { key: 'guitars', label: 'Guitarras', emoji: '🎸', needed: 2, registered: 1 },
        ]}
      />
      <SlotFillIndicator
        registrations={scheduleWorkbenchFixtures.pending.registrations}
        music={scheduleWorkbenchFixtures.pending.music}
      />
    </div>
  ),
  globals: { locale: 'pt', theme: 'cupcake', viewport: { value: 'phone', isRotated: false } },
}

export const SongAndStatusMatrix: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <SongInfo music={scheduleWorkbenchFixtures.approved.music!} />
      <ScheduleDetailsCard schedule={scheduleWorkbenchFixtures.approved} />
      <div className="flex flex-wrap gap-3">
        {['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'].map((status) => (
          <div className="flex items-center gap-2" key={status}>
            <StatusDot status={status} />
            <ScheduleStatusBadge status={status} />
          </div>
        ))}
        <ScheduleStatusBadge status="SUGGESTED" isSuggested />
      </div>
    </div>
  ),
  globals: { locale: 'es', theme: 'night', viewport: { value: 'desktop', isRotated: false } },
}

const approve = fn()
const reject = fn()

export const ApprovalAndDestructiveActions: Story = {
  render: () => (
    <ScheduleActionButtons
      status="SUGGESTED"
      isSuggested
      onStatusChange={approve}
      onDelete={reject}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    const buttons = canvas.getAllByRole('button')
    await userEvent.click(buttons[0])
    await userEvent.click(buttons[1])
    await expect(approve).toHaveBeenCalledWith('SCHEDULED')
    await expect(reject).toHaveBeenCalledOnce()
  },
}

const deleteSchedule = fn()
const addMusician = fn()

export const KeyboardOverflowMenu: Story = {
  render: () => (
    <div className="flex justify-end max-w-sm">
      <ScheduleOverflowMenu
        status="IN_PROGRESS"
        hasPendingRegistrations
        onDelete={deleteSchedule}
        onAddMusician={addMusician}
        onApproveAll={fn()}
        onEditMusic={fn()}
        onStatusChange={fn()}
      />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /ações|actions|acciones/i })
    await userEvent.click(trigger)
    const remove = await canvas.findByRole('menuitem', { name: /excluir|delete|eliminar/i })
    await userEvent.click(remove)
    await expect(deleteSchedule).toHaveBeenCalledOnce()
  },
}

export const DisabledActions: Story = {
  render: () => <ScheduleActionButtons status="SUGGESTED" isSuggested loading />,
}
