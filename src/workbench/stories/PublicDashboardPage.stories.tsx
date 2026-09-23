import type {Meta, StoryObj} from '@storybook/react-vite'
import {useState} from 'react'
import {expect, fn, waitFor} from 'storybook/test'
import {PublicDashboardPage} from '../../pages/PublicDashboardPage'
import type {LiveDashboardResponseDto} from '../../types/api.types'
import {dashboardSongs} from '../publicDashboardFixtures'

const liveDashboard: LiveDashboardResponseDto = {
  jamId: 'jam-public',
  jamName: 'Friday Night Jam at Benjamin Social Club',
  qrCode: null,
  slug: 'friday-night-jam',
  shortCode: 'FNJ26',
  jamStatus: 'LIVE',
  playbackState: 'PLAYING',
  currentSong: dashboardSongs.current,
  nextSongs: [dashboardSongs.next],
}

const retry = fn(async () => undefined)

const meta = {
  title: 'Human review/Screen refinement/Public Dashboard transitions',
  component: PublicDashboardPage,
  args: {viewState: {status: 'loaded', data: liveDashboard}, layoutOverride: 'classic'},
  parameters: {a11y: {test: 'error'}, layout: 'fullscreen'},
} satisfies Meta<typeof PublicDashboardPage>

export default meta
type Story = StoryObj<typeof meta>

export const LiveClassic: Story = {
  globals: {
    locale: 'pt',
    theme: 'jam-dark',
    reviewDefaultViewport: 'venue',
  },
  play: async ({canvas}) => {
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', {level: 2, name: 'Psycho Killer'})).toBeVisible()
      await expect(canvas.getByText(/tocando agora/i)).toBeVisible()
      await expect(canvas.getByText(/em seguida/i)).toBeVisible()
    })
  },
}

export const StartingSoon: Story = {
  args: {
    viewState: {status: 'loaded', data: {...liveDashboard, jamStatus: 'ACTIVE', currentSong: null}},
  },
  globals: {locale: 'es', theme: 'jam-light', reviewTheme: 'jam-light', reviewDefaultViewport: 'venue', reducedMotion: true},
  play: async ({canvas}) => {
    const nowPlaying = canvas.getByText(/reproduciendo ahora/i)
    await waitFor(async () => {
      await expect(nowPlaying).toBeVisible()
      await expect(getComputedStyle(nowPlaying.parentElement?.parentElement as Element).opacity).toBe('1')
      await expect(canvas.getByRole('heading', {level: 2, name: /esperando la próxima actuación/i})).toBeVisible()
      await expect(canvas.getByText(dashboardSongs.next.title)).toBeVisible()
    })
  },
}

const changedMusicians = {
  ...dashboardSongs.current,
  musicians: [
    ...dashboardSongs.current.musicians,
    {id: 'dashboard-keys', name: 'Bianca', instrument: 'keys'},
  ],
}

function MusicianChangeReview() {
  const [changed, setChanged] = useState(false)
  const data = {...liveDashboard, currentSong: changed ? changedMusicians : dashboardSongs.current}

  return (
    <>
      <button
        type="button"
        className="ds-control ds-focusable fixed bottom-4 left-4 z-[60] rounded-field bg-base-100 px-4 text-base-content shadow-lg"
        onClick={() => setChanged((current) => !current)}
      >
        Simulate Musician change
      </button>
      <PublicDashboardPage viewState={{status: 'loaded', data}} layoutOverride="classic" />
    </>
  )
}

export const MusicianChangeTransition: Story = {
  render: () => <MusicianChangeReview />,
  globals: {locale: 'en', theme: 'jam-dark', reviewDefaultViewport: 'venue'},
  play: async ({canvas, userEvent}) => {
    await userEvent.click(canvas.getByRole('button', {name: /simulate musician change/i}))
    await waitFor(async () => {
      await expect(canvas.getByText('Bianca')).toBeVisible()
    })
  },
}

export const Finished: Story = {
  args: {
    viewState: {
      status: 'loaded',
      data: {...liveDashboard, jamStatus: 'FINISHED', currentSong: null, nextSongs: []},
    },
  },
  globals: {locale: 'en', theme: 'jam-dark', reviewDefaultViewport: 'venue', reducedMotion: true},
  play: async ({canvas}) => {
    await expect(canvas.getByRole('heading', {level: 2, name: /that's a wrap/i})).toBeVisible()
  },
}

export const LiveCarousel: Story = {
  args: {layoutOverride: 'carousel'},
  globals: {locale: 'en', theme: 'jam-light', reviewDefaultViewport: 'venue', reducedMotion: true},
  play: async ({canvas}) => {
    await expect(canvas.getAllByRole('tab')).toHaveLength(3)
    await waitFor(() => expect(canvas.getByText('Psycho Killer')).toBeVisible())
  },
}

export const Loading: Story = {
  args: {viewState: {status: 'loading'}},
  globals: {locale: 'pt', theme: 'jam-dark', reviewDefaultViewport: 'venue', reducedMotion: true},
  play: async ({canvas}) => {
    const loading = canvas.getByRole('status')
    await expect(loading).toHaveAttribute('aria-busy', 'true')
    await expect(loading).toHaveTextContent(/carregando o painel/i)
  },
}

export const RecoverableError: Story = {
  args: {viewState: {status: 'error', message: 'The venue display could not refresh.'}, onRetry: retry},
  globals: {locale: 'en', theme: 'jam-light', reviewDefaultViewport: 'venue', reducedMotion: true},
  play: async ({canvas, userEvent}) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('The venue display could not refresh.')
    await userEvent.click(canvas.getByRole('button', {name: /try again/i}))
    await expect(retry).toHaveBeenCalledOnce()
  },
}

export const StaleData: Story = {
  args: {
    viewState: {
      status: 'stale',
      data: liveDashboard,
      message: 'The venue display could not refresh.',
    },
  },
  globals: {locale: 'en', theme: 'jam-dark', reviewDefaultViewport: 'venue', reducedMotion: true},
  play: async ({canvas}) => {
    await waitFor(async () => {
      await expect(canvas.getByText(/updates paused/i)).toBeVisible()
      await expect(canvas.getByRole('heading', {level: 2, name: 'Psycho Killer'})).toBeVisible()
    })
  },
}
