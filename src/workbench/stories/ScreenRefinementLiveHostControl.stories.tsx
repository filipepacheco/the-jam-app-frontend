import type { Meta, StoryObj } from '@storybook/react-vite'
import { delay, http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { JamManagementPage } from '../../pages/host/JamManagementPage'
import type { JamResponseDto } from '../../types/api.types'
import type { LiveStateResponseDto } from '../../types/jamControl.types'
import { liveStateFixture } from '../djFixtures'
import { jamFixtures } from '../jamMusicFixtures'

const meta = {
  title: 'Human review/Screen refinement/Live host control',
  parameters: {
    a11y: { test: 'error' },
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function managementJam(id: string): JamResponseDto {
  return {
    ...jamFixtures.longContent,
    id,
    name: 'Friday Night Jam — Live host control',
    status: 'LIVE',
  }
}

function renderManagementPage() {
  return (
    <Routes>
      <Route path="/host/jams/:id/manage" element={<JamManagementPage />} />
    </Routes>
  )
}

function liveHostHandlers(
  jamId: string,
  liveState: LiveStateResponseDto,
  reorderFailure?: string,
  refreshFailure?: string,
) {
  let liveStateReads = 0
  return [
    http.get(`*/jams/${jamId}`, () => HttpResponse.json({
      success: true,
      data: managementJam(jamId),
    })),
    http.get(`*/jams/${jamId}/live/state`, () => refreshFailure && liveStateReads++ > 0
      ? HttpResponse.json({success: false, error: refreshFailure})
      : HttpResponse.json({success: true, data: liveState})),
    http.post(`*/jams/${jamId}/control/reorder`, async () => {
      if (reorderFailure) {
        await delay(450)
        return HttpResponse.json({success: false, error: reorderFailure})
      }
      return HttpResponse.json({success: true, data: managementJam(jamId)})
    }),
  ]
}

const readyLiveState: LiveStateResponseDto = {
  ...liveStateFixture,
  previousSongs: [{...liveStateFixture.previousSongs[0], music: {...liveStateFixture.previousSongs[0].music, title: 'Completed Performance'}}],
  suggestedSongs: [],
  nextSongs: [
    liveStateFixture.nextSongs[0],
    {
      ...liveStateFixture.suggestedSongs[0],
      id: 'live-later',
      order: 4,
      status: 'SCHEDULED',
    },
  ],
}

export const ReadyPlaybackAndQueueModes: Story = {
  render: renderManagementPage,
  globals: {
    authRole: 'host',
    locale: 'en',
    route: '/host/jams/jam-live-host-ready/manage',
    theme: 'jam-dark',
    reviewDefaultViewport: 'desktop',
  },
  parameters: {
    a11y: {test: 'error'},
    msw: {handlers: liveHostHandlers('jam-live-host-ready', readyLiveState)},
  },
  play: async ({canvas, userEvent}) => {
    const djTab = await canvas.findByRole('tab', {name: 'Control'})
    await expect(djTab).toHaveAttribute('aria-selected', 'true')
    await expect((await canvas.findAllByText('Psycho Killer')).length).toBeGreaterThan(0)
    await expect((await canvas.findAllByText(/Próxima|Next/)).length).toBeGreaterThan(0)

    await userEvent.click(canvas.getByRole('tab', {name: /Ordem|Order/i}))
    const panel = within(canvas.getByRole('tabpanel'))
    await expect(await panel.findByText('Now Playing')).toBeVisible()
    await expect(panel.getByRole('heading', {name: 'Song order'})).toBeVisible()

    await userEvent.click(panel.getByRole('button', {name: /Reorder/i}))
    await expect(panel.getByRole('heading', {name: 'Song order'})).toBeVisible()
    await expect(panel.getByText('The first unfinished Performance will be Next. Only the playing song has a fixed position.')).toBeVisible()
    const items = panel.getAllByRole('listitem')
    await expect(items[1]).toHaveAttribute('draggable', 'false')
    items[2].focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(panel.getByRole('button', {name: /Save order/i})).toBeVisible()
    await expect(panel.getAllByRole('listitem')[2]).toHaveAccessibleName(/Satisfaction/i)
  },
}

const noCurrentLiveState: LiveStateResponseDto = {
  ...readyLiveState,
  currentSong: null,
  previousSongs: [],
  playbackState: 'STOPPED',
}

export const NoCurrentPerformance: Story = {
  render: renderManagementPage,
  globals: {
    authRole: 'host',
    locale: 'en',
    route: '/host/jams/jam-live-host-no-current/manage',
    theme: 'jam-light',
    reviewDefaultViewport: 'phone',
  },
  parameters: {
    a11y: {test: 'error'},
    msw: {handlers: liveHostHandlers('jam-live-host-no-current', noCurrentLiveState)},
  },
  play: async ({canvas, userEvent}) => {
    await expect((await canvas.findAllByText(/Pronto para iniciar|Ready to start/)).length).toBeGreaterThan(0)
    const startActions = canvas.getAllByRole('button', {name: /Iniciar|Start Jam/i})
    await expect(startActions.some((action) => !action.hasAttribute('disabled'))).toBe(true)

    await userEvent.click(canvas.getByRole('tab', {name: /Ordem|Order/i}))
    const panel = within(canvas.getByRole('tabpanel'))
    await expect(await panel.findByText('No song currently playing')).toBeVisible()
    await expect(panel.getByText('Psycho Killer')).toBeVisible()
  },
}

const reorderFailure = 'The Live Queue could not be saved. The original order was restored.'

export const SaveFailureRollsBack: Story = {
  render: renderManagementPage,
  globals: {
    authRole: 'host',
    locale: 'en',
    route: '/host/jams/jam-live-host-failure/manage',
    theme: 'jam-dark',
    reviewDefaultViewport: 'phone',
  },
  parameters: {
    a11y: {test: 'error'},
    msw: {handlers: liveHostHandlers('jam-live-host-failure', readyLiveState, reorderFailure)},
  },
  play: async ({canvas, userEvent}) => {
    await userEvent.click(await canvas.findByRole('tab', {name: /Ordem|Order/i}))
    const panel = within(canvas.getByRole('tabpanel'))
    await userEvent.click(await panel.findByRole('button', {name: /Reorder/i}))

    const firstItem = panel.getAllByRole('listitem')[2]
    await expect(firstItem).toHaveAccessibleName(/Psycho Killer/i)
    firstItem.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(panel.getAllByRole('listitem')[2]).toHaveAccessibleName(/Satisfaction/i)

    await userEvent.click(panel.getByRole('button', {name: /Save order/i}))
    await expect(await panel.findByText('Saving order…')).toBeVisible()
    await expect(await canvas.findByText(reorderFailure)).toBeVisible()
    await expect(panel.getAllByRole('listitem')[2]).toHaveAccessibleName(/Psycho Killer/i)
  },
}

export const RefreshFailureKeepsQueueContext: Story = {
  render: renderManagementPage,
  globals: {
    authRole: 'host',
    locale: 'en',
    route: '/host/jams/jam-live-host-refresh-failure/manage',
    theme: 'jam-light',
    reviewDefaultViewport: 'phone',
  },
  parameters: {
    a11y: {test: 'error'},
    msw: {handlers: liveHostHandlers(
      'jam-live-host-refresh-failure',
      readyLiveState,
      undefined,
      'The refreshed Jam could not be loaded.',
    )},
  },
  play: async ({canvas, userEvent}) => {
    await userEvent.click(await canvas.findByRole('tab', {name: /Ordem|Order/i}))
    const panel = within(canvas.getByRole('tabpanel'))
    await userEvent.click(await panel.findByRole('button', {name: /Reorder/i}))
    const firstItem = panel.getAllByRole('listitem')[2]
    firstItem.focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(panel.getByRole('button', {name: /Save order/i}))
    await expect(await canvas.findByText('The refreshed Jam could not be loaded.')).toBeVisible()
    await expect(panel.getAllByRole('listitem')[0]).toBeVisible()
  },
}


export const PausedScheduleIsMovable: Story = {
  render: renderManagementPage,
  globals: {
    authRole: 'host', locale: 'pt-BR', theme: 'jam-light', reducedMotion: true,
    route: '/host/jams/jam-paused-reorder/manage', reviewDefaultViewport: 'phone',
  },
  parameters: {
    a11y: {test: 'error'},
    msw: {handlers: liveHostHandlers('jam-paused-reorder', {...readyLiveState, playbackState: 'PAUSED'})},
  },
  play: async ({canvas, userEvent}) => {
    await userEvent.click(await canvas.findByRole('tab', {name: /Ordem/i}))
    const panel = within(canvas.getByRole('tabpanel'))
    await userEvent.click(await panel.findByRole('button', {name: 'Reordenar'}))
    const before = panel.getAllByRole('listitem')
    await expect(before[0]).toHaveTextContent('Concluída')
    await expect(before[1]).toHaveTextContent('Pausada')
    await expect(before[1]).toHaveAttribute('draggable', 'true')
    before[1].focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(panel.getAllByRole('listitem')[2]).toHaveTextContent('Pausada')
    await expect(panel.getAllByRole('listitem')[0]).toHaveTextContent('Concluída')
    await expect(panel.getAllByRole('listitem')[1]).toHaveTextContent('Próxima')
  },
}
