import type {Meta, StoryObj} from '@storybook/react-vite'
import {expect, fn, userEvent, within} from 'storybook/test'
import {HostDashboardPage, type HostDashboardPort} from '../../pages/host/HostDashboardPage'
import {jamFixtures} from '../jamMusicFixtures'

const remove = fn(async () => undefined)

const operationalPort: HostDashboardPort = {
  list: fn(async () => [
    {...jamFixtures.longContent, id: 'jam-live', status: 'LIVE' as const},
    {...jamFixtures.active, id: 'jam-planned', name: 'Next month Jam', status: 'INACTIVE' as const},
    {...jamFixtures.active, id: 'jam-past', name: 'Last month Jam', status: 'FINISHED' as const},
  ]),
  remove,
}

const emptyPort: HostDashboardPort = {
  list: fn(async () => []),
  remove,
}

const plannedOnlyPort: HostDashboardPort = {
  list: fn(async () => [
    {...jamFixtures.active, id: 'jam-planned-only', name: 'Next month Jam', status: 'INACTIVE' as const},
  ]),
  remove,
}

const loadingPort: HostDashboardPort = {
  list: fn(() => new Promise<readonly typeof jamFixtures.active[]>(() => undefined)),
  remove,
}

const retryList = fn()
  .mockRejectedValueOnce(new Error('The Jam list is temporarily unavailable.'))
  .mockResolvedValue([])
const retryPort: HostDashboardPort = {list: retryList, remove}

const pendingRemove = fn(() => new Promise<void>(() => undefined))
const pendingDeletePort: HostDashboardPort = {
  list: fn(async () => [{...jamFixtures.longContent, id: 'jam-delete-pending', status: 'LIVE' as const}]),
  remove: pendingRemove,
}

const failedDeletePort: HostDashboardPort = {
  list: fn(async () => [{...jamFixtures.active, id: 'jam-delete-failed', name: 'Friday Jam', status: 'ACTIVE' as const}]),
  remove: fn(async () => { throw new Error('The Jam could not be deleted.') }),
}

const deletedJam = {...jamFixtures.active, id: 'jam-delete-success', name: 'Sunday Jam', status: 'ACTIVE' as const}
const successfulDeletePort: HostDashboardPort = {
  list: fn().mockResolvedValueOnce([deletedJam]).mockResolvedValue([]),
  remove: fn(async () => undefined),
}

function cardQueries(heading: HTMLElement) {
  const card = heading.closest('article')
  if (!(card instanceof HTMLElement)) throw new Error('Expected the Jam heading to be inside an article')
  return within(card)
}

const meta = {
  title: 'Human review/Screen refinement/Host dashboard',
  component: HostDashboardPage,
  args: {port: operationalPort},
  parameters: {a11y: {test: 'error'}, layout: 'fullscreen'},
} satisfies Meta<typeof HostDashboardPage>

export default meta
type Story = StoryObj<typeof meta>

export const OperationalPriority: Story = {
  globals: {
    authRole: 'host',
    locale: 'pt',
    theme: 'jam-dark',
    viewport: {value: 'desktop', isRotated: false},
  },
  play: async ({canvas}) => {
    const active = await canvas.findByRole('heading', {level: 2, name: /em andamento/i})
    const totals = canvas.getByText(/total de jams/i)
    const planned = canvas.getByRole('heading', {level: 2, name: /planejados/i})
    await expect(active).toBeVisible()
    await expect(active.compareDocumentPosition(totals) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await expect(totals.compareDocumentPosition(planned) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await expect(canvas.getAllByRole('button', {name: /gerenciar/i})[0]).toBeVisible()
  },
}

export const HostPhone: Story = {
  globals: {
    authRole: 'host',
    locale: 'en',
    theme: 'jam-light',
    viewport: {value: 'phone', isRotated: false},
    reducedMotion: true,
  },
  play: async ({canvas}) => {
    await expect(await canvas.findByRole('button', {name: /create new jam/i})).toBeVisible()
    await expect(canvas.getAllByRole('button', {name: /manage/i})[0]).toBeVisible()
    await expect(canvas.getAllByRole('button', {name: /more jam actions/i})[0]).toBeVisible()
  },
}

export const FirstJamOnboarding: Story = {
  args: {port: emptyPort},
  globals: {
    authRole: 'host',
    locale: 'es',
    theme: 'jam-dark',
    viewport: {value: 'phone', isRotated: false},
    reducedMotion: true,
  },
  play: async ({canvas}) => {
    await expect(await canvas.findByRole('heading', {level: 2, name: /crea tu primer jam/i})).toBeVisible()
    await expect(canvas.getAllByRole('button', {name: /crear nuevo jam/i})).toHaveLength(2)
  },
}

export const InitialLoading: Story = {
  args: {port: loadingPort},
  globals: {
    authRole: 'host',
    locale: 'pt',
    theme: 'jam-light',
    viewport: {value: 'desktop', isRotated: false},
    reducedMotion: true,
  },
  parameters: {
    a11y: {test: 'error'},
    designSystem: {
      interaction: {
        status: 'not-applicable',
        rationale: 'Static initial loading state with no user interaction.',
      },
    },
  },
}

export const QueryFailureAndRetry: Story = {
  args: {port: retryPort},
  globals: {
    authRole: 'host',
    locale: 'en',
    theme: 'jam-dark',
    viewport: {value: 'phone', isRotated: false},
    reducedMotion: true,
  },
  play: async ({canvas}) => {
    const retry = await canvas.findByRole('button', {name: /try again/i})
    await expect(canvas.getByRole('alert')).toBeVisible()
    await userEvent.click(retry)
    await expect(await canvas.findByRole('heading', {level: 2, name: /create your first jam/i})).toBeVisible()
  },
}

export const NoLiveCategory: Story = {
  args: {port: plannedOnlyPort},
  globals: {
    authRole: 'host',
    locale: 'en',
    theme: 'jam-light',
    viewport: {value: 'desktop', isRotated: false},
  },
  play: async ({canvas}) => {
    await expect(await canvas.findByRole('heading', {level: 2, name: /planned/i})).toBeVisible()
    await expect(canvas.queryByRole('heading', {level: 2, name: /in progress/i})).toBeNull()
    await expect(canvas.queryByRole('heading', {level: 2, name: /create your first jam/i})).toBeNull()
    await expect(canvas.getByRole('button', {name: /create new jam/i})).toBeVisible()
  },
}

export const DeletePending: Story = {
  args: {port: pendingDeletePort, confirmDelete: fn(() => true)},
  globals: {
    authRole: 'host',
    locale: 'pt',
    theme: 'jam-dark',
    viewport: {value: 'phone', isRotated: false},
    reducedMotion: true,
  },
  play: async ({canvas}) => {
    const jam = await canvas.findByRole('heading', {level: 3})
    const card = cardQueries(jam)
    await userEvent.click(card.getByRole('button', {name: /mais ações do jam/i}))
    await userEvent.click(card.getByRole('button', {name: /excluir/i}))
    await expect(card.getByRole('button', {name: /excluir/i})).toBeDisabled()
    await expect(card.getByRole('button', {name: /gerenciar/i})).toBeDisabled()
  },
}

export const DeleteFailure: Story = {
  args: {port: failedDeletePort, confirmDelete: fn(() => true)},
  globals: {
    authRole: 'host',
    locale: 'en',
    theme: 'jam-light',
    viewport: {value: 'desktop', isRotated: false},
  },
  play: async ({canvas}) => {
    const jam = await canvas.findByRole('heading', {level: 3, name: /friday jam/i})
    const card = cardQueries(jam)
    await userEvent.click(card.getByRole('button', {name: /more jam actions/i}))
    await userEvent.click(card.getByRole('button', {name: /delete/i}))
    await expect(await card.findByRole('alert')).toHaveTextContent(/could not be deleted/i)
    await expect(card.getByRole('button', {name: /manage/i})).toBeEnabled()
  },
}

export const DeleteSuccess: Story = {
  args: {port: successfulDeletePort, confirmDelete: fn(() => true)},
  globals: {
    authRole: 'host',
    locale: 'en',
    theme: 'jam-dark',
    viewport: {value: 'desktop', isRotated: false},
  },
  play: async ({canvas}) => {
    const jam = await canvas.findByRole('heading', {level: 3, name: /sunday jam/i})
    const card = cardQueries(jam)
    await userEvent.click(card.getByRole('button', {name: /more jam actions/i}))
    await userEvent.click(card.getByRole('button', {name: /delete/i}))
    const outcome = await canvas.findByRole('status')
    await expect(outcome).toHaveTextContent(/deleted successfully/i)
    await expect(outcome).toHaveTextContent(/sunday jam/i)
  },
}
