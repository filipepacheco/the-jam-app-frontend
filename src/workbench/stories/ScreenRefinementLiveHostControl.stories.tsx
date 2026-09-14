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
  title: 'Pages/Screen refinement/Live host control',
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
) {
  return [
    http.get(`*/jams/${jamId}`, () => HttpResponse.json({
      success: true,
      data: managementJam(jamId),
    })),
    http.get(`*/jams/${jamId}/live/state`, () => HttpResponse.json({
      success: true,
      data: liveState,
    })),
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
    viewport: { value: 'desktop', isRotated: false },
  },
  parameters: {
    a11y: {test: 'error'},
    msw: {handlers: liveHostHandlers('jam-live-host-ready', readyLiveState)},
  },
  play: async ({canvas, userEvent}) => {
    const djTab = await canvas.findByRole('tab', {name: /DJ Control/i})
    await expect(djTab).toHaveAttribute('aria-selected', 'true')
    await expect(await canvas.findByRole('button', {name: /Pause/i})).toBeEnabled()
    await expect(canvas.getAllByText('Psycho Killer')[0]).toBeVisible()

    await userEvent.click(canvas.getByRole('tab', {name: /Ordem|Reorder/i}))
    const panel = within(canvas.getByRole('tabpanel'))
    await expect(await panel.findByText('Now Playing')).toBeVisible()
    await expect(panel.getByRole('heading', {name: 'Up Next'})).toBeVisible()

    await userEvent.click(panel.getByRole('button', {name: /Reorder/i}))
    await expect(panel.getByRole('heading', {name: 'Up Next (Reorderable)'})).toBeVisible()
    const items = panel.getAllByRole('listitem')
    items[0].focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(panel.getByRole('button', {name: /Save order/i})).toBeVisible()
    await expect(panel.getAllByRole('listitem')[0]).toHaveAccessibleName(/Satisfaction/i)
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
    viewport: { value: 'phone', isRotated: false },
  },
  parameters: {
    a11y: {test: 'error'},
    msw: {handlers: liveHostHandlers('jam-live-host-no-current', noCurrentLiveState)},
  },
  play: async ({canvas, userEvent}) => {
    await expect(await canvas.findByText('Ready to start')).toBeVisible()
    await expect(canvas.getByRole('button', {name: /Start Jam/i})).toBeEnabled()

    await userEvent.click(canvas.getByRole('tab', {name: /Ordem|Reorder/i}))
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
    viewport: { value: 'phone', isRotated: false },
  },
  parameters: {
    a11y: {test: 'error'},
    msw: {handlers: liveHostHandlers('jam-live-host-failure', readyLiveState, reorderFailure)},
  },
  play: async ({canvas, userEvent}) => {
    await userEvent.click(await canvas.findByRole('tab', {name: /Ordem|Reorder/i}))
    const panel = within(canvas.getByRole('tabpanel'))
    await userEvent.click(await panel.findByRole('button', {name: /Reorder/i}))

    const firstItem = panel.getAllByRole('listitem')[0]
    await expect(firstItem).toHaveAccessibleName(/Psycho Killer/i)
    firstItem.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(panel.getAllByRole('listitem')[0]).toHaveAccessibleName(/Satisfaction/i)

    await userEvent.click(panel.getByRole('button', {name: /Save order/i}))
    await expect(await panel.findByText('Saving order…')).toBeVisible()
    await expect(await canvas.findByText(reorderFailure)).toBeVisible()
    await expect(panel.getAllByRole('listitem')[0]).toHaveAccessibleName(/Psycho Killer/i)
  },
}
