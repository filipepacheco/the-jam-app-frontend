import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { EditMusicianModal } from '../../components/EditMusicianModal'
import { PerformanceSelectionModal } from '../../components/jam-detail-v2/PerformanceSelectionModal'
import { inProgressSchedule } from '../fixtures'
import { scheduleFixtures } from '../jamMusicFixtures'

const meta = { title: 'Overlays/Jam forms', parameters: { a11y: { test: 'error' } } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const EditMusicianForm: Story = {
  render: () => <EditMusicianModal musician={{ ...inProgressSchedule.registrations![0].musician!, contact: '', phone: '', bio: '', otherInstruments: '' }} onSave={fn()} onClose={fn()} />,
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas }) => {
    const name = canvas.getAllByRole('textbox', { hidden: true })[0]
    await expect(name).toHaveValue('Yuri')
    await expect(canvas.getByRole('button', { name: /salvar|save|guardar/i, hidden: true })).toBeEnabled()
  },
}

export const PerformanceChoice: Story = {
  render: () => <PerformanceSelectionModal performances={[inProgressSchedule]} isOpen onClose={fn()} onSelectPerformance={fn()} userId="another-user" />,
  play: async ({ canvas, userEvent }) => {
    const choice = canvas.getByRole('button', { name: /Psycho Killer/i, hidden: true })
    await userEvent.click(choice)
    await expect(choice).toBeEnabled()
  },
}

export const NoPerformances: Story = {
  render: () => <PerformanceSelectionModal performances={[]} isOpen onClose={fn()} onSelectPerformance={fn()} />,
  parameters: {
    a11y: { test: 'error' },
    designSystem: {
      interaction: {
        status: 'not-applicable',
        rationale: 'Static empty display with no user-operated Performance choice.',
      },
    },
  },
}

const selectLongPerformance = fn()

export const LongPerformanceChoice: Story = {
  render: () => (
    <PerformanceSelectionModal
      performances={[scheduleFixtures[0]]}
      isOpen
      onClose={fn()}
      onSelectPerformance={selectLongPerformance}
    />
  ),
  globals: {
    locale: 'es',
    theme: 'jam-light',
    viewport: { value: 'phone', isRotated: false },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /A Song Title Deliberately/i }))
    await expect(selectLongPerformance).toHaveBeenCalledWith(scheduleFixtures[0])
  },
}
