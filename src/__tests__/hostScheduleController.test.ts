import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  createHostScheduleController,
  type HostScheduleOperationsPort,
  type HostScheduleSnapshot,
  type MusicCataloguePort,
  type ScheduleTimerPort,
} from '../lib/schedule/hostScheduleController'

const catalogue: MusicCataloguePort = {
  listApproved: vi.fn().mockResolvedValue({items: [], hasMore: false}),
}

function successfulOperations(
  refreshed: HostScheduleSnapshot = snapshot(),
): HostScheduleOperationsPort {
  return {
    updateNotes: vi.fn().mockResolvedValue({ok: true}),
    updatePerformance: vi.fn().mockResolvedValue({ok: true}),
    createPerformance: vi.fn().mockResolvedValue({ok: true}),
    removePerformance: vi.fn().mockResolvedValue({ok: true}),
    updateRegistration: vi.fn().mockResolvedValue({ok: true}),
    removeRegistration: vi.fn().mockResolvedValue({ok: true}),
    refresh: vi.fn().mockResolvedValue({ok: true, snapshot: refreshed}),
  }
}

afterEach(() => {
  vi.useRealTimers()
})

function snapshot(): HostScheduleSnapshot {
  return {
    jamId: 'jam-1',
    performances: [
      {
        id: 'suggestion',
        jamId: 'jam-1',
        musicId: 'music-3',
        order: 3,
        status: 'SUGGESTED',
        createdAt: '2026-09-24T18:00:00.000Z',
        music: {id: 'music-3', title: 'Creep', artist: 'Radiohead', createdAt: '2026-09-24T18:00:00.000Z'},
        registrations: [{id: 'vocal', musicianId: 'm-vocal', jamId: 'jam-1', instrument: 'vocals', musician: {id: 'm-vocal', name: 'Thom Yorke', isHost: false, createdAt: '2026-09-24T18:00:00.000Z'}}],
      },
      {
        id: 'scheduled',
        jamId: 'jam-1',
        musicId: 'music-2',
        order: 2,
        status: 'SCHEDULED',
        createdAt: '2026-09-24T18:00:00.000Z',
        music: {id: 'music-2', title: 'Psycho Killer', artist: 'Talking Heads', createdAt: '2026-09-24T18:00:00.000Z'},
        registrations: [{id: 'guitar', musicianId: 'm-guitar', jamId: 'jam-1', instrument: 'guitars', musician: {id: 'm-guitar', name: 'David Byrne', isHost: false, createdAt: '2026-09-24T18:00:00.000Z'}}],
      },
      {
        id: 'completed',
        jamId: 'jam-1',
        musicId: 'music-1',
        order: 1,
        status: 'COMPLETED',
        createdAt: '2026-09-24T18:00:00.000Z',
        music: {id: 'music-1', title: 'Dreams', artist: 'Fleetwood Mac', createdAt: '2026-09-24T18:00:00.000Z'},
        registrations: [
          {id: 'drums', musicianId: 'm-drums', jamId: 'jam-1', instrument: 'drums'},
          {id: 'guitars', musicianId: 'm-guitars', jamId: 'jam-1', instrument: 'guitars'},
          {id: 'bass', musicianId: 'm-bass', jamId: 'jam-1', instrument: 'bass'},
          {id: 'vocals', musicianId: 'm-vocals', jamId: 'jam-1', instrument: 'vocals'},
        ],
      },
    ],
  }
}

function manualTimer() {
  let pending: (() => void) | undefined
  let delay: number | undefined
  const timer: ScheduleTimerPort = {
    schedule(nextDelay, callback) {
      delay = nextDelay
      pending = callback
      return () => { pending = undefined }
    },
  }
  return {
    timer,
    get delay() { return delay },
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

describe('Host Schedule controller', () => {
  it('projects Performances in order and separates Suggestions from the active Schedule', () => {
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue})

    expect(controller.getSnapshot().performances.map(({id}) => id)).toEqual([
      'completed',
      'scheduled',
      'suggestion',
    ])
    expect(controller.getSnapshot().activePerformances.map(({id}) => id)).toEqual([
      'completed',
      'scheduled',
    ])
    expect(controller.getSnapshot().suggestedPerformances.map(({id}) => id)).toEqual([
      'suggestion',
    ])
  })

  it('debounces search while keeping completeness counts independent from the selected filter', () => {
    const scheduled = manualTimer()
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue, timer: scheduled.timer})

    controller.commands.setFilter('complete')
    expect(controller.getSnapshot().filteredActivePerformances.map(({id}) => id)).toEqual(['completed'])
    expect(controller.getSnapshot().filteredSuggestedPerformances.map(({id}) => id)).toEqual(['suggestion'])
    expect(controller.getSnapshot().counts).toEqual({total: 3, needsMusicians: 1, complete: 1})

    controller.commands.setSearch('radio')
    expect(controller.getSnapshot().appliedSearch).toBe('')
    expect(scheduled.delay).toBe(200)
    scheduled.flush()

    expect(controller.getSnapshot().appliedSearch).toBe('radio')
    expect(controller.getSnapshot().filteredActivePerformances).toEqual([])
    expect(controller.getSnapshot().filteredSuggestedPerformances.map(({id}) => id)).toEqual(['suggestion'])
    expect(controller.getSnapshot().counts).toEqual({total: 1, needsMusicians: 0, complete: 0})
  })

  it('loads every approved Music page and exposes only Music not already in the Schedule', async () => {
    const listApproved = vi.fn()
      .mockResolvedValueOnce({
        items: [
          {id: 'music-1', title: 'Dreams', artist: 'Fleetwood Mac', createdAt: '2026-09-24T18:00:00.000Z'},
          {id: 'music-4', title: 'Maps', artist: 'Yeah Yeah Yeahs', createdAt: '2026-09-24T18:00:00.000Z'},
        ],
        hasMore: true,
      })
      .mockResolvedValueOnce({
        items: [{id: 'music-5', title: 'Heroes', artist: 'David Bowie', createdAt: '2026-09-24T18:00:00.000Z'}],
        hasMore: false,
      })
    const controller = createHostScheduleController({
      initialSnapshot: snapshot(),
      catalogue: {listApproved},
    })

    const outcome = await controller.commands.loadMusicCatalogue()

    expect(listApproved).toHaveBeenNthCalledWith(1, {skip: 0, take: 100})
    expect(listApproved).toHaveBeenNthCalledWith(2, {skip: 100, take: 100})
    expect(outcome).toEqual({code: 'success', operation: 'load_music_catalogue'})
    expect(controller.getSnapshot().catalogue.status).toBe('ready')
    expect(controller.getSnapshot().availableMusic.map(({id}) => id)).toEqual(['music-4', 'music-5'])
  })

  it('returns a semantic failure and exposes failed catalogue query state', async () => {
    const controller = createHostScheduleController({
      initialSnapshot: snapshot(),
      catalogue: {listApproved: vi.fn().mockRejectedValue(new Error('offline'))},
    })

    await expect(controller.commands.loadMusicCatalogue()).resolves.toEqual({
      code: 'failure',
      operation: 'load_music_catalogue',
      error: {message: 'offline'},
    })
    expect(controller.getSnapshot().catalogue).toEqual({
      status: 'failed',
      items: [],
      error: {message: 'offline'},
    })
  })

  it('reprojects authoritative Jam input and notifies active subscribers', () => {
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue})
    const listener = vi.fn()
    const unsubscribe = controller.subscribe(listener)
    const original = snapshot()
    const updated = {
      ...original,
      performances: original.performances.filter(({id}) => id !== 'scheduled'),
    }

    controller.commands.replaceSnapshot(updated)

    expect(controller.getSnapshot().performances.map(({id}) => id)).toEqual(['completed', 'suggestion'])
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    controller.commands.setFilter('needs_musicians')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('cancels pending debounce work when disposed', () => {
    vi.useFakeTimers()
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue})
    const listener = vi.fn()
    controller.subscribe(listener)

    controller.commands.setSearch('dreams')
    expect(listener).toHaveBeenCalledTimes(1)
    controller.dispose()
    vi.advanceTimersByTime(200)

    expect(controller.getSnapshot().appliedSearch).toBe('')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('clears raw and applied search immediately', () => {
    vi.useFakeTimers()
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue})
    controller.commands.setSearch('radio')
    vi.advanceTimersByTime(200)
    expect(controller.getSnapshot().appliedSearch).toBe('radio')

    controller.commands.clearSearch()

    expect(controller.getSnapshot().rawSearch).toBe('')
    expect(controller.getSnapshot().appliedSearch).toBe('')
    expect(controller.getSnapshot().counts.total).toBe(3)
  })

  it('adds newly created Music to the current catalogue projection', () => {
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue})
    const music = {id: 'music-new', title: 'One More Time', artist: 'Daft Punk', createdAt: '2026-09-24T18:00:00.000Z'}

    controller.commands.addCatalogueMusic(music)

    expect(controller.getSnapshot().catalogue.items).toEqual([music])
    expect(controller.getSnapshot().availableMusic).toEqual([music])
  })

  it('ignores a catalogue response after the caller cancels its lifecycle', async () => {
    let resolvePage: ((page: {items: []; hasMore: false}) => void) | undefined
    const page = new Promise<{items: []; hasMore: false}>((resolve) => {
      resolvePage = resolve
    })
    const controller = createHostScheduleController({
      initialSnapshot: snapshot(),
      catalogue: {listApproved: vi.fn().mockReturnValue(page)},
    })

    const loading = controller.commands.loadMusicCatalogue()
    expect(controller.getSnapshot().catalogue.status).toBe('loading')
    controller.commands.cancelMusicCatalogueLoad()
    resolvePage?.({items: [], hasMore: false})

    await expect(loading).resolves.toEqual({code: 'cancelled', operation: 'load_music_catalogue'})
    expect(controller.getSnapshot().catalogue).toEqual({status: 'idle', items: []})
  })

  it('updates notes under an entity lock and refreshes authoritative state', async () => {
    const operations = successfulOperations()
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue, operations})

    const saving = controller.commands.updateNotes('jam-music-1', 'Lower key')

    expect(controller.getSnapshot().pendingEntityIds).toEqual(new Set(['jam-music-1']))
    await expect(saving).resolves.toEqual({
      code: 'success',
      operation: 'update_notes',
      affectedIds: ['jam-music-1'],
    })
    expect(operations.updateNotes).toHaveBeenCalledWith({
      jamId: 'jam-1',
      jamMusicId: 'jam-music-1',
      notes: 'Lower key',
    })
    expect(operations.refresh).toHaveBeenCalledWith('jam-1')
    expect(controller.getSnapshot().pendingEntityIds.size).toBe(0)
    expect(controller.getSnapshot().latestOutcome).toEqual({
      code: 'success',
      operation: 'update_notes',
      affectedIds: ['jam-music-1'],
    })
  })

  it('reports a resolved notes failure without claiming success or refreshing', async () => {
    const operations = successfulOperations()
    vi.mocked(operations.updateNotes).mockResolvedValue({ok: false, error: {message: 'Not allowed'}})
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue, operations})

    await expect(controller.commands.updateNotes('jam-music-1', 'Lower key')).resolves.toEqual({
      code: 'failure',
      operation: 'update_notes',
      failure: 'resolved',
      affectedIds: ['jam-music-1'],
      error: {message: 'Not allowed'},
    })
    expect(operations.refresh).not.toHaveBeenCalled()
    expect(controller.getSnapshot().pendingEntityIds.size).toBe(0)
  })

  it('refreshes after a thrown notes failure because the mutation may have reached the server', async () => {
    const operations = successfulOperations()
    vi.mocked(operations.updateNotes).mockRejectedValue(new Error('Connection lost'))
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue, operations})

    await expect(controller.commands.updateNotes('jam-music-1', 'Lower key')).resolves.toEqual({
      code: 'failure',
      operation: 'update_notes',
      failure: 'thrown',
      affectedIds: ['jam-music-1'],
      error: {message: 'Connection lost'},
    })
    expect(operations.refresh).toHaveBeenCalledWith('jam-1')
    expect(controller.getSnapshot().pendingEntityIds.size).toBe(0)
  })

  it('reports refresh failure instead of success after a completed mutation', async () => {
    const operations = successfulOperations()
    vi.mocked(operations.refresh).mockResolvedValue({ok: false, error: {message: 'Refresh failed'}})
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue, operations})

    await expect(controller.commands.updateNotes('jam-music-1', 'Lower key')).resolves.toEqual({
      code: 'refresh_failure',
      operation: 'update_notes',
      affectedIds: ['jam-music-1'],
      error: {message: 'Refresh failed'},
    })
    expect(controller.getSnapshot().latestOutcome?.code).toBe('refresh_failure')
  })

  it('rejects a duplicate command while the same entity is pending', async () => {
    const operations = successfulOperations()
    const mutation = deferred<{ok: true}>()
    vi.mocked(operations.updateNotes).mockReturnValue(mutation.promise)
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue, operations})

    const first = controller.commands.updateNotes('jam-music-1', 'Lower key')
    await expect(controller.commands.updateNotes('jam-music-1', 'Another key')).resolves.toEqual({
      code: 'duplicate_pending',
      operation: 'update_notes',
      entityId: 'jam-music-1',
    })
    expect(operations.updateNotes).toHaveBeenCalledTimes(1)

    mutation.resolve({ok: true})
    await first
  })

  it('does not treat matching IDs from different entity types as duplicates', async () => {
    const operations = successfulOperations()
    const notesMutation = deferred<{ok: true}>()
    vi.mocked(operations.updateNotes).mockReturnValue(notesMutation.promise)
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue, operations})

    const savingNotes = controller.commands.updateNotes('shared-id', 'Lower key')
    await expect(controller.commands.transitionPerformance('shared-id', 'COMPLETED')).resolves.toEqual({
      code: 'success',
      operation: 'transition_performance',
      affectedIds: ['shared-id'],
    })
    expect(operations.updatePerformance).toHaveBeenCalledTimes(1)
    expect(controller.getSnapshot().pendingEntityIds).toEqual(new Set(['shared-id']))

    notesMutation.resolve({ok: true})
    await savingNotes
    expect(controller.getSnapshot().pendingEntityIds.size).toBe(0)
  })

  it('places an approved suggestion after the active Performance order', async () => {
    const operations = successfulOperations()
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue, operations})

    await expect(controller.commands.transitionPerformance('suggestion', 'SCHEDULED')).resolves.toEqual({
      code: 'success',
      operation: 'transition_performance',
      affectedIds: ['suggestion'],
    })
    expect(operations.updatePerformance).toHaveBeenCalledWith({
      performanceId: 'suggestion',
      status: 'SCHEDULED',
      order: 3,
    })
  })

  it('creates a Performance after the greatest existing order', async () => {
    const operations = successfulOperations()
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue, operations})

    await expect(controller.commands.createPerformance('music-4')).resolves.toEqual({
      code: 'success',
      operation: 'create_performance',
      affectedIds: ['music-4'],
    })
    expect(operations.createPerformance).toHaveBeenCalledWith({jamId: 'jam-1', musicId: 'music-4', order: 4})
  })

  it('models destructive confirmation before removing a Performance', async () => {
    const operations = successfulOperations()
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue, operations})

    controller.commands.requestRemovePerformance('scheduled')
    expect(controller.getSnapshot().pendingConfirmation).toEqual({
      kind: 'remove_performance',
      performanceId: 'scheduled',
    })
    expect(operations.removePerformance).not.toHaveBeenCalled()

    await expect(controller.commands.confirmPendingAction()).resolves.toEqual({
      code: 'success',
      operation: 'remove_performance',
      affectedIds: ['scheduled'],
    })
    expect(operations.removePerformance).toHaveBeenCalledWith('scheduled')
    expect(controller.getSnapshot().pendingConfirmation).toBeNull()
  })

  it('approves a Performance Registration and refreshes the Jam', async () => {
    const operations = successfulOperations()
    const controller = createHostScheduleController({initialSnapshot: snapshot(), catalogue, operations})

    await expect(controller.commands.approveRegistration('vocal')).resolves.toEqual({
      code: 'success',
      operation: 'approve_registration',
      affectedIds: ['vocal'],
    })
    expect(operations.updateRegistration).toHaveBeenCalledWith({registrationId: 'vocal', status: 'APPROVED'})
    expect(operations.refresh).toHaveBeenCalledWith('jam-1')
  })

  it('reports individual failures when bulk Registration approval partially succeeds', async () => {
    const initial = snapshot()
    const scheduled = initial.performances.find(({id}) => id === 'scheduled')!
    const registrations = [
      {...scheduled.registrations[0], id: 'pending-1', status: 'PENDING'},
      {...scheduled.registrations[0], id: 'pending-2', status: 'PENDING'},
    ]
    const withPending = {
      ...initial,
      performances: initial.performances.map((performance) => (
        performance.id === 'scheduled' ? {...performance, registrations} : performance
      )),
    }
    const operations = successfulOperations(withPending)
    vi.mocked(operations.updateRegistration)
      .mockResolvedValueOnce({ok: true})
      .mockResolvedValueOnce({ok: false, error: {message: 'Already filled'}})
    const controller = createHostScheduleController({initialSnapshot: withPending, catalogue, operations})

    await expect(controller.commands.approveAllRegistrations('scheduled')).resolves.toEqual({
      code: 'partial_success',
      operation: 'approve_all_registrations',
      affectedIds: ['pending-1', 'pending-2'],
      succeededIds: ['pending-1'],
      failed: [{id: 'pending-2', failure: 'resolved', error: {message: 'Already filled'}}],
    })
    expect(operations.refresh).toHaveBeenCalledTimes(1)
  })
})
