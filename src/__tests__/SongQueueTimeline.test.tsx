import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {SongQueueTimeline} from '../components/dj-control/SongQueueTimeline'
import type {LiveStateResponseDto, LiveStateSongDto} from '../types/jamControl.types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

function performance(id: string, title: string, status: LiveStateSongDto['status']): LiveStateSongDto {
  return {
    id,
    order: 1,
    status,
    music: {title, artist: 'Artist'},
    musicians: [],
  }
}

const liveState: LiveStateResponseDto = {
  currentSong: performance('current', 'Current Music', 'IN_PROGRESS'),
  nextSongs: [
    performance('next', 'Next Music', 'SCHEDULED'),
    performance('later', 'Later Music', 'SCHEDULED'),
  ],
  previousSongs: [],
  suggestedSongs: [performance('suggested', 'Suggested Music', 'SUGGESTED')],
  jamStatus: 'ACTIVE',
  playbackState: 'PLAYING',
}

describe('SongQueueTimeline', () => {
  it('marks only the first upcoming Performance as Next', () => {
    render(<SongQueueTimeline liveState={liveState} />)

    expect(screen.getByText('Next Music').parentElement).toHaveTextContent('Next')
    expect(screen.getByText('Later Music').parentElement).not.toHaveTextContent('Next')
  })

  it('lets the host collapse and expand suggested Performances', () => {
    render(<SongQueueTimeline liveState={liveState} suggestedSongs={liveState.suggestedSongs} />)
    const disclosure = screen.getByRole('button', {name: /dj_control.timeline.suggested_songs/})

    expect(disclosure).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Suggested Music')).toBeVisible()

    fireEvent.click(disclosure)

    expect(disclosure).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Suggested Music')).not.toBeInTheDocument()

    fireEvent.click(disclosure)

    expect(disclosure).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Suggested Music')).toBeVisible()
  })
})
