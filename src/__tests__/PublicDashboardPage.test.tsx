import {act, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'
import {PublicDashboardPage} from '../pages/PublicDashboardPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      if (key === 'publicDashboard.loading') return fallback ?? 'Loading dashboard'
      if (key === 'publicDashboard.errorTitle') return fallback ?? 'Error'
      if (key === 'common.try_again') return 'Try Again'
      return fallback ?? key
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
})
