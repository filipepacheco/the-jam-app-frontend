import {act, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'
import {PublicDashboardPage} from '../pages/PublicDashboardPage'
import type {LiveDashboardResponseDto} from '../types/api.types'

const liveDashboard: LiveDashboardResponseDto = {
  jamId: 'jam-public',
  jamName: 'Friday Night Jam',
  qrCode: null,
  slug: 'friday-night-jam',
  shortCode: 'FNJ26',
  jamStatus: 'LIVE',
  playbackState: 'PLAYING',
  currentSong: {
    id: 'song-current',
    title: 'Psycho Killer',
    artist: 'Talking Heads',
    duration: 261,
    musicians: [],
  },
  nextSongs: [],
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, string>) => {
      if (key === 'publicDashboard.title' && typeof fallback === 'object') return fallback.name
      if (key === 'publicDashboard.loading') return typeof fallback === 'string' ? fallback : 'Loading dashboard'
      if (key === 'publicDashboard.errorTitle') return typeof fallback === 'string' ? fallback : 'Error'
      if (key === 'publicDashboard.staleIndicator') return typeof fallback === 'string' ? fallback : 'Updates paused'
      if (key === 'common.try_again') return 'Try Again'
      return typeof fallback === 'string' ? fallback : key
    },
  }),
}))

vi.mock('../hooks', () => ({
  useAppLanguage: () => ({currentLang: 'en', changeLanguage: vi.fn()}),
  useConfettiOnSongChange: () => ({
    confettiVisible: false,
    confettiDimensions: {width: 0, height: 0},
    containerRef: {current: null},
  }),
  useOfflineQueue: () => ({isOfflineMode: false}),
  useReducedMotion: () => ({prefersReducedMotion: true, transition: {duration: 0}}),
  useDashboardLayout: () => ({
    layout: 'standard',
    setLayout: vi.fn(),
    carouselIntervalMs: 5000,
    setCarouselIntervalMs: vi.fn(),
  }),
  useFullscreen: () => ({isFullscreen: false, toggleFullscreen: vi.fn()}),
}))

describe('PublicDashboardPage', () => {
  it('renders loading state with busy status and fallback loading label', () => {
    render(<PublicDashboardPage viewState={{status: 'loading'}} />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading dashboard')).toBeInTheDocument()
  })

  it('renders exact error message and reruns injected retry callback on Try Again', async () => {
    const onRetry = vi.fn()

    await act(async () => {
      render(
        <PublicDashboardPage
          viewState={{status: 'error', message: 'Could not load dashboard'}}
          onRetry={onRetry}
        />,
      )
    })

    expect(screen.getByText('Could not load dashboard')).toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', {name: 'Try Again'}))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('keeps the last known Jam state visible when polling is stale', () => {
    render(
      <PublicDashboardPage
        viewState={{status: 'stale', data: liveDashboard, message: 'Refresh failed'}}
      />,
    )

    expect(screen.getByText('Updates paused')).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: 'Psycho Killer'})).toBeInTheDocument()
  })

  it('labels a paused current song without losing the song from the public dashboard', () => {
    render(<PublicDashboardPage viewState={{status: 'loaded', data: {...liveDashboard, playbackState: 'PAUSED'}}} />)

    expect(screen.getByText('schedule.statuses.paused')).toBeVisible()
    expect(screen.queryByText('publicDashboard.nowPlaying')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: 'Psycho Killer'})).toBeVisible()
  })
})
