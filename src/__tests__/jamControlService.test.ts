import {describe, expect, it, vi, afterEach} from 'vitest'
import {apiClient} from '../lib/api'
import {createLiveQueueOperationsAdapter} from '../lib/live-queue/liveQueueAdapters'
import {jamControlService} from '../services/jamControlService'

afterEach(() => vi.restoreAllMocks())

describe('queue reorder HTTP contract', () => {
  it('sends the server revision with explicit positions', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({success: true, data: true})
    await jamControlService.reorderQueue('jam', [{scheduleId: 'paused', order: 7}], undefined, 'revision')
    expect(post).toHaveBeenCalledWith('/jams/jam/control/reorder', {
      updates: [{scheduleId: 'paused', order: 7}], expectedRevision: 'revision',
    }, {signal: undefined})
  })

  it('preserves a real ApiClient 409 rejection through the workflow adapter', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue({message: 'Schedule changed', statusCode: 409, error: 'Conflict'})
    await expect(createLiveQueueOperationsAdapter().reorder({jamId: 'jam', performances: [], expectedRevision: 'old'}))
      .resolves.toEqual({ok: false, error: {message: 'Schedule changed', status: 409}})
  })
})
