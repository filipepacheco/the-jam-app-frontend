import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {DJControlTabV2} from '../pages/tabs/DJControlTabV2'
import type {LiveStateResponseDto} from '../types/jamControl.types'

const {pause, refresh} = vi.hoisted(() => ({pause: vi.fn(), refresh: vi.fn()}))

const liveState: LiveStateResponseDto = {
  currentSong: {
    id: 'schedule-1',
    order: 1,
    status: 'IN_PROGRESS',
    music: {id: 'music-1', title: 'Current song', artist: 'Artist'},
    musicians: [],
  },
  previousSongs: [],
  nextSongs: [],
  suggestedSongs: [],
  jamStatus: 'LIVE',
  playbackState: 'PLAYING',
}

vi.mock('react-i18next', () => ({useTranslation: () => ({t: (key: string) => key})}))
vi.mock('../hooks', () => ({
  useJamControl: () => ({
    liveState,
    isLoading: false,
    error: null,
    start: vi.fn(),
    stop: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    pause,
    resume: vi.fn(),
    refresh,
  }),
}))
vi.mock('../components', () => ({
  Alert: ({message, type}: {message: string; type: string}) => <div role={type === 'error' ? 'alert' : 'status'}>{message}</div>,
  SongQueueTimeline: () => null,
}))
vi.mock('../services', () => ({scheduleService: {update: vi.fn(), remove: vi.fn()}}))

describe('DJControlTabV2 playback refresh', () => {
  beforeEach(() => {
    pause.mockReset()
    refresh.mockReset()
  })

  it('does not announce pause success or reload the jam when pause fails', async () => {
    const onReload = vi.fn()
    pause.mockRejectedValue(new Error('Pause failed'))
    render(<DJControlTabV2 jamId="jam-1" onReload={onReload} />)

    await userEvent.setup().click(screen.getAllByRole('button', {name: 'dj_control.actions.pause'})[0])

    expect(await screen.findByRole('alert')).toHaveTextContent('Pause failed')
    expect(screen.queryByText('live_control.song_paused_feedback')).not.toBeInTheDocument()
    expect(refresh).not.toHaveBeenCalled()
    expect(onReload).not.toHaveBeenCalled()
  })

  it('reloads the jam once after pause without a duplicate live-state refresh', async () => {
    const onReload = vi.fn().mockResolvedValue(undefined)
    pause.mockResolvedValue(undefined)
    render(<DJControlTabV2 jamId="jam-1" onReload={onReload} />)

    await userEvent.setup().click(screen.getAllByRole('button', {name: 'dj_control.actions.pause'})[0])

    await waitFor(() => expect(onReload).toHaveBeenCalledOnce())
    expect(refresh).not.toHaveBeenCalled()
    expect(screen.getByText('live_control.song_paused_feedback')).toBeVisible()
  })
})
