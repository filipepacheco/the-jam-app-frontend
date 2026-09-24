import {describe, expect, it, vi} from 'vitest'
import {
  createLiveQueueController,
  orderedPerformances,
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

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((nextResolve) => { resolve = nextResolve })
  return {promise, resolve}
}

describe('Live Queue controller', () => {
  it.each(['mouse', 'touch', 'keyboard'] as const)(
    'uses the same move intent model for %s input',
    (mode) => {
      const controller = createLiveQueueController({initialSnapshot: snapshot(['a', 'b', 'c'])})
      controller.commands.beginReorder()

      controller.commands.beginMove({mode, performanceId: 'b'})
      controller.commands.updateMoveTarget(0)
      controller.commands.commitMove()

      expect(controller.getSnapshot().draftPerformances.map(({id}) => id)).toEqual(['b', 'a', 'c'])
      expect(controller.getSnapshot().input).toEqual({mode: 'idle'})
    },
  )

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
      startingFingerprint: expect.any(String),
      latestFingerprint: expect.any(String),
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
      expectedRevision: undefined,
      performances: expect.arrayContaining([
        expect.objectContaining({id: 'c', order: 3}),
        expect.objectContaining({id: 'a', order: 4}),
        expect.objectContaining({id: 'b', order: 5}),
      ]),
    }, expect.any(AbortSignal))
    expect(operations.refresh).toHaveBeenCalledWith('jam-1', expect.any(AbortSignal))
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
      startingFingerprint: expect.any(String),
      latestFingerprint: expect.any(String),
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

  it('aborts and invalidates in-flight persistence when the controller is disposed', async () => {
    const scheduled = manualTimer()
    const remote = deferred<{ok: true}>()
    let signal: AbortSignal | undefined
    const operations: LiveQueueOperationsPort = {
      reorder: vi.fn().mockImplementation((_input, nextSignal) => {
        signal = nextSignal
        return remote.promise
      }),
      refresh: vi.fn(),
    }
    const controller = createLiveQueueController({
      initialSnapshot: snapshot(['a', 'b']), operations, timer: scheduled.timer,
    })
    controller.commands.beginReorder()
    controller.commands.movePerformance('b', 0)
    const save = controller.commands.saveReorder()
    scheduled.flush()

    expect(controller.getSnapshot().persistence).toEqual({status: 'saving'})
    controller.dispose()

    await expect(save).resolves.toEqual({code: 'cancelled', operation: 'save_reorder'})
    expect(signal?.aborted).toBe(true)
    remote.resolve({ok: true})
    await Promise.resolve()
    expect(operations.refresh).not.toHaveBeenCalled()
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


describe('saved Schedule positions and playback', () => {
  function fullSnapshot(playbackState: LiveQueueSnapshot['playbackState']): LiveQueueSnapshot {
    const performances = snapshot(['done', 'current', 'next', 'later']).upcomingPerformances.map((performance, index) => ({
      ...performance, order: [1, 4, 7, 10][index],
      status: index === 0 ? 'COMPLETED' as const : index === 1 ? 'IN_PROGRESS' as const : 'SCHEDULED' as const,
    }))
    return {...snapshot([]), playbackState, queueRevision: 'revision-1', currentPerformance: performances[1],
      previousPerformances: [performances[0]], upcomingPerformances: performances.slice(2)}
  }

  it('shows a paused Performance at its saved position and permits moving it and completed Performances', () => {
    const controller = createLiveQueueController({initialSnapshot: fullSnapshot('PAUSED')})
    expect(controller.getSnapshot().draftPerformances.map(({id}) => id)).toEqual(['done', 'current', 'next', 'later'])
    controller.commands.beginReorder()
    controller.commands.movePerformance('current', 3)
    controller.commands.movePerformance('done', 2)
    expect(controller.getSnapshot().draftPerformances.map(({id, order, status}) => [id, order, status])).toEqual([
      ['next', 1, 'SCHEDULED'], ['later', 4, 'SCHEDULED'], ['done', 7, 'COMPLETED'], ['current', 10, 'IN_PROGRESS'],
    ])
  })

  it('keeps the actively playing position fixed when moves cross it in either direction', () => {
    const controller = createLiveQueueController({initialSnapshot: fullSnapshot('PLAYING')})
    controller.commands.beginReorder()
    controller.commands.movePerformance('current', 0)
    controller.commands.movePerformance('next', 1)
    expect(controller.getSnapshot().draftPerformances.map(({id, order}) => [id, order])).toEqual([
      ['next', 1], ['current', 4], ['done', 7], ['later', 10],
    ])
    controller.commands.movePerformance('next', 1)
    expect(controller.getSnapshot().draftPerformances.map(({id}) => id)).toEqual(['done', 'current', 'next', 'later'])
  })

  it('makes legacy stuck IN_PROGRESS entries movable while stopped', () => {
    const controller = createLiveQueueController({initialSnapshot: fullSnapshot('STOPPED')})
    controller.commands.beginReorder()
    controller.commands.movePerformance('current', 0)
    expect(controller.getSnapshot().draftPerformances[0].id).toBe('current')
  })

  it('saves the full Schedule and revision, and retains the authoritative order after reload', async () => {
    const initialSnapshot = fullSnapshot('PAUSED')
    const timer = manualTimer()
    let saved = initialSnapshot
    const operations: LiveQueueOperationsPort = {
      reorder: vi.fn(async ({performances, expectedRevision}) => {
        expect(expectedRevision).toBe('revision-1')
        saved = {...initialSnapshot, allPerformances: performances, queueRevision: 'revision-2', resumeFromQueue: true}
        return {ok: true}
      }),
      refresh: vi.fn(async () => ({ok: true, snapshot: saved})),
    }
    const controller = createLiveQueueController({initialSnapshot, operations, timer: timer.timer})
    controller.commands.beginReorder()
    controller.commands.movePerformance('later', 0)
    const save = controller.commands.saveReorder()
    timer.flush()
    await expect(save).resolves.toMatchObject({code: 'success'})
    const reloaded = createLiveQueueController({initialSnapshot: saved})
    expect(reloaded.getSnapshot().draftPerformances.map(({id}) => id)).toEqual(['later', 'done', 'current', 'next'])
    expect(orderedPerformances(saved).find(({id}) => id === 'done')?.status).toBe('COMPLETED')
  })

  it('rejects a save if another host resumes playback without changing the order', async () => {
    const initialSnapshot = fullSnapshot('PAUSED')
    const operations: LiveQueueOperationsPort = {reorder: vi.fn(), refresh: vi.fn()}
    const controller = createLiveQueueController({initialSnapshot, operations})
    controller.commands.beginReorder()
    controller.commands.movePerformance('current', 0)
    controller.commands.replaceServerSnapshot({...initialSnapshot, playbackState: 'PLAYING'})
    await expect(controller.commands.saveReorder()).resolves.toMatchObject({code: 'conflict'})
    expect(operations.reorder).not.toHaveBeenCalled()
  })

  it('reports a server race as a conflict instead of success or a generic failure', async () => {
    const timer = manualTimer()
    const operations: LiveQueueOperationsPort = {
      reorder: vi.fn(async () => ({ok: false, error: {status: 409, message: 'changed'}})), refresh: vi.fn(),
    }
    const controller = createLiveQueueController({initialSnapshot: fullSnapshot('PAUSED'), operations, timer: timer.timer})
    controller.commands.beginReorder()
    const save = controller.commands.saveReorder()
    timer.flush()
    await expect(save).resolves.toMatchObject({code: 'conflict'})
  })
})
