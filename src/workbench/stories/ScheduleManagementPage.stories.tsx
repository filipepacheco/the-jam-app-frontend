import type {Meta, StoryObj} from '@storybook/react-vite'
import {http, HttpResponse} from 'msw'
import {expect, fn, within} from 'storybook/test'
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
  parameters: {a11y: {test: 'error'}, msw: {handlers: [musicCatalogueHandler]}},
  play: async ({canvas, canvasElement, userEvent}) => {
    const add = canvas.getByRole('button', {name: /add new song/i})
    await expect(add).toBeVisible()
    await userEvent.click(add)
    const documentView = within(canvasElement.ownerDocument.body)
    await expect(await documentView.findByRole('dialog', {name: /add performance entry/i})).toBeVisible()
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
    await expect(canvas.getByRole('button', {name: /agregar nueva canción/i})).toBeVisible()
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
    const search = canvas.getByRole('searchbox', {name: /search songs or musicians/i})
    await userEvent.type(search, 'no matching performance')
    await expect(await canvas.findByText('No results found')).toBeVisible()
    await expect(canvas.getByRole('button', {name: /clear filters/i})).toBeVisible()
  },
}
