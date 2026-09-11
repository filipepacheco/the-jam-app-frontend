import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { TimelineItem } from '../../components/jam-detail-v2/TimelineItem'
import { TimelineItemV2Waveform } from '../../components/jam-detail-v2/TimelineItemV2Waveform'
import { TimelineShowcaseV2Waveform } from '../../components/jam-detail-v2/TimelineShowcaseV2Waveform'
import { musicianFixtures, scheduleFixtures } from '../jamMusicFixtures'

const meta = {
  title: 'Domain/Jam/Performance timeline',
  component: TimelineShowcaseV2Waveform,
  parameters: { a11y: { test: 'todo' } },
  args: { schedules: scheduleFixtures, user: null, onRegisterClick: fn() },
} satisfies Meta<typeof TimelineShowcaseV2Waveform>

export default meta
type Story = StoryObj<typeof meta>

const register = fn()

export const CompleteSchedule: Story = {
  args: {
    schedules: scheduleFixtures,
    user: musicianFixtures.vocalist,
    onRegisterClick: register,
    jamStatus: 'LIVE',
  },
  globals: {
    locale: 'pt',
    theme: 'light',
    viewport: { value: 'desktop', isRotated: false },
  },
  play: async ({ canvas, userEvent }) => {
    const guitarFilter = canvas.getByRole('button', { name: /guitarra/i })
    await userEvent.click(guitarFilter)
    await expect(guitarFilter).toHaveClass('btn-primary')
    await userEvent.click(canvas.getByRole('button', { name: /tudo/i }))
    await expect(canvas.getAllByText('Psycho Killer')).toHaveLength(2)
  },
}

export const EmptySchedule: Story = {
  args: { schedules: [], user: null, onRegisterClick: fn(), jamStatus: 'ACTIVE' },
  globals: {
    locale: 'es',
    theme: 'corporate',
    viewport: { value: 'phone', isRotated: false },
  },
}

export const ViewerWithoutActions: Story = {
  args: { schedules: scheduleFixtures, user: null, onRegisterClick: fn(), jamStatus: 'FINISHED' },
  globals: { authRole: 'viewer', locale: 'en', theme: 'dark' },
}

export const LegacyTimelineItem: Story = {
  render: () => (
    <div className="max-w-lg">
      <TimelineItem schedule={scheduleFixtures[0]} user={null} onRegisterClick={register} />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /participar|register|join/i }))
    await expect(register).toHaveBeenCalled()
  },
}

const toggleCompletedItem = fn()

export const CompletedItemExpansion: Story = {
  render: () => (
    <div className="max-w-2xl">
      <TimelineItemV2Waveform
        schedule={scheduleFixtures[2]}
        user={musicianFixtures.vocalist}
        position={3}
        onToggleExpanded={toggleCompletedItem}
        onRegisterClick={register}
      />
    </div>
  ),
  globals: { viewport: { value: 'phone', isRotated: false }, reducedMotion: true },
  play: async ({ canvas, userEvent }) => {
    const item = canvas.getByRole('button', { name: /psycho killer/i })
    await expect(item).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(item)
    await expect(toggleCompletedItem).toHaveBeenCalledOnce()
  },
}

export const InProgressPermissionState: Story = {
  render: () => (
    <div className="max-w-2xl">
      <TimelineItemV2Waveform
        schedule={scheduleFixtures[1]}
        user={musicianFixtures.vocalist}
        position={2}
        onRegisterClick={register}
      />
    </div>
  ),
  globals: { authRole: 'user', locale: 'pt', theme: 'synthwave' },
}
