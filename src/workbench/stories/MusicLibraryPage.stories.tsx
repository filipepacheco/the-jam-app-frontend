import type {Meta, StoryObj} from '@storybook/react-vite'
import {expect, fn} from 'storybook/test'
import {MusicPage} from '../../pages/MusicPage'
import type {MusicLibraryMutationPort, MusicLibraryQueryPort} from '../../lib/music/musicLibraryController'
import type {MusicResponseDto} from '../../types/api.types'
import {musicFixtures} from '../jamMusicFixtures'

const page = (items: readonly MusicResponseDto[], total = items.length) => ({
  items,
  meta: {total, skip: 0, take: 50, hasMore: total > 50},
})

const mutationPort: MusicLibraryMutationPort = {
  update: fn(async () => ({ok: true as const})),
  remove: fn(async () => ({ok: true as const})),
}

const cataloguePort: MusicLibraryQueryPort = {
  list: fn(async ({status}) => status === 'SUGGESTED'
    ? page([musicFixtures.suggested])
    : page([musicFixtures.approved, musicFixtures.longContent], 120)),
}

const emptyPort: MusicLibraryQueryPort = {
  list: fn(async () => page([])),
}

const failedPort: MusicLibraryQueryPort = {
  list: fn(async () => {
    throw new Error('The approved Music catalogue could not be refreshed.')
  }),
}

const meta = {
  title: 'Human review/Screen refinement/Music library',
  component: MusicPage,
  args: {queryPort: cataloguePort, mutationPort},
  parameters: {a11y: {test: 'error'}, layout: 'fullscreen'},
} satisfies Meta<typeof MusicPage>

export default meta
type Story = StoryObj<typeof meta>

export const ViewerCatalogue: Story = {
  globals: {
    authRole: 'viewer',
    locale: 'pt',
    theme: 'jam-light',
    reviewDefaultViewport: 'phone',
    reducedMotion: true,
  },
  play: async ({canvas}) => {
    await expect(await canvas.findByRole('heading', {level: 1, name: /biblioteca musical/i})).toBeVisible()
    await expect(await canvas.findByText('Psycho Killer')).toBeVisible()
    await expect(canvas.queryByRole('status', {name: /aprovado/i})).not.toBeInTheDocument()
    await expect(canvas.getByRole('spinbutton', {name: /número da página/i})).toBeVisible()
    await expect(canvas.getByRole('button', {name: /próxima página/i})).toBeEnabled()
  },
}

export const HostModeration: Story = {
  globals: {
    authRole: 'host',
    locale: 'en',
    theme: 'jam-dark',
    reviewDefaultViewport: 'desktop',
  },
  play: async ({canvas, userEvent}) => {
    const suggested = await canvas.findByRole('button', {name: /suggested songs/i})
    await userEvent.click(suggested)
    await expect(await canvas.findByText("(I Can't Get No) Satisfaction")).toBeVisible()
    await expect(canvas.getByRole('status', {name: /suggested/i})).toBeVisible()
    await expect(canvas.getByRole('button', {name: /approve/i})).toBeVisible()
    await expect(canvas.getByRole('button', {name: /reject/i})).toBeVisible()
  },
}

export const EmptyLibrary: Story = {
  args: {queryPort: emptyPort},
  globals: {
    authRole: 'viewer',
    locale: 'es',
    theme: 'jam-dark',
    reviewDefaultViewport: 'phone',
    reducedMotion: true,
  },
  play: async ({canvas}) => {
    await expect(await canvas.findByRole('heading', {name: /no hay música en la biblioteca/i})).toBeVisible()
  },
}

export const RecoverableQueryFailure: Story = {
  args: {queryPort: failedPort},
  globals: {
    authRole: 'viewer',
    locale: 'en',
    theme: 'jam-light',
    reviewDefaultViewport: 'desktop',
    reducedMotion: true,
  },
  play: async ({canvas, userEvent}) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent('The approved Music catalogue could not be refreshed.')
    const retry = canvas.getByRole('button', {name: /try again/i})
    await userEvent.click(retry)
    await expect(failedPort.list).toHaveBeenCalled()
  },
}
