import {describe, expect, it, vi} from 'vitest'
import {
  createMusicLibraryController,
  type MusicLibraryMutationPort,
  type MusicLibraryQueryPort,
} from '../lib/music/musicLibraryController'
import type {MusicResponseDto} from '../types/api.types'

const approved: MusicResponseDto = {id: 'approved', title: 'Dreams', artist: 'Fleetwood Mac', status: 'APPROVED', createdAt: '2026-01-01'}
const suggestion: MusicResponseDto = {id: 'suggested', title: 'Maps', artist: 'Yeah Yeah Yeahs', status: 'SUGGESTED', createdAt: '2026-01-02'}

function queryPort(): MusicLibraryQueryPort {
  return {list: vi.fn().mockResolvedValue({items: [], meta: {total: 0, skip: 0, take: 50, hasMore: false}})}
}

function mutationPort(): MusicLibraryMutationPort {
  return {
    update: vi.fn().mockResolvedValue({ok: true}),
    remove: vi.fn().mockResolvedValue({ok: true}),
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((next) => { resolve = next })
  return {promise, resolve}
}

describe('Music library moderation', () => {
  it('represents destructive confirmation as typed intent and consequence data', async () => {
    const operations = mutationPort()
    const controller = createMusicLibraryController({isHost: true, queries: queryPort(), operations})

    controller.commands.requestConfirmation('reject', suggestion)
    expect(controller.getSnapshot().pendingConfirmation).toEqual({
      kind: 'reject', musicId: 'suggested', title: 'Maps', artist: 'Yeah Yeah Yeahs',
    })

    await controller.commands.confirmPending()
    expect(operations.remove).toHaveBeenCalledWith('suggested')
    expect(controller.getSnapshot().pendingConfirmation).toBeNull()
  })

  it('does not report success or refresh after a resolved moderation failure', async () => {
    const operations = mutationPort()
    vi.mocked(operations.update).mockResolvedValue({ok: false, error: {message: 'not allowed'}})
    const queries = queryPort()
    const controller = createMusicLibraryController({isHost: true, queries, operations})

    const outcome = await controller.commands.approve(suggestion)

    expect(outcome).toEqual({code: 'failure', operation: 'approve', failure: 'resolved', entityId: 'suggested', error: {message: 'not allowed'}})
    expect(queries.list).not.toHaveBeenCalled()
  })

  it('reports post-mutation refresh failure explicitly', async () => {
    const queries: MusicLibraryQueryPort = {list: vi.fn().mockRejectedValue(new Error('refresh offline'))}
    const controller = createMusicLibraryController({isHost: true, queries, operations: mutationPort()})

    const outcome = await controller.commands.deleteMusic(approved)

    expect(outcome).toEqual({code: 'refresh_failure', operation: 'delete', entityId: 'approved', error: {message: 'refresh offline'}})
    expect(controller.getSnapshot().latestOutcome).toEqual(outcome)
  })

  it('normalizes a thrown mutation and refreshes because it may have reached the server', async () => {
    const operations = mutationPort()
    vi.mocked(operations.remove).mockRejectedValue(new Error('connection lost'))
    const queries = queryPort()
    const controller = createMusicLibraryController({isHost: true, queries, operations})

    const outcome = await controller.commands.reject(suggestion)

    expect(outcome).toEqual({code: 'failure', operation: 'reject', failure: 'thrown', entityId: 'suggested', error: {message: 'connection lost'}})
    expect(queries.list).toHaveBeenCalledWith({skip: 0, take: 1, status: 'SUGGESTED'})
    expect(queries.list).toHaveBeenCalledWith({skip: 0, take: 100, status: 'SUGGESTED'})
  })

  it('locks only the affected Music so unrelated moderation remains available', async () => {
    const first = deferred<{ok: true}>()
    const operations = mutationPort()
    vi.mocked(operations.update)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ok: false, error: {message: 'second failed'}})
    const controller = createMusicLibraryController({isHost: true, queries: queryPort(), operations})

    const pending = controller.commands.approve(suggestion)
    expect(controller.getSnapshot().pendingEntityIds).toEqual(new Set(['suggested']))
    await expect(controller.commands.edit(approved.id, {title: 'New title'})).resolves.toMatchObject({operation: 'edit', entityId: 'approved'})
    await expect(controller.commands.approve(suggestion)).resolves.toEqual({code: 'duplicate_pending', operation: 'approve', entityId: 'suggested'})

    first.resolve({ok: true})
    await pending
    expect(controller.getSnapshot().pendingEntityIds.size).toBe(0)
  })

  it('keeps confirmation intent when a duplicate confirm is rejected', async () => {
    const removal = deferred<{ok: true}>()
    const operations = mutationPort()
    vi.mocked(operations.remove).mockReturnValue(removal.promise)
    const controller = createMusicLibraryController({isHost: true, queries: queryPort(), operations})
    controller.commands.requestConfirmation('delete', approved)

    const first = controller.commands.confirmPending()
    await expect(controller.commands.confirmPending()).resolves.toEqual({
      code: 'duplicate_pending', operation: 'delete', entityId: 'approved',
    })
    expect(controller.getSnapshot().pendingConfirmation?.musicId).toBe('approved')

    removal.resolve({ok: true})
    await first
    expect(controller.getSnapshot().pendingConfirmation).toBeNull()
  })

  it('reports a superseded post-mutation refresh instead of claiming reconciliation', async () => {
    const firstRefresh = deferred<{items: []; meta: {total: 0; skip: 0; take: 50; hasMore: false}}>()
    const secondRefresh = deferred<{items: []; meta: {total: 0; skip: 0; take: 50; hasMore: false}}>()
    const queries: MusicLibraryQueryPort = {list: vi.fn()
      .mockReturnValueOnce(firstRefresh.promise)
      .mockReturnValueOnce(secondRefresh.promise)}
    const controller = createMusicLibraryController({isHost: false, queries, operations: mutationPort()})

    const deleting = controller.commands.deleteMusic(approved)
    await Promise.resolve()
    const newerRefresh = controller.commands.refreshApproved()
    firstRefresh.resolve({items: [], meta: {total: 0, skip: 0, take: 50, hasMore: false}})

    await expect(deleting).resolves.toEqual({
      code: 'refresh_failure', operation: 'delete', entityId: 'approved', error: {message: '', reason: 'superseded'},
    })
    secondRefresh.resolve({items: [], meta: {total: 0, skip: 0, take: 50, hasMore: false}})
    await newerRefresh
  })

  it('owns add/suggest modal intent and refreshes after modal completion', async () => {
    const queries = queryPort()
    const controller = createMusicLibraryController({isHost: true, queries, operations: mutationPort()})

    controller.commands.openModal('suggest')
    expect(controller.getSnapshot().modalIntent).toEqual({kind: 'suggest'})
    await controller.commands.completeModal()

    expect(controller.getSnapshot().modalIntent).toBeNull()
    expect(queries.list).toHaveBeenCalledWith({skip: 0, take: 50, status: 'APPROVED'})
  })
})
