import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { CompactStats } from '../../components/dj-control/CompactStats'
import { NowPlayingBar } from '../../components/dj-control/NowPlayingBar'
import { PlaybackControls } from '../../components/dj-control/PlaybackControls'
import { SongQueueTimeline } from '../../components/dj-control/SongQueueTimeline'
import { djSongs, liveStateFixture } from '../djFixtures'

const meta = {
  title: 'Domain/DJ Control/Playback and queue',
  parameters: { a11y: { test: 'todo' } },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {
  render: () => <NowPlayingBar currentSong={null} nextSong={null} playbackState="STOPPED" />,
}

export const Ready: Story = {
  render: () => <NowPlayingBar currentSong={null} nextSong={djSongs.next} playbackState="STOPPED" />,
  globals: { locale: 'en', theme: 'cupcake' },
}

export const PlayingLongContent: Story = {
  render: () => <NowPlayingBar currentSong={djSongs.current} nextSong={djSongs.next} playbackState="PLAYING" />,
  globals: { locale: 'es', theme: 'synthwave', viewport: { value: 'phone', isRotated: false } },
}

export const Paused: Story = {
  render: () => <NowPlayingBar currentSong={djSongs.current} nextSong={djSongs.next} playbackState="PAUSED" />,
  globals: { reducedMotion: true },
}

export const CompletedStatistics: Story = {
  render: () => <CompactStats completedCount={8} totalCount={12} remainingDuration={4287} />,
}

const pause = fn(async () => undefined)
const noop = fn(async () => undefined)
const pendingPause = fn(() => new Promise<void>(() => undefined))

export const PlaybackInteraction: Story = {
  render: () => (
    <PlaybackControls
      playbackState="PLAYING"
      hasCurrentSong
      hasNextSong
      isLoading={false}
      onStart={noop}
      onStop={noop}
      onNext={noop}
      onPrevious={noop}
      onPause={pause}
      onResume={noop}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    const previous = canvas.getByRole('button', { name: /anterior|previous/i })
    const pauseButton = canvas.getByRole('button', { name: /pausar|pause/i })
    const next = canvas.getByRole('button', { name: /próxima|next/i })
    const previousRect = previous.getBoundingClientRect()
    const nextRect = next.getBoundingClientRect()

    await expect(Math.abs(previousRect.width - nextRect.width)).toBeLessThan(1)
    await expect(previousRect.left).toBeGreaterThanOrEqual(previous.parentElement?.getBoundingClientRect().left ?? 0)
    await userEvent.click(pauseButton)
    await expect(pause).toHaveBeenCalledOnce()
  },
}

export const RapidOperationDisabled: Story = {
  render: () => (
    <PlaybackControls
      playbackState="PLAYING"
      hasCurrentSong
      hasNextSong
      isLoading
      onStart={noop}
      onStop={noop}
      onNext={noop}
      onPrevious={noop}
      onPause={noop}
      onResume={noop}
    />
  ),
  play: async ({ canvas }) => {
    for (const button of canvas.getAllByRole('button')) {
      await expect(button).toBeDisabled()
    }
  },
}

export const PendingPlaybackAction: Story = {
  render: () => (
    <PlaybackControls
      playbackState="PLAYING"
      hasCurrentSong
      hasNextSong
      isLoading={false}
      onStart={noop}
      onStop={noop}
      onNext={noop}
      onPrevious={noop}
      onPause={pendingPause}
      onResume={noop}
    />
  ),
  globals: { locale: 'pt', viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /pausar|pause/i }))
    await expect(canvas.getByRole('status')).toHaveTextContent(/atualizando|updating|actualizando/i)
    for (const button of canvas.getAllByRole('button')) {
      await expect(button).toBeDisabled()
    }
  },
}

const failingPause = fn(async () => { throw new Error('Mixer connection lost') })

export const ActionError: Story = {
  render: () => (
    <PlaybackControls
      playbackState="PLAYING"
      hasCurrentSong
      hasNextSong
      isLoading={false}
      onStart={noop}
      onStop={noop}
      onNext={noop}
      onPrevious={noop}
      onPause={failingPause}
      onResume={noop}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /pausar|pause/i }))
    await expect(canvas.getByText('Mixer connection lost')).toBeVisible()
  },
}

const approve = fn()
const remove = fn()

export const QueueTimeline: Story = {
  render: () => (
    <SongQueueTimeline
      liveState={liveStateFixture}
      suggestedSongs={liveStateFixture.suggestedSongs}
      onApproveSong={approve}
      onRemoveSong={remove}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /aprovar|approve/i }))
    await expect(approve).toHaveBeenCalledWith('live-suggested')
    const played = canvas.getByRole('button', { name: /tocadas|played/i })
    await userEvent.click(played)
    await expect(canvas.getAllByText('Psycho Killer')).toHaveLength(2)
  },
  globals: { locale: 'pt', theme: 'jam-dark', viewport: { value: 'desktop', isRotated: false } },
}

export const ReorderedQueue: Story = {
  render: () => (
    <SongQueueTimeline
      liveState={{ ...liveStateFixture, nextSongs: [
        { ...djSongs.next, id: 'reordered-first', order: 1 },
        { ...djSongs.current, id: 'reordered-second', order: 2, status: 'SCHEDULED' },
      ] }}
      loading
    />
  ),
  globals: { reducedMotion: true, viewport: { value: 'phone', isRotated: false } },
}

export const EmptyQueue: Story = {
  render: () => <SongQueueTimeline />,
}
