import type {Meta, StoryObj} from '@storybook/react-vite'
import {HelmetProvider} from 'react-helmet-async'
import {expect, fn, within} from 'storybook/test'
import {JamDetailPageV2} from '../../pages/tabs/JamDetailPageV2'
import {SuggestNewSongModal} from '../../components/jam-detail-v2/SuggestNewSongModal'
import {ScheduleEnrollmentModal} from '../../components/schedule/ScheduleEnrollmentModal'
import type {JamParticipationOutcome} from '../../lib/jam-participation/jamParticipationController'
import {jamFixtures, scheduleFixtures} from '../jamMusicFixtures'

const meta = {
  title: 'Human review/Screen refinement/Jam detail',
  component: JamDetailPageV2,
  parameters: {a11y: {test: 'error'}, layout: 'fullscreen'},
} satisfies Meta<typeof JamDetailPageV2>

export default meta
type Story = StoryObj<typeof meta>

const navigate = fn()
const retry = fn(async () => undefined)
const page = (content: React.ReactNode) => <HelmetProvider>{content}</HelmetProvider>
const participationSuccess = async (): Promise<JamParticipationOutcome> => ({
  code: 'success',
  operation: 'registration',
  entityId: 'review-registration',
})
const suggestionSuccess = async (): Promise<JamParticipationOutcome> => ({
  code: 'success',
  operation: 'suggestion',
  entityId: 'review-music',
})

export const Loading: Story = {
  render: () => page(<JamDetailPageV2 viewState={{status: 'loading'}} onNavigate={navigate} />),
  globals: {
    authRole: 'guest',
    locale: 'pt',
    theme: 'jam-light',
    reviewDefaultViewport: 'phone',
    reducedMotion: true,
  },
  parameters: {
    a11y: {test: 'error'},
    designSystem: {
      interaction: {
        status: 'not-applicable',
        rationale: 'Static Jam detail loading state with no user interaction.',
      },
    },
  },
}

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
    reviewDefaultViewport: 'phone',
    reducedMotion: true,
  },
  play: async ({canvas, canvasElement, userEvent}) => {
    const title = canvas.getByRole('heading', {level: 1, name: 'Friday Night Jam'})
    const schedule = canvas.getByRole('heading', {level: 2, name: /programação/i})
    const description = canvas.getByText(/an open stage for musicians/i)
    const jamDate = canvas.getByText(/18 de set/i)
    const performances = canvas.getByText(/3 apresentações/i)
    const registrations = canvas.getByText(/2 inscritos/i)
    const duration = canvas.getByText(/^16m$/i)
    const share = canvas.getByRole('button', {name: /compartilhar/i})
    const location = canvas.getByRole('button', {name: /endereço completo/i})
    const detailContainers = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-jam-detail-container]'))
    await expect(title).toBeVisible()
    await expect(detailContainers.length).toBeGreaterThanOrEqual(2)
    const containerLeftEdges = detailContainers.map((container) => container.getBoundingClientRect().left)
    const containerRightEdges = detailContainers.map((container) => container.getBoundingClientRect().right)
    await expect(Math.max(...containerLeftEdges) - Math.min(...containerLeftEdges)).toBeLessThan(2)
    await expect(Math.max(...containerRightEdges) - Math.min(...containerRightEdges)).toBeLessThan(2)
    await expect(canvas.queryByRole('button', {name: /voltar|back/i})).toBeNull()
    await expect(share).toHaveClass('ds-action--icon-only')
    await expect(share.getBoundingClientRect().width).toBe(44)
    const spotify = canvas.getByRole('link', {name: /ouça no spotify/i})
    await expect(spotify).toBeVisible()
    await expect(spotify).toHaveClass('ds-action--icon-only', 'ds-action--spotify')
    await expect(spotify.getBoundingClientRect().width).toBe(44)
    await expect(jamDate.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const factCells = [jamDate.parentElement, performances, registrations, duration]
    const factTops = factCells.map((fact) => fact?.getBoundingClientRect().top ?? -1)
    await expect(Math.max(...factTops) - Math.min(...factTops)).toBeLessThan(2)
    const locationWidth = location.getBoundingClientRect().width
    const locationRowWidth = location.parentElement?.getBoundingClientRect().width ?? 0
    await expect(Math.abs(locationRowWidth - locationWidth)).toBeLessThan(2)
    await expect(location.parentElement).toHaveClass('jam-detail-location')
    await expect(canvas.queryByRole('button', {name: /como.*funciona/i})).toBeNull()
    await expect(title.compareDocumentPosition(schedule) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await expect(canvas.getAllByText('Psycho Killer')).toHaveLength(2)

    const longTitle = canvas.getByRole('heading', {level: 3, name: /a song title deliberately long/i})
    const performanceCard = longTitle.closest<HTMLElement>('.card')
    if (!performanceCard) throw new Error('Expected the long-content Performance card.')
    const performance = within(performanceCard)
    const artist = performance.getByText(/international collective of musicians/i)
    const songDescription = performance.getByText(/play the extended arrangement/i)
    const participant = performance.getByText(/^você$/i)
    await expect(artist).toHaveClass('line-clamp-2')
    await expect(performance.getByRole('link', {name: /open .* in spotify/i})).toBeVisible()
    await expect(songDescription.compareDocumentPosition(participant) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    const documentView = within(canvasElement.ownerDocument.body)
    const participate = await documentView.findByRole('button', {name: /^quero participar$/i})
    await expect(participate).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(participate)
    await userEvent.click(documentView.getByRole('button', {name: /^quero participar$/i}))
    await expect(documentView.getByRole('dialog')).toBeVisible()
  },
}

export const ReviewInstrumentChoice: Story = {
  render: () => page(
    <ScheduleEnrollmentModal
      schedule={scheduleFixtures[0]}
      isOpen
      musicianId="musician-fixture"
      preferredInstrument="guitars"
      onClose={fn()}
      onSubmit={participationSuccess}
    />,
  ),
  globals: {
    authRole: 'user',
    locale: 'pt',
    theme: 'jam-light',
    reviewDefaultViewport: 'phone',
    reducedMotion: true,
  },
  play: async ({canvas}) => {
    await expect(canvas.getByRole('button', {name: /guitarr/i})).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.queryByText(/vagas restantes/i)).toBeNull()
  },
}

export const ReviewNewMusicSuggestion: Story = {
  render: () => page(
    <SuggestNewSongModal
      isOpen
      onClose={fn()}
      onSubmit={suggestionSuccess}
    />,
  ),
  globals: {
    authRole: 'user',
    locale: 'pt',
    theme: 'jam-light',
    reviewDefaultViewport: 'phone',
    reducedMotion: true,
  },
  play: async ({canvas}) => {
    await expect(canvas.getByRole('button', {name: /manualmente/i})).toBeVisible()
    await expect(canvas.getByRole('button', {name: /spotify/i})).toBeVisible()
  },
}

export const LongContentAndLocation: Story = {
  render: () => page(
    <JamDetailPageV2
      viewState={{
        status: 'loaded',
        jam: {
          ...jamFixtures.longContent,
          location: 'Benjamin Social Club, Avenida da Música 1234, São Paulo',
          slug: 'long-content-jam',
        },
      }}
      onNavigate={navigate}
    />,
  ),
  globals: {
    authRole: 'user',
    locale: 'en',
    theme: 'jam-dark',
    reviewDefaultViewport: 'desktop',
    reducedMotion: true,
  },
  play: async ({canvas, userEvent}) => {
    await expect(canvas.getByRole('heading', {level: 1, name: /deliberately long venue/i})).toBeVisible()
    await userEvent.click(canvas.getByRole('button', {name: /show more/i}))
    await expect(canvas.getByText(/arrive before soundcheck/i)).toBeVisible()
    await userEvent.click(canvas.getByRole('button', {name: /full address/i}))
    await expect(canvas.getAllByText(/avenida da música 1234/i)).toHaveLength(2)
    await expect(canvas.queryByText(/^full address$/i)).toBeNull()
    const copyAddress = canvas.getByRole('button', {name: /copy address/i})
    await expect(copyAddress).toHaveAttribute('data-action-variant', 'quiet')
    await expect(copyAddress).not.toHaveClass('w-full')
  },
}

export const GuestParticipationRedirect: Story = {
  render: () => page(
    <JamDetailPageV2
      viewState={{status: 'loaded', jam: jamFixtures.active}}
      onNavigate={navigate}
    />,
  ),
  globals: {
    authRole: 'guest',
    locale: 'en',
    theme: 'jam-light',
    reviewDefaultViewport: 'phone',
    reducedMotion: true,
  },
  play: async ({canvas, userEvent}) => {
    await userEvent.click(canvas.getByRole('button', {name: /^register$/i}))
    await expect(navigate).toHaveBeenCalledWith('/login?redirect=/jams/jam-friday')
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
    reviewDefaultViewport: 'phone',
    reducedMotion: true,
  },
  play: async ({canvas, canvasElement}) => {
    await expect(canvas.getByRole('heading', {level: 1, name: 'Friday Night Jam'})).toBeVisible()
    await expect(canvas.getByRole('heading', {level: 2, name: /aún no hay programación/i})).toBeVisible()
    await expect(within(canvasElement.ownerDocument.body).queryByRole('button', {name: /participar/i})).toBeNull()
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
    reviewDefaultViewport: 'desktop',
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
    reviewDefaultViewport: 'phone',
    reducedMotion: true,
  },
  play: async ({canvas, userEvent}) => {
    await expect(canvas.getByRole('heading', {level: 1, name: /jam não encontrado/i})).toBeVisible()
    await userEvent.click(canvas.getByRole('button', {name: /voltar para jams/i}))
    await expect(navigate).toHaveBeenCalledWith('/jams')
  },
}
