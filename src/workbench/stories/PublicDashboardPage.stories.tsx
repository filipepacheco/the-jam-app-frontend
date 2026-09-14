import type {Meta, StoryObj} from '@storybook/react-vite'
import {expect, fn} from 'storybook/test'
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
  currentSong: dashboardSongs.current,
  nextSongs: [dashboardSongs.next],
}

const retry = fn(async () => undefined)

const meta = {
  title: 'Pages/Screen refinement/Public Dashboard transitions',
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
    viewport: {value: 'venue', isRotated: false},
  },
  play: async ({canvas}) => {
    await expect(canvas.getByRole('heading', {level: 2, name: 'Psycho Killer'})).toBeVisible()
    await expect(canvas.getByText(/tocando agora/i)).toBeVisible()
    await expect(canvas.getByText(/em seguida/i)).toBeVisible()
  },
}

export const StartingSoon: Story = {
  args: {
    viewState: {status: 'loaded', data: {...liveDashboard, jamStatus: 'ACTIVE', currentSong: null}},
  },
  globals: {locale: 'es', theme: 'jam-light', viewport: {value: 'venue', isRotated: false}, reducedMotion: true},
  play: async ({canvas}) => {
    await expect(canvas.getByRole('heading', {level: 2, name: /comenzando pronto/i})).toBeVisible()
    await expect(canvas.getByText(dashboardSongs.next.title)).toBeVisible()
  },
}

export const Finished: Story = {
  args: {
    viewState: {
      status: 'loaded',
      data: {...liveDashboard, jamStatus: 'FINISHED', currentSong: null, nextSongs: []},
    },
  },
  globals: {locale: 'en', theme: 'jam-dark', viewport: {value: 'venue', isRotated: false}, reducedMotion: true},
  play: async ({canvas}) => {
    await expect(canvas.getByRole('heading', {level: 2, name: /that's a wrap/i})).toBeVisible()
  },
}

export const LiveCarousel: Story = {
  args: {layoutOverride: 'carousel'},
  globals: {locale: 'en', theme: 'jam-light', viewport: {value: 'venue', isRotated: false}, reducedMotion: true},
  play: async ({canvas}) => {
    await expect(canvas.getAllByRole('tab')).toHaveLength(3)
    await expect(canvas.getByText('Psycho Killer')).toBeVisible()
  },
}

export const Loading: Story = {
  args: {viewState: {status: 'loading'}},
  globals: {locale: 'pt', theme: 'jam-dark', viewport: {value: 'venue', isRotated: false}, reducedMotion: true},
  play: async ({canvas}) => {
    await expect(canvas.getByRole('status', {name: /carregando o painel/i})).toHaveAttribute('aria-busy', 'true')
  },
}

export const RecoverableError: Story = {
  args: {viewState: {status: 'error', message: 'The venue display could not refresh.'}, onRetry: retry},
  globals: {locale: 'en', theme: 'jam-light', viewport: {value: 'venue', isRotated: false}, reducedMotion: true},
  play: async ({canvas, userEvent}) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('The venue display could not refresh.')
    await userEvent.click(canvas.getByRole('button', {name: /try again/i}))
    await expect(retry).toHaveBeenCalledOnce()
  },
}
