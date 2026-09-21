import type {Meta, StoryObj} from '@storybook/react-vite'
import {http, HttpResponse} from 'msw'
import {expect, fn, waitFor, within} from 'storybook/test'
import {ScheduleTab} from '../../pages/tabs/ScheduleTab'
import {jamFixtures, musicFixtures, scheduleFixtures} from '../jamMusicFixtures'

const meta = {
  title: 'Human review/Screen refinement/Schedule management',
  component: ScheduleTab,
  args: {jam: jamFixtures.active, onReload: async () => jamFixtures.active},
  parameters: {a11y: {test: 'error'}, layout: 'fullscreen'},
} satisfies Meta<typeof ScheduleTab>

export default meta
type Story = StoryObj<typeof meta>

const musicCatalogueHandler = http.get('*/musicas', () => HttpResponse.json({
  success: true,
  data: Object.values(musicFixtures),
  meta: {total: 3, skip: 0, take: 100, hasMore: false},
}))

const spotifyTrackHandler = http.post('*/spotify/track', () => HttpResponse.json({
  success: true,
  data: {
    id: 'spotify-track-fixture',
    title: 'Once in a Lifetime',
    artist: 'Talking Heads',
    durationMs: 259000,
    spotifyUrl: 'https://open.spotify.com/track/fixture',
  },
}))

export const OperationalGroups: Story = {
  render: () => <ScheduleTab jam={jamFixtures.active} onReload={fn(async () => jamFixtures.active)} />,
  globals: {
    authRole: 'host',
    locale: 'pt',
    theme: 'jam-dark',
    reviewDefaultViewport: 'desktop',
  },
  play: async ({canvas, userEvent}) => {
    const active = canvas.getByRole('heading', {level: 2, name: /tocando agora/i})
    const upcoming = canvas.getByRole('heading', {level: 2, name: /agendada/i})
    const suggested = canvas.getByRole('heading', {level: 2, name: /músicas sugeridas/i})
    const completed = canvas.getByRole('heading', {level: 2, name: /concluída/i})
    await expect(active).toBeVisible()
    await expect(upcoming).toBeVisible()
    await expect(suggested).toBeVisible()
    await expect(completed).toBeVisible()
    await expect(active.compareDocumentPosition(upcoming) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await expect(upcoming.compareDocumentPosition(suggested) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await expect(active.closest('[data-performance-priority="current"]')).not.toBeNull()
    await expect(suggested.closest('[data-performance-priority="secondary"]')).not.toBeNull()
    await expect(completed.closest('[data-performance-priority="secondary"]')).not.toBeNull()
    const menu = canvas.getAllByRole('button', {name: /actions|ações/i})[0]
    await userEvent.click(menu)
    await expect(canvas.getByRole('menu')).toBeVisible()
  },
}

const smallScheduleJam = {
  ...jamFixtures.active,
  schedules: scheduleFixtures.slice(0, 2),
  _count: {...jamFixtures.active._count, schedules: 2},
}

export const SmallScheduleAddPath: Story = {
  render: () => <ScheduleTab jam={smallScheduleJam} onReload={fn(async () => smallScheduleJam)} />,
  globals: {
    authRole: 'host',
    locale: 'en',
    theme: 'jam-light',
    reviewDefaultViewport: 'phone',
    reducedMotion: true,
  },
  parameters: {a11y: {test: 'error'}, msw: {handlers: [musicCatalogueHandler, spotifyTrackHandler]}},
  play: async ({canvas, canvasElement, userEvent}) => {
    const add = canvas.getByRole('button', {name: /add song/i})
    await expect(add).toBeVisible()
    await userEvent.click(add)
    const documentView = within(canvasElement.ownerDocument.body)
    const addDialog = await documentView.findByRole('dialog', {name: /add performance entry/i})
    await expect(addDialog).toBeVisible()
    const musicSelect = within(addDialog).getByRole('button', {name: /^song \*?$/i})
    await waitFor(() => expect(musicSelect).toBeEnabled())
    await userEvent.click(musicSelect)
    const musicList = await documentView.findByRole('listbox')
    await expect(musicList).toBeVisible()
    const dropdownLayer = musicList.parentElement
    const listBounds = musicList.getBoundingClientRect()
    const paintedOption = canvasElement.ownerDocument.elementFromPoint(listBounds.left + 8, listBounds.top + 8)
    await expect(dropdownLayer).toContainElement(paintedOption as HTMLElement)
    await userEvent.click(musicSelect)
    await userEvent.click(within(addDialog).getByRole('button', {name: /create new song/i}))
    const createDialog = await documentView.findByRole('dialog', {name: /add new song/i})
    await expect(within(createDialog).getByRole('button', {name: /enter details manually/i})).toBeVisible()
    await userEvent.click(within(createDialog).getByRole('button', {name: /import from spotify/i}))
    const spotifyUrl = within(createDialog).getByRole('textbox', {name: /spotify url/i})
    await userEvent.type(spotifyUrl, 'https://open.spotify.com/track/fixture')
    await userEvent.click(within(createDialog).getByRole('button', {name: /^import$/i}))
    await expect(await within(createDialog).findByDisplayValue('Once in a Lifetime')).toBeVisible()
    await expect(within(createDialog).getByDisplayValue('Talking Heads')).toBeVisible()
    await expect(within(createDialog).getByRole('combobox', {name: /genre/i})).toBeVisible()
    await expect(within(createDialog).getByRole('spinbutton', {name: /drummers/i})).toBeVisible()
  },
}

const emptyScheduleJam = {
  ...jamFixtures.active,
  schedules: [],
  _count: {...jamFixtures.active._count, schedules: 0},
}

export const EmptySchedule: Story = {
  render: () => <ScheduleTab jam={emptyScheduleJam} onReload={fn(async () => emptyScheduleJam)} />,
  globals: {
    authRole: 'host',
    locale: 'es',
    theme: 'jam-dark',
    reviewDefaultViewport: 'phone',
    reducedMotion: true,
  },
  play: async ({canvas}) => {
    await expect(canvas.getByRole('heading', {name: /no hay programación aún/i})).toBeVisible()
    await expect(canvas.getByRole('button', {name: /agregar canción/i})).toBeVisible()
  },
}

export const FilteredEmpty: Story = {
  render: () => <ScheduleTab jam={jamFixtures.active} onReload={fn(async () => jamFixtures.active)} />,
  globals: {
    authRole: 'host',
    locale: 'en',
    theme: 'jam-light',
    reviewDefaultViewport: 'phone',
    reducedMotion: true,
  },
  parameters: {a11y: {test: 'error'}},
  play: async ({canvas, userEvent}) => {
    const search = canvas.getByRole('searchbox', {name: /search music or musicians/i})
    await userEvent.type(search, 'no matching performance')
    await expect(await canvas.findByText('No results found')).toBeVisible()
    const clearFilters = canvas
      .getAllByRole('button', {name: /clear filters/i})
      .find((candidate) => candidate.getClientRects().length > 0)
    await expect(clearFilters).toBeDefined()
    await expect(clearFilters!).toBeVisible()
  },
}
