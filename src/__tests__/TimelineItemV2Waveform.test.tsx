import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {TimelineItemV2Waveform} from '../components/jam-detail-v2/TimelineItemV2Waveform'
import type {ScheduleResponseDto} from '../types/api.types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

const longTitle = 'The exceptionally long completed performance title that must never displace its status'
const longArtist = 'An exceptionally long artist name that must truncate before the duration or completed status'

const completedSchedule: ScheduleResponseDto = {
  id: 'schedule-completed',
  jamId: 'jam-1',
  musicId: 'music-1',
  order: 1,
  status: 'COMPLETED',
  createdAt: '2026-09-22T00:00:00.000Z',
  music: {
    id: 'music-1',
    title: longTitle,
    artist: longArtist,
    duration: 274,
    link: 'spotify:track:7dSCxR4LqkmxoBrq9MzVSD',
    createdAt: '2026-09-22T00:00:00.000Z',
  },
  registrations: [],
}

describe('TimelineItemV2Waveform', () => {
  it('keeps completed status visible while hiding playback metadata', () => {
    render(
      <TimelineItemV2Waveform
        schedule={completedSchedule}
        user={null}
        position={1}
        onRegisterClick={vi.fn()}
        onToggleExpanded={vi.fn()}
      />
    )

    expect(screen.getByText(longTitle)).toHaveClass('min-w-0', 'flex-1', 'truncate')
    expect(screen.getByText(longArtist)).toHaveClass('ds-truncate-single', 'min-w-0', 'flex-1')
    expect(screen.queryByRole('link', {name: `Open ${longTitle} in Spotify`})).not.toBeInTheDocument()
    expect(screen.queryByText('4:34')).not.toBeInTheDocument()
    expect(screen.getByText('schedule.statuses.completed').parentElement?.parentElement).toHaveClass('shrink-0')
  })

  it('keeps Spotify and duration available before a performance is completed', () => {
    render(
      <TimelineItemV2Waveform
        schedule={{...completedSchedule, status: 'SCHEDULED'}}
        user={null}
        position={1}
        onRegisterClick={vi.fn()}
        onToggleExpanded={vi.fn()}
      />
    )

    expect(screen.getByRole('link', {name: `Open ${longTitle} in Spotify`})).toBeInTheDocument()
    expect(screen.getByText('4:34')).toBeInTheDocument()
  })
})
