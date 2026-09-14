import type {Meta, StoryObj} from '@storybook/react-vite'
import {HelmetProvider} from 'react-helmet-async'
import {expect, fn, within} from 'storybook/test'
import {JamDetailPageV2} from '../../pages/tabs/JamDetailPageV2'
import {jamFixtures} from '../jamMusicFixtures'

const meta = {
  title: 'Pages/Screen refinement/Jam detail',
  component: JamDetailPageV2,
  parameters: {a11y: {test: 'error'}, layout: 'fullscreen'},
} satisfies Meta<typeof JamDetailPageV2>

export default meta
type Story = StoryObj<typeof meta>

const navigate = fn()
const retry = fn(async () => undefined)
const page = (content: React.ReactNode) => <HelmetProvider>{content}</HelmetProvider>

export const LoadedParticipation: Story = {
  render: () => page(
    <JamDetailPageV2
      viewState={{status: 'loaded', jam: jamFixtures.active}}
      onNavigate={navigate}
    />,
  ),
  globals: {
    authRole: 'user',
    locale: 'pt',
    theme: 'jam-light',
    viewport: {value: 'phone', isRotated: false},
    reducedMotion: true,
  },
  play: async ({canvas, canvasElement, userEvent}) => {
    const title = canvas.getByRole('heading', {level: 1, name: 'Friday Night Jam'})
    const schedule = canvas.getByRole('heading', {level: 2, name: /programação/i})
    await expect(title).toBeVisible()
    await expect(title.compareDocumentPosition(schedule) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await expect(canvas.getByText('Psycho Killer')).toBeVisible()

    const documentView = within(canvasElement.ownerDocument.body)
    const participate = await documentView.findByRole('button', {name: /participar/i})
    await expect(participate).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(participate)
    await userEvent.click(documentView.getByRole('button', {name: /participar/i}))
    await expect(documentView.getByRole('dialog')).toBeVisible()
  },
}

export const NoPerformances: Story = {
  render: () => page(
    <JamDetailPageV2
      viewState={{
        status: 'loaded',
        jam: {...jamFixtures.active, schedules: [], _count: {...jamFixtures.active._count, schedules: 0}},
      }}
      onNavigate={navigate}
    />,
  ),
  globals: {
    authRole: 'user',
    locale: 'es',
    theme: 'jam-dark',
    viewport: {value: 'phone', isRotated: false},
    reducedMotion: true,
  },
  play: async ({canvas, canvasElement, userEvent}) => {
    await expect(canvas.getByRole('heading', {level: 1, name: 'Friday Night Jam'})).toBeVisible()
    await expect(canvas.getByRole('heading', {level: 2, name: /aún no hay programación/i})).toBeVisible()
    await expect(within(canvasElement.ownerDocument.body).queryByRole('button', {name: /participar/i})).toBeNull()
    await userEvent.click(canvas.getByRole('button', {name: /volver/i}))
    await expect(navigate).toHaveBeenCalledWith('/jams')
  },
}

export const RecoverableError: Story = {
  render: () => page(
    <JamDetailPageV2
      viewState={{status: 'error', message: 'The Jam could not be refreshed.'}}
      onNavigate={navigate}
      onRetry={retry}
    />,
  ),
  globals: {
    authRole: 'guest',
    locale: 'en',
    theme: 'jam-dark',
    viewport: {value: 'desktop', isRotated: false},
    reducedMotion: true,
  },
  play: async ({canvas, userEvent}) => {
    await expect(canvas.getByRole('heading', {level: 1, name: /error loading jam/i})).toBeVisible()
    await expect(canvas.getByRole('alert')).toHaveTextContent('The Jam could not be refreshed.')
    await userEvent.click(canvas.getByRole('button', {name: /try again/i}))
    await expect(retry).toHaveBeenCalledOnce()
  },
}

export const NotFound: Story = {
  render: () => page(
    <JamDetailPageV2 viewState={{status: 'not-found'}} onNavigate={navigate} />,
  ),
  globals: {
    authRole: 'guest',
    locale: 'pt',
    theme: 'jam-light',
    viewport: {value: 'phone', isRotated: false},
    reducedMotion: true,
  },
  play: async ({canvas, userEvent}) => {
    await expect(canvas.getByRole('heading', {level: 1, name: /jam não encontrado/i})).toBeVisible()
    await userEvent.click(canvas.getByRole('button', {name: /voltar para jams/i}))
    await expect(navigate).toHaveBeenCalledWith('/jams')
  },
}
