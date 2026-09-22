import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { TimelineItemV2Waveform } from '../../components/jam-detail-v2/TimelineItemV2Waveform'
import { TimelineShowcaseV2Waveform } from '../../components/jam-detail-v2/TimelineShowcaseV2Waveform'
import { musicianFixtures, scheduleFixtures } from '../jamMusicFixtures'
import type {RegistrationResponseDto, ScheduleResponseDto} from '../../types/api.types'

const meta = {
  title: 'Domain/Jam/Performance timeline',
  component: TimelineShowcaseV2Waveform,
  parameters: { a11y: { test: 'error' } },
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
    theme: 'jam-light',
    viewport: { value: 'desktop', isRotated: false },
  },
  play: async ({ canvas, userEvent }) => {
    const guitarFilter = canvas.getByRole('button', { name: /guitarra/i })
    await userEvent.click(guitarFilter)
    // The filter pills are canonical Action controls now, so the selected pill
    // is identified by aria-pressed and by the canonical variant attribute, not
    // by the DaisyUI btn-primary class.
    await expect(guitarFilter).toHaveAttribute('aria-pressed', 'true')
    await expect(guitarFilter).toHaveAttribute('data-action-variant', 'primary')
    await userEvent.click(canvas.getByRole('button', { name: /tudo/i }))
    await expect(canvas.getAllByText('Psycho Killer')).toHaveLength(2)
  },
}

export const EmptySchedule: Story = {
  args: { schedules: [], user: null, onRegisterClick: fn(), jamStatus: 'ACTIVE' },
  globals: {
    locale: 'es',
    theme: 'jam-light',
    viewport: { value: 'phone', isRotated: false },
  },
}

export const ViewerWithoutActions: Story = {
  args: { schedules: scheduleFixtures, user: null, onRegisterClick: fn(), jamStatus: 'FINISHED' },
  globals: { authRole: 'viewer', locale: 'en', theme: 'jam-dark' },
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
  globals: { authRole: 'user', locale: 'pt', theme: 'jam-dark' },
}

const registrationFor = (
  id: string,
  instrument: string,
  name: string,
): RegistrationResponseDto => ({
  id,
  musicianId: `musician-${id}`,
  jamId: 'jam-friday',
  scheduleId: 'schedule-lineup-full',
  instrument,
  status: 'APPROVED',
  createdAt: '2026-09-10T12:00:00.000Z',
  musician: {
    id: `musician-${id}`,
    name,
    instrument,
    level: 'INTERMEDIATE',
    isHost: false,
    createdAt: '2026-09-02T12:00:00.000Z',
  },
})

const lineupBase: ScheduleResponseDto = {
  ...scheduleFixtures[0],
  status: 'SCHEDULED',
  music: {
    ...scheduleFixtures[0].music,
    neededDrums: 1,
    neededGuitars: 1,
    neededVocals: 1,
    neededBass: 1,
    neededKeys: 0,
  },
}

const lineupStates: ScheduleResponseDto[] = [
  {...lineupBase, id: 'schedule-lineup-empty', registrations: []},
  {
    ...lineupBase,
    id: 'schedule-lineup-few',
    registrations: [registrationFor('vocal', 'vocals', 'Yuri')],
  },
  {
    ...lineupBase,
    id: 'schedule-lineup-full',
    registrations: [
      registrationFor('drums', 'drums', 'Marina'),
      registrationFor('guitar', 'guitars', 'Alex'),
      registrationFor('vocal-full', 'vocals', 'Yuri'),
      registrationFor('bass', 'bass', 'Bia'),
    ],
  },
  {
    ...lineupBase,
    id: 'schedule-lineup-open',
    music: {
      ...lineupBase.music,
      neededDrums: 0,
      neededGuitars: 0,
      neededVocals: 0,
      neededBass: 0,
      neededKeys: 0,
    },
    registrations: [],
  },
]

export const ParticipantAndAvailabilityStates: Story = {
  render: () => (
    <div className="grid max-w-5xl gap-4 lg:grid-cols-2">
      {lineupStates.map((schedule, index) => (
        <TimelineItemV2Waveform
          key={schedule.id}
          schedule={schedule}
          user={index === 1 ? musicianFixtures.vocalist : null}
          position={index + 1}
          onRegisterClick={register}
        />
      ))}
    </div>
  ),
  globals: {
    authRole: 'user',
    locale: 'pt',
    theme: 'jam-light',
    viewport: { value: 'desktop', isRotated: false },
    reducedMotion: true,
  },
  play: async ({canvas}) => {
    await expect(canvas.getAllByLabelText(/participantes e vagas/i)).toHaveLength(4)
    await expect(canvas.getAllByText(/sem inscrições ainda/i).length).toBeGreaterThan(0)
    await expect(canvas.getByText(/qualquer instrumento é bem-vindo/i)).toBeVisible()
    await expect(canvas.getAllByText('8:07')).toHaveLength(4)
    await expect(canvas.getAllByText(/banda completa/i)).toHaveLength(1)
  },
}
