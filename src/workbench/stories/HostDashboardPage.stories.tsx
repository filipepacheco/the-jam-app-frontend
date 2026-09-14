import type {Meta, StoryObj} from '@storybook/react-vite'
import {expect, fn} from 'storybook/test'
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

const meta = {
  title: 'Pages/Screen refinement/Host dashboard',
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
