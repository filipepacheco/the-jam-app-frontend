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

it('keeps the stage, next lineup, and registration link together', async () => {
  render(<PublicDashboardPage layoutOverride="classic" viewState={{status: 'loaded', data: {
    ...liveDashboard,
    currentSong: {...liveDashboard.currentSong!, musicians: [{id: 'current', name: 'Yuri', instrument: 'vocals'}]},
    nextSongs: [{id: 'next', title: 'Valerie', artist: 'Amy Winehouse', duration: null,
      musicians: [{id: 'next-person', name: 'Camila', instrument: 'drums'}]}],
  }}} />)
  expect(screen.getByText('Yuri')).toBeInTheDocument()
  expect(screen.getByText('Camila')).toBeInTheDocument()
  expect(screen.getByRole('heading', {name: 'Valerie'})).toBeInTheDocument()
  expect(await screen.findByRole('link', {name: /friday-night-jam/})).toHaveAttribute('href', expect.stringContaining('/friday-night-jam'))
  expect(screen.getByRole('img', {name: 'publicDashboard.qrCodeAlt'})).toBeInTheDocument()
})

it('shows a waiting state without promoting the next song to the stage', () => {
  render(<PublicDashboardPage layoutOverride="classic" viewState={{status: 'loaded', data: {
    ...liveDashboard, currentSong: null,
    nextSongs: [{id: 'next', title: 'Valerie', artist: 'Amy Winehouse', duration: null, musicians: []}],
  }}} />)
  expect(screen.getByRole('heading', {name: 'publicDashboard.waitingForPerformance'})).toBeInTheDocument()
  expect(screen.getByRole('heading', {level: 3, name: 'Valerie'})).toBeInTheDocument()
})

it('removes next-performance announcements and signup instructions when finished', async () => {
  render(<PublicDashboardPage layoutOverride="classic" viewState={{status: 'loaded', data: {
    ...liveDashboard, jamStatus: 'FINISHED',
    nextSongs: [{id: 'stale-next', title: 'Valerie', artist: 'Amy Winehouse', duration: null, musicians: []}],
  }}} />)
  expect(await screen.findByRole('heading', {name: 'publicDashboard.viewThisJam'})).toBeInTheDocument()
  expect(screen.queryByText('Valerie')).not.toBeInTheDocument()
  expect(screen.queryByText('publicDashboard.registerToPlay')).not.toBeInTheDocument()
})

it('uses the short code when the Jam has no slug', async () => {
  render(<PublicDashboardPage layoutOverride="classic" viewState={{status: 'loaded', data: {
    ...liveDashboard, slug: null,
  }}} />)
  expect(await screen.findByRole('link', {name: /j\/FNJ26/})).toHaveAttribute('href', expect.stringContaining('/j/FNJ26'))
})

it('falls back to the response Jam id for a QR link when no slug or code exists', async () => {
  render(<PublicDashboardPage layoutOverride="classic" viewState={{status: 'loaded', data: {
    ...liveDashboard, slug: null, shortCode: null,
  }}} />)
  expect(await screen.findByRole('link', {name: /jams\/jam-public/})).toHaveAttribute('href', expect.stringContaining('/jams/jam-public'))
})
