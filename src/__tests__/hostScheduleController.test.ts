import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  createHostScheduleController,
  type HostScheduleSnapshot,
  type MusicCataloguePort,
  type ScheduleTimerPort,
} from '../lib/schedule/hostScheduleController'

const catalogue: MusicCataloguePort = {
  listApproved: vi.fn().mockResolvedValue({items: [], hasMore: false}),
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
})
