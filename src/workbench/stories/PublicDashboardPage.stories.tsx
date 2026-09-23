import type {Meta, StoryObj} from '@storybook/react-vite'
import {useState} from 'react'
import {expect, fn, waitFor} from 'storybook/test'
import {PublicDashboardPage} from '../../pages/PublicDashboardPage'
import {dashboardSongs, venueDashboard as liveDashboard} from '../publicDashboardFixtures'

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
      await expect(canvas.getByText('Camila')).toBeVisible()
      await expect(canvas.getByRole('img', {name: /código qr/i})).toBeVisible()
    })
  },
}

export const StartingSoon: Story = {
  args: {
    viewState: {status: 'loaded', data: {...liveDashboard, jamStatus: 'ACTIVE', currentSong: null}},
  },
  globals: {locale: 'es', theme: 'jam-light', reviewTheme: 'jam-light', reviewDefaultViewport: 'venue', reducedMotion: true},
  play: async ({canvas}) => {
    await waitFor(async () => {
      await expect(canvas.getByText(/comenzando pronto/i)).toBeVisible()
      await expect(canvas.getByRole('heading', {level: 2, name: /esperando la próxima actuación/i})).toBeVisible()
      await expect(canvas.getByText('Valerie')).toBeVisible()
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

function LiveChangesReview() {
  const [data, setData] = useState(liveDashboard)
  const buttonClass = 'ds-control ds-focusable rounded-field bg-base-100 border border-base-content/20 px-3 text-sm font-semibold'

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[60] flex flex-wrap justify-end gap-2" role="group" aria-label="Simular mudanças ao vivo">
        <button type="button" className={buttonClass} onClick={() => setData(current => ({
          ...current,
          currentSong: current.currentSong?.id === dashboardSongs.current.id ? liveDashboard.nextSongs[0] : dashboardSongs.current,
        }))}>Trocar música</button>
        <button type="button" className={buttonClass} onClick={() => setData(current => {
          if (!current.currentSong) return current
          const musicians = current.currentSong.musicians
          return {...current, currentSong: {...current.currentSong, musicians: musicians.some(({id}) => id === 'demo-keys')
            ? musicians.filter(({id}) => id !== 'demo-keys')
            : [...musicians, {id: 'demo-keys', name: 'Bianca', instrument: 'keys'}],
          }}
        })}>Trocar músicos</button>
        <button type="button" className={buttonClass} onClick={() => setData(current => ({
          ...current,
          nextSongs: current.nextSongs[0]?.id === 'demo-next'
            ? liveDashboard.nextSongs
            : [{...liveDashboard.nextSongs[0], id: 'demo-next', title: 'Stand by Me', artist: 'Ben E. King'}],
        }))}>Trocar próxima</button>
        <button type="button" className={buttonClass} onClick={() => setData(current => structuredClone(current))}>Atualizar sem mudanças</button>
      </div>
      <PublicDashboardPage viewState={{status: 'loaded', data}} layoutOverride="classic" />
    </>
  )
}

export const LiveChanges: Story = {
  render: () => <LiveChangesReview />,
  globals: {locale: 'pt', theme: 'jam-dark', reviewDefaultViewport: 'venue', reducedMotion: false},
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
    await expect(canvas.queryByText('Valerie')).not.toBeInTheDocument()
    await expect(canvas.queryByText(/sign up to sing/i)).not.toBeInTheDocument()
  },
}

export const LongLineups: Story = {
  args: {viewState: {status: 'loaded', data: {...liveDashboard,
    currentSong: {...dashboardSongs.current,
      title: 'Everybody Wants to Rule the World',
      artist: 'Tears for Fears',
      musicians: [...dashboardSongs.current.musicians,
        {id: 'long-bass', name: 'João Pedro de Albuquerque', instrument: 'bass'},
        {id: 'long-keys', name: 'María Fernanda Rodríguez', instrument: 'keys'},
        {id: 'second-vocal', name: 'Ana Carolina', instrument: 'vocals'},
      ],
    }, nextSongs: [dashboardSongs.next],
  }}},
  globals: {locale: 'en', theme: 'jam-light', reviewTheme: 'jam-light', reviewDefaultViewport: 'venue', reducedMotion: true},
  play: async ({canvas}) => {
    await expect(canvas.getByText('João Pedro de Albuquerque')).toBeVisible()
    await expect(canvas.getByText(dashboardSongs.next.title)).toBeVisible()
    await expect(canvas.getByRole('link', {name: /friday-night-jam/})).toHaveAttribute('href', expect.stringContaining('/friday-night-jam'))
  },
}

export const EmptyQueue: Story = {
  args: {viewState: {status: 'loaded', data: {...liveDashboard, currentSong: null, nextSongs: []}}},
  globals: {locale: 'en', theme: 'jam-dark', reviewDefaultViewport: 'venue', reducedMotion: true},
  play: async ({canvas}) => {
    await expect(canvas.getByText('Next song to be announced')).toBeVisible()
    await expect(canvas.getByText('Choose a song')).toBeVisible()
  },
}

export const Phone: Story = {
  globals: {locale: 'es', theme: 'jam-light', reviewTheme: 'jam-light', reviewDefaultViewport: 'phone', reducedMotion: true},
  play: async ({canvas}) => {
    await expect(canvas.getByText('Camila')).toBeVisible()
    await expect(canvas.getByRole('link', {name: /friday-night-jam/})).toBeVisible()
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
