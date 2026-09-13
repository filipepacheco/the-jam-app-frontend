import {describe, expect, it, vi} from 'vitest'
import {
  createLiveQueueController,
  type LiveQueueOperationsPort,
  type LiveQueueSnapshot,
  type LiveQueueTimerPort,
} from '../lib/live-queue/liveQueueController'

function snapshot(ids: readonly string[]): LiveQueueSnapshot {
  return {
    jamId: 'jam-1',
    currentPerformance: null,
    upcomingPerformances: ids.map((id, index) => ({
      id,
      order: index + 3,
      status: 'SCHEDULED',
      music: {title: `Music ${id}`, artist: `Artist ${id}`},
      musicians: [],
    })),
    previousPerformances: [],
    suggestedPerformances: [],
    jamStatus: 'ACTIVE',
    playbackState: 'PLAYING',
  }
}

function manualTimer() {
  let pending: (() => void) | undefined
  let delay: number | undefined
  const timer: LiveQueueTimerPort = {
    schedule(nextDelay, callback) {
      delay = nextDelay
      pending = callback
      return () => { pending = undefined }
    },
  }
  return {
    timer,
    get delay() { return delay },
    get hasPending() { return pending !== undefined },
    flush() {
      const callback = pending
      pending = undefined
      callback?.()
    },
  }
}

describe('Live Queue controller', () => {
  it('keeps an active reorder draft when a poll replaces canonical server state', () => {
    const controller = createLiveQueueController({initialSnapshot: snapshot(['a', 'b', 'c'])})

    controller.commands.beginReorder()
    controller.commands.movePerformance('c', 0)
    controller.commands.replaceServerSnapshot(snapshot(['a', 'c', 'b']))

    expect(controller.getSnapshot().server.upcomingPerformances.map(({id}) => id)).toEqual(['a', 'c', 'b'])
    expect(controller.getSnapshot().draftPerformances.map(({id}) => id)).toEqual(['c', 'a', 'b'])
    expect(controller.getSnapshot().session).toMatchObject({status: 'editing'})
    expect(controller.getSnapshot().conflict).toMatchObject({status: 'detected'})
  })

  it('rejects a stale save without calling persistence', async () => {
    const operations: LiveQueueOperationsPort = {
      reorder: vi.fn().mockResolvedValue({ok: true}),
      refresh: vi.fn().mockResolvedValue({ok: true, snapshot: snapshot(['a', 'c', 'b'])}),
    }
    const controller = createLiveQueueController({
      initialSnapshot: snapshot(['a', 'b', 'c']),
      operations,
    })

    controller.commands.beginReorder()
    controller.commands.movePerformance('c', 0)
    controller.commands.replaceServerSnapshot(snapshot(['a', 'c', 'b']))

    await expect(controller.commands.saveReorder()).resolves.toEqual({
      code: 'conflict',
      operation: 'save_reorder',
      startingFingerprint: '["a","b","c"]',
      latestFingerprint: '["a","c","b"]',
    })
    expect(operations.reorder).not.toHaveBeenCalled()
    expect(controller.getSnapshot().session.status).toBe('editing')
  })

  it('debounces persistence and restores the starting server snapshot after a resolved failure', async () => {
    const scheduled = manualTimer()
    const operations: LiveQueueOperationsPort = {
      reorder: vi.fn().mockResolvedValue({ok: false, error: {message: 'reorder rejected'}}),
      refresh: vi.fn(),
    }
    const starting = snapshot(['a', 'b', 'c'])
    const controller = createLiveQueueController({initialSnapshot: starting, operations, timer: scheduled.timer})
    controller.commands.beginReorder()
    controller.commands.movePerformance('c', 0)

    const save = controller.commands.saveReorder()

    expect(scheduled.delay).toBe(300)
    expect(controller.getSnapshot().persistence.status).toBe('debouncing')
    expect(operations.reorder).not.toHaveBeenCalled()
    scheduled.flush()

    await expect(save).resolves.toEqual({
      code: 'failure',
      operation: 'save_reorder',
      failure: 'resolved',
      error: {message: 'reorder rejected'},
    })
    expect(controller.getSnapshot().server).toEqual(starting)
    expect(controller.getSnapshot().draftPerformances.map(({id}) => id)).toEqual(['a', 'b', 'c'])
    expect(controller.getSnapshot().session).toEqual({status: 'idle'})
    expect(controller.getSnapshot().persistence).toEqual({status: 'idle'})
    expect(operations.refresh).not.toHaveBeenCalled()
  })

  it('reconciles a successful save to the authoritative refreshed server order', async () => {
    const scheduled = manualTimer()
    const authoritative = snapshot(['c', 'b', 'a'])
    const operations: LiveQueueOperationsPort = {
      reorder: vi.fn().mockResolvedValue({ok: true}),
      refresh: vi.fn().mockResolvedValue({ok: true, snapshot: authoritative}),
    }
    const controller = createLiveQueueController({
      initialSnapshot: snapshot(['a', 'b', 'c']),
      operations,
      timer: scheduled.timer,
    })
    controller.commands.beginReorder()
    controller.commands.movePerformance('c', 0)

    const save = controller.commands.saveReorder()
    scheduled.flush()

    await expect(save).resolves.toEqual({code: 'success', operation: 'save_reorder'})
    expect(operations.reorder).toHaveBeenCalledWith({
      jamId: 'jam-1',
      performances: expect.arrayContaining([
        expect.objectContaining({id: 'c', order: 3}),
        expect.objectContaining({id: 'a', order: 4}),
        expect.objectContaining({id: 'b', order: 5}),
      ]),
    })
    expect(operations.refresh).toHaveBeenCalledWith('jam-1')
    expect(controller.getSnapshot().server).toEqual(authoritative)
    expect(controller.getSnapshot().draftPerformances.map(({id}) => id)).toEqual(['c', 'b', 'a'])
    expect(controller.getSnapshot().session).toEqual({status: 'idle'})
  })

  it('rechecks the fingerprint after debounce so a late poll cannot slip through persistence', async () => {
    const scheduled = manualTimer()
    const operations: LiveQueueOperationsPort = {
      reorder: vi.fn().mockResolvedValue({ok: true}),
      refresh: vi.fn(),
    }
    const controller = createLiveQueueController({
      initialSnapshot: snapshot(['a', 'b', 'c']),
      operations,
      timer: scheduled.timer,
    })
    controller.commands.beginReorder()
    controller.commands.movePerformance('c', 0)

    const save = controller.commands.saveReorder()
    controller.commands.replaceServerSnapshot(snapshot(['b', 'a', 'c']))
    scheduled.flush()

    await expect(save).resolves.toMatchObject({
      code: 'conflict',
      startingFingerprint: '["a","b","c"]',
      latestFingerprint: '["b","a","c"]',
    })
    expect(operations.reorder).not.toHaveBeenCalled()
    expect(controller.getSnapshot().persistence).toEqual({status: 'idle'})
  })

  it('keeps the saved draft visible and reports a refresh failure after persistence succeeds', async () => {
    const scheduled = manualTimer()
    const operations: LiveQueueOperationsPort = {
      reorder: vi.fn().mockResolvedValue({ok: true}),
      refresh: vi.fn().mockResolvedValue({ok: false, error: {message: 'poll failed'}}),
    }
    const controller = createLiveQueueController({
      initialSnapshot: snapshot(['a', 'b', 'c']),
      operations,
      timer: scheduled.timer,
    })
    controller.commands.beginReorder()
    controller.commands.movePerformance('c', 0)

    const save = controller.commands.saveReorder()
    scheduled.flush()

    await expect(save).resolves.toEqual({
      code: 'refresh_failure',
      operation: 'save_reorder',
      error: {message: 'poll failed'},
    })
    expect(controller.getSnapshot().draftPerformances.map(({id}) => id)).toEqual(['c', 'a', 'b'])
    expect(controller.getSnapshot().server.upcomingPerformances.map(({id}) => id)).toEqual(['a', 'b', 'c'])
    expect(controller.getSnapshot().session).toEqual({status: 'idle'})
  })

  it('cancels a draft back to the latest canonical poll', () => {
    const controller = createLiveQueueController({initialSnapshot: snapshot(['a', 'b', 'c'])})
    controller.commands.beginReorder()
    controller.commands.movePerformance('c', 0)
    controller.commands.replaceServerSnapshot(snapshot(['b', 'a', 'c']))

    expect(controller.commands.cancelReorder()).toEqual({code: 'cancelled', operation: 'reorder_session'})
    expect(controller.getSnapshot().draftPerformances.map(({id}) => id)).toEqual(['b', 'a', 'c'])
    expect(controller.getSnapshot().session).toEqual({status: 'idle'})
    expect(controller.getSnapshot().conflict).toBeNull()
  })

  it('rejects a duplicate save while persistence is pending', async () => {
    const scheduled = manualTimer()
    const operations: LiveQueueOperationsPort = {
      reorder: vi.fn().mockResolvedValue({ok: true}),
      refresh: vi.fn().mockResolvedValue({ok: true, snapshot: snapshot(['c', 'a', 'b'])}),
    }
    const controller = createLiveQueueController({
      initialSnapshot: snapshot(['a', 'b', 'c']), operations, timer: scheduled.timer,
    })
    controller.commands.beginReorder()
    controller.commands.movePerformance('c', 0)

    const firstSave = controller.commands.saveReorder()
    await expect(controller.commands.saveReorder()).resolves.toEqual({
      code: 'duplicate_pending', operation: 'save_reorder',
    })
    scheduled.flush()
    await expect(firstSave).resolves.toEqual({code: 'success', operation: 'save_reorder'})
    expect(operations.reorder).toHaveBeenCalledTimes(1)
  })

  it('cancels a debounced save when the controller is disposed', async () => {
    const scheduled = manualTimer()
    const operations: LiveQueueOperationsPort = {
      reorder: vi.fn(),
      refresh: vi.fn(),
    }
    const controller = createLiveQueueController({
      initialSnapshot: snapshot(['a', 'b']), operations, timer: scheduled.timer,
    })
    controller.commands.beginReorder()
    controller.commands.movePerformance('b', 0)
    const save = controller.commands.saveReorder()

    controller.dispose()

    await expect(save).resolves.toEqual({code: 'cancelled', operation: 'save_reorder'})
    expect(scheduled.hasPending).toBe(false)
    expect(operations.reorder).not.toHaveBeenCalled()
  })

  it('normalizes a thrown persistence failure and restores the starting snapshot', async () => {
    const scheduled = manualTimer()
    const starting = snapshot(['a', 'b'])
    const operations: LiveQueueOperationsPort = {
      reorder: vi.fn().mockRejectedValue(new Error('network down')),
      refresh: vi.fn(),
    }
    const controller = createLiveQueueController({initialSnapshot: starting, operations, timer: scheduled.timer})
    controller.commands.beginReorder()
    controller.commands.movePerformance('b', 0)
    const save = controller.commands.saveReorder()
    scheduled.flush()

    await expect(save).resolves.toEqual({
      code: 'failure', operation: 'save_reorder', failure: 'thrown', error: {message: 'network down'},
    })
    expect(controller.getSnapshot().server).toEqual(starting)
    expect(controller.getSnapshot().draftPerformances.map(({id}) => id)).toEqual(['a', 'b'])
  })
})
