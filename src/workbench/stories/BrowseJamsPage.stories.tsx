import type {Meta, StoryObj} from '@storybook/react-vite'
import {HelmetProvider} from 'react-helmet-async'
import {expect} from 'storybook/test'
import {BrowseJamsPage} from '../../pages/BrowseJamsPage'
import {jamFixtures} from '../jamMusicFixtures'

const jams = [
  {...jamFixtures.longContent, id: 'jam-live', status: 'LIVE' as const},
  {...jamFixtures.active, id: 'jam-upcoming', name: 'Sunday afternoon Jam', status: 'ACTIVE' as const},
  {...jamFixtures.active, id: 'jam-past', name: 'Last season Jam', status: 'FINISHED' as const},
]

const meta = {
  title: 'Human review/Screen refinement/Browse Jams hierarchy',
  component: BrowseJamsPage,
  args: {viewState: {status: 'loaded', data: jams}},
  decorators: [(Story) => <HelmetProvider><Story /></HelmetProvider>],
  parameters: {a11y: {test: 'error'}, layout: 'fullscreen'},
} satisfies Meta<typeof BrowseJamsPage>

export default meta
type Story = StoryObj<typeof BrowseJamsPage>

export const DiscoveryHierarchy: Story = {
  globals: {authRole: 'viewer', locale: 'pt', theme: 'jam-light', viewport: {value: 'phone', isRotated: false}, reducedMotion: true},
  play: async ({canvas}) => {
    await expect(canvas.getByRole('heading', {level: 1, name: /encontre uma jam/i})).toBeVisible()
    await expect(canvas.getByText(jamFixtures.longContent.name)).toBeVisible()
    await expect(canvas.getByRole('button', {name: /jams passad/i})).toHaveAttribute('aria-expanded', 'false')
  },
}

export const FilteredEmpty: Story = {
  globals: {authRole: 'viewer', locale: 'en', theme: 'jam-dark', viewport: {value: 'desktop', isRotated: false}},
  play: async ({canvas, userEvent}) => {
    await userEvent.type(canvas.getByRole('textbox', {name: /search jam sessions/i}), 'no matching venue')
    await expect(canvas.getByRole('heading', {name: /no jam sessions found/i})).toBeVisible()
    await expect(canvas.getByRole('button', {name: /clear filters/i})).toBeVisible()
    await expect(canvas.queryByText(/no current jam sessions/i)).toBeNull()
  },
}

export const FirstUseEmpty: Story = {
  args: {viewState: {status: 'loaded', data: []}},
  globals: {authRole: 'viewer', locale: 'es', theme: 'jam-light', viewport: {value: 'phone', isRotated: false}, reducedMotion: true},
  play: async ({canvas}) => {
    await expect(canvas.getByRole('heading', {name: /no se encontraron sesiones de jam/i})).toBeVisible()
    await expect(canvas.queryByRole('button', {name: /limpiar filtros/i})).toBeNull()
  },
}

export const RefreshingStaleResults: Story = {
  args: {viewState: {status: 'refreshing', data: jams}},
  globals: {authRole: 'viewer', locale: 'pt', theme: 'jam-dark', viewport: {value: 'desktop', isRotated: false}, reducedMotion: true},
  play: async ({canvas}) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(/carregando/i)
    await expect(canvas.getByText(jamFixtures.longContent.name)).toBeVisible()
  },
}

export const RecoverableErrorWithStaleResults: Story = {
  args: {viewState: {status: 'error', message: 'Fresh Jam results are unavailable.', data: jams}},
  globals: {authRole: 'viewer', locale: 'en', theme: 'jam-light', viewport: {value: 'desktop', isRotated: false}, reducedMotion: true},
  play: async ({canvas}) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('Fresh Jam results are unavailable.')
    await expect(canvas.getByText(jamFixtures.longContent.name)).toBeVisible()
    await expect(canvas.getByRole('button', {name: /try again/i})).toBeVisible()
  },
}
