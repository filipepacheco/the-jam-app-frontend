import {describe, expect, it, vi} from 'vitest'
import {
  createMusicLibraryController,
  type MusicLibraryQueryPort,
} from '../lib/music/musicLibraryController'

const music = [
  {id: '2', title: 'Zombie', artist: 'The Cranberries', genre: 'Rock', createdAt: '2026-01-02'},
  {id: '1', title: 'Aquarela', artist: 'Toquinho', genre: 'MPB', createdAt: '2026-01-01'},
]

function queryPort(): MusicLibraryQueryPort {
  return {
    list: vi.fn().mockImplementation(({status}) => Promise.resolve({
      items: status === 'APPROVED' ? music : [music[0]],
      meta: {total: status === 'APPROVED' ? 12 : 1, skip: 0, take: 50, hasMore: false},
    })),
  }
}

describe('Music library controller queries', () => {
  it('loads the approved page for viewers without querying host-only Suggestions', async () => {
    const queries = queryPort()
    const controller = createMusicLibraryController({isHost: false, queries})

    await controller.commands.load()

    expect(queries.list).toHaveBeenCalledOnce()
    expect(queries.list).toHaveBeenCalledWith({skip: 0, take: 50, status: 'APPROVED'})
    expect(controller.getSnapshot().approved).toEqual({
      status: 'ready', items: music, meta: {total: 12, skip: 0, take: 50, hasMore: false},
    })
    expect(controller.getSnapshot().suggestedCount.status).toBe('idle')
  })

  it('exposes main-query failures instead of discarding them', async () => {
    const controller = createMusicLibraryController({
      isHost: false,
      queries: {list: vi.fn().mockRejectedValue(new Error('offline'))},
    })

    await controller.commands.load()

    expect(controller.getSnapshot().approved).toEqual({
      status: 'failed', items: [], meta: null, error: {message: 'offline'},
    })
  })

  it('loads the host Suggestion count independently and exposes its failure', async () => {
    const list = vi.fn()
      .mockResolvedValueOnce({items: music, meta: {total: 12, skip: 0, take: 50, hasMore: false}})
      .mockRejectedValueOnce(new Error('count unavailable'))
    const controller = createMusicLibraryController({isHost: true, queries: {list}})

    await controller.commands.load()

    expect(list).toHaveBeenNthCalledWith(2, {skip: 0, take: 1, status: 'SUGGESTED'})
    expect(controller.getSnapshot().suggestedCount).toEqual({
      status: 'failed', count: 0, error: {message: 'count unavailable'},
    })
    expect(controller.getSnapshot().approved.status).toBe('ready')
  })

  it('opens the host Suggestion list and exposes list failures independently', async () => {
    const queries = queryPort()
    const controller = createMusicLibraryController({isHost: true, queries})

    await controller.commands.openSuggested()
    expect(controller.getSnapshot().suggestedList.items).toEqual([music[0]])
    expect(controller.getSnapshot().suggestedList.status).toBe('ready')

    vi.mocked(queries.list).mockRejectedValueOnce(new Error('list unavailable'))
    await controller.commands.openSuggested()
    expect(controller.getSnapshot().suggestedList).toEqual({
      status: 'failed', items: [music[0]], error: {message: 'list unavailable'},
    })
  })

  it('refreshes an already loaded Suggestion list without changing modal intent', async () => {
    const controller = createMusicLibraryController({isHost: true, queries: queryPort()})

    await controller.commands.refreshSuggestedList()

    expect(controller.getSnapshot().suggestedOpen).toBe(false)
    expect(controller.getSnapshot().suggestedList.status).toBe('ready')
  })

  it('preserves server pagination while filtering and sorting only the current page', async () => {
    const queries = queryPort()
    const controller = createMusicLibraryController({isHost: false, queries})
    await controller.commands.load()

    controller.commands.setSearch('zom')
    controller.commands.setGenre('Rock')
    controller.commands.setSort('artist')
    expect(controller.getSnapshot().visibleMusic.map(({id}) => id)).toEqual(['2'])
    expect(controller.getSnapshot().approved.meta?.total).toBe(12)

    await controller.commands.setPage(2)
    expect(queries.list).toHaveBeenLastCalledWith({skip: 100, take: 50, status: 'APPROVED'})

    await controller.commands.setPageSize(20)
    expect(controller.getSnapshot().query.page).toBe(0)
    expect(queries.list).toHaveBeenLastCalledWith({skip: 0, take: 20, status: 'APPROVED'})
  })
})
