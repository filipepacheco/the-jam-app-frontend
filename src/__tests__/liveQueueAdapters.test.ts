import {describe, expect, it, vi} from 'vitest'
import {
  createLiveQueueOperationsAdapter,
  mapLiveStateToLiveQueueSnapshot,
  type LiveQueueTransport,
} from '../lib/live-queue/liveQueueAdapters'
import type {LiveStateResponseDto} from '../types/jamControl.types'

function liveState(ids: readonly string[]): LiveStateResponseDto {
  const performances = ids.map((id, index) => ({
    id,
    order: index + 4,
    status: 'SCHEDULED' as const,
    music: {title: `Music ${id}`, artist: `Artist ${id}`},
    musicians: [{id: `musician-${id}`, name: `Musician ${id}`, instrument: 'guitars'}],
  }))
  return {
    currentSong: null,
    nextSongs: performances,
    previousSongs: [],
    suggestedSongs: [],
    jamStatus: 'ACTIVE',
    playbackState: 'PLAYING',
  }
}

describe('Live Queue adapters', () => {
  it('maps legacy live-state songs to Performance language and persists explicit order updates', async () => {
    const state = liveState(['a', 'b'])
    const transport: LiveQueueTransport = {
      getLiveState: vi.fn().mockResolvedValue({data: state, status: 200}),
      reorderQueue: vi.fn().mockResolvedValue({success: true}),
    }
    const operations = createLiveQueueOperationsAdapter(transport)
    const snapshot = mapLiveStateToLiveQueueSnapshot('jam-1', state)

    await expect(operations.reorder({jamId: 'jam-1', performances: snapshot.upcomingPerformances}))
      .resolves.toEqual({ok: true})
    expect(transport.reorderQueue).toHaveBeenCalledWith('jam-1', [
      {scheduleId: 'a', order: 4},
      {scheduleId: 'b', order: 5},
    ], undefined)
    await expect(operations.refresh('jam-1')).resolves.toEqual({ok: true, snapshot})
  })

  it('normalizes resolved transport failures and thrown refresh failures', async () => {
    const transport: LiveQueueTransport = {
      getLiveState: vi.fn().mockRejectedValue(new Error('offline')),
      reorderQueue: vi.fn().mockResolvedValue({
        success: false,
        error: {message: 'reorder rejected', code: 'REORDER_FAILED', status: 409},
      }),
    }
    const operations = createLiveQueueOperationsAdapter(transport)

    await expect(operations.reorder({jamId: 'jam-1', performances: []})).resolves.toEqual({
      ok: false, error: {message: 'reorder rejected'},
    })
    await expect(operations.refresh('jam-1')).resolves.toEqual({
      ok: false, error: {message: 'offline'},
    })
  })
})
