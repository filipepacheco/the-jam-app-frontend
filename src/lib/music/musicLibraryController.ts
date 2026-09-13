import type {MusicResponseDto, PaginationMeta, UpdateMusicDto} from '../../types/api.types'
import {filterAndSortMusic} from '../musicUtils'

export type MusicLibrarySort = 'title' | 'artist' | 'date'
export type MusicQueryStatus = 'idle' | 'loading' | 'ready' | 'failed'

export interface MusicLibraryPage {
  items: readonly MusicResponseDto[]
  meta: PaginationMeta
}

export interface MusicLibraryQueryPort {
  list(input: {skip: number; take: number; status: 'APPROVED' | 'SUGGESTED'}): Promise<MusicLibraryPage>
}

export type MusicLibraryMutationResult = {ok: true} | {ok: false; error: QueryError}
export interface MusicLibraryMutationPort {
  update(id: string, data: UpdateMusicDto): Promise<MusicLibraryMutationResult>
  remove(id: string): Promise<MusicLibraryMutationResult>
}

export type MusicLibraryOperation = 'approve' | 'reject' | 'delete' | 'edit' | 'modal_complete'
export type MusicLibraryOutcome =
  | {code: 'success'; operation: MusicLibraryOperation; entityId?: string}
  | {code: 'failure'; operation: MusicLibraryOperation; failure: 'resolved' | 'thrown'; entityId?: string; error: QueryError; refreshError?: QueryError}
  | {code: 'refresh_failure'; operation: MusicLibraryOperation; entityId?: string; error: QueryError}
  | {code: 'duplicate_pending'; operation: MusicLibraryOperation; entityId: string}
  | {code: 'cancelled'; operation: 'confirm_pending'}

export type MusicLibraryConfirmation = {
  kind: 'reject' | 'delete'
  musicId: string
  title: string
  artist: string
}

interface QueryError {message: string; reason?: 'unknown' | 'superseded' | 'disposed'}
type QueryRefreshResult = {ok: true} | {ok: false; error: QueryError}
interface ApprovedQueryState {
  status: MusicQueryStatus
  items: readonly MusicResponseDto[]
  meta: PaginationMeta | null
  error?: QueryError
}
interface SuggestedCountState {status: MusicQueryStatus; count: number; error?: QueryError}
interface SuggestedListState {status: MusicQueryStatus; items: readonly MusicResponseDto[]; error?: QueryError}

export interface MusicLibraryState {
  query: {page: number; pageSize: number; searchTerm: string; genre: string; sort: MusicLibrarySort}
  approved: ApprovedQueryState
  visibleMusic: readonly MusicResponseDto[]
  suggestedCount: SuggestedCountState
  suggestedList: SuggestedListState
  suggestedOpen: boolean
  pendingEntityIds: ReadonlySet<string>
  pendingConfirmation: MusicLibraryConfirmation | null
  modalIntent: {kind: 'add' | 'suggest'} | null
  latestOutcome: MusicLibraryOutcome | null
}

export interface MusicLibraryController {
  getSnapshot(): MusicLibraryState
  subscribe(listener: () => void): () => void
  commands: {
    load(): Promise<void>
    refreshApproved(): Promise<QueryRefreshResult>
    refreshSuggestedCount(): Promise<QueryRefreshResult>
    refreshSuggestedList(): Promise<QueryRefreshResult>
    openSuggested(): Promise<void>
    closeSuggested(): void
    setPage(page: number): Promise<void>
    setPageSize(pageSize: number): Promise<void>
    setSearch(searchTerm: string): void
    setGenre(genre: string): void
    setSort(sort: MusicLibrarySort): void
    clearFilters(): void
    approve(music: MusicResponseDto): Promise<MusicLibraryOutcome>
    edit(musicId: string, data: UpdateMusicDto): Promise<MusicLibraryOutcome>
    reject(music: MusicResponseDto): Promise<MusicLibraryOutcome>
    deleteMusic(music: MusicResponseDto): Promise<MusicLibraryOutcome>
    requestConfirmation(kind: 'reject' | 'delete', music: MusicResponseDto): void
    cancelConfirmation(): void
    confirmPending(): Promise<MusicLibraryOutcome>
    openModal(kind: 'add' | 'suggest'): void
    closeModal(): void
    completeModal(): Promise<MusicLibraryOutcome>
  }
  dispose(): void
}

function queryError(cause: unknown, fallback: string): QueryError {
  if (cause instanceof Error) return {message: cause.message}
  if (typeof cause === 'string' && cause) return {message: cause}
  return fallback ? {message: fallback} : {message: '', reason: 'unknown'}
}

function cancelledQueryError(disposed: boolean): QueryError {
  return {message: '', reason: disposed ? 'disposed' : 'superseded'}
}

export function createMusicLibraryController({
  isHost,
  queries,
  operations,
}: {
  isHost: boolean
  queries: MusicLibraryQueryPort
  operations?: MusicLibraryMutationPort
}): MusicLibraryController {
  let query = {page: 0, pageSize: 50, searchTerm: '', genre: '', sort: 'title' as MusicLibrarySort}
  let approved: ApprovedQueryState = {status: 'idle', items: [], meta: null}
  let suggestedCount: SuggestedCountState = {status: 'idle', count: 0}
  let suggestedList: SuggestedListState = {status: 'idle', items: []}
  let suggestedOpen = false
  const pendingEntityIds = new Set<string>()
  let pendingConfirmation: MusicLibraryConfirmation | null = null
  let modalIntent: {kind: 'add' | 'suggest'} | null = null
  let latestOutcome: MusicLibraryOutcome | null = null
  let approvedRequest = 0
  let suggestedCountRequest = 0
  let suggestedListRequest = 0
  let disposed = false
  const listeners = new Set<() => void>()
  let state: MusicLibraryState

  const project = (notify = true) => {
    state = {
      query,
      approved,
      visibleMusic: filterAndSortMusic([...approved.items], {
        status: 'all', searchTerm: query.searchTerm, genreFilter: query.genre, sortBy: query.sort,
      }),
      suggestedCount,
      suggestedList,
      suggestedOpen,
      pendingEntityIds: new Set(pendingEntityIds),
      pendingConfirmation,
      modalIntent,
      latestOutcome,
    }
    if (notify && !disposed) listeners.forEach((listener) => listener())
  }
  project(false)

  const refreshApproved = async (): Promise<QueryRefreshResult> => {
    const request = ++approvedRequest
    approved = {...approved, status: 'loading', error: undefined}
    project()
    try {
      const page = await queries.list({skip: query.page * query.pageSize, take: query.pageSize, status: 'APPROVED'})
      if (request !== approvedRequest || disposed) return {ok: false, error: cancelledQueryError(disposed)}
      approved = {status: 'ready', items: page.items, meta: page.meta}
    } catch (cause) {
      if (request !== approvedRequest || disposed) return {ok: false, error: cancelledQueryError(disposed)}
      const error = queryError(cause, '')
      approved = {...approved, status: 'failed', error}
      project()
      return {ok: false, error}
    }
    project()
    return {ok: true}
  }

  const refreshSuggestedCount = async (): Promise<QueryRefreshResult> => {
    if (!isHost) return {ok: true}
    const request = ++suggestedCountRequest
    suggestedCount = {...suggestedCount, status: 'loading', error: undefined}
    project()
    try {
      const page = await queries.list({skip: 0, take: 1, status: 'SUGGESTED'})
      if (request !== suggestedCountRequest || disposed) return {ok: false, error: cancelledQueryError(disposed)}
      suggestedCount = {status: 'ready', count: page.meta.total}
    } catch (cause) {
      if (request !== suggestedCountRequest || disposed) return {ok: false, error: cancelledQueryError(disposed)}
      const error = queryError(cause, '')
      suggestedCount = {...suggestedCount, status: 'failed', error}
      project()
      return {ok: false, error}
    }
    project()
    return {ok: true}
  }

  const refreshSuggestedList = async (): Promise<QueryRefreshResult> => {
    if (!isHost) return {ok: true}
    const request = ++suggestedListRequest
    suggestedList = {...suggestedList, status: 'loading', error: undefined}
    project()
    try {
      const page = await queries.list({skip: 0, take: 100, status: 'SUGGESTED'})
      if (request !== suggestedListRequest || disposed) return {ok: false, error: cancelledQueryError(disposed)}
      suggestedList = {status: 'ready', items: page.items}
    } catch (cause) {
      if (request !== suggestedListRequest || disposed) return {ok: false, error: cancelledQueryError(disposed)}
      const error = queryError(cause, '')
      suggestedList = {...suggestedList, status: 'failed', error}
      project()
      return {ok: false, error}
    }
    project()
    return {ok: true}
  }

  const refreshAfter = async (operation: MusicLibraryOperation): Promise<QueryError | undefined> => {
    if (operation === 'reject') {
      const results = await Promise.all([refreshSuggestedCount(), refreshSuggestedList()])
      return results.find((result) => !result.ok)?.error
    }
    if (operation === 'approve') {
      const results = await Promise.all([refreshApproved(), refreshSuggestedCount(), refreshSuggestedList()])
      return results.find((result) => !result.ok)?.error
    }
    const result = await refreshApproved()
    return result.ok ? undefined : result.error
  }

  const runMutation = async (
    operation: Exclude<MusicLibraryOperation, 'modal_complete'>,
    entityId: string,
    mutate: () => Promise<MusicLibraryMutationResult>,
  ): Promise<MusicLibraryOutcome> => {
    if (pendingEntityIds.has(entityId)) {
      latestOutcome = {code: 'duplicate_pending', operation, entityId}
      project()
      return latestOutcome
    }
    if (!operations) {
      latestOutcome = {code: 'failure', operation, failure: 'resolved', entityId, error: {message: 'Music moderation adapter is required'}}
      project()
      return latestOutcome
    }
    pendingEntityIds.add(entityId)
    project()
    try {
      let mutation: MusicLibraryMutationResult
      try {
        mutation = await mutate()
      } catch (cause) {
        const refreshError = await refreshAfter(operation)
        latestOutcome = {
          code: 'failure', operation, failure: 'thrown', entityId,
          error: queryError(cause, ''),
          ...(refreshError ? {refreshError} : {}),
        }
        return latestOutcome
      }
      if (!mutation.ok) {
        latestOutcome = {code: 'failure', operation, failure: 'resolved', entityId, error: mutation.error}
        return latestOutcome
      }
      const refreshError = await refreshAfter(operation)
      latestOutcome = refreshError
        ? {code: 'refresh_failure', operation, entityId, error: refreshError}
        : {code: 'success', operation, entityId}
      return latestOutcome
    } finally {
      pendingEntityIds.delete(entityId)
      project()
    }
  }

  const commands: MusicLibraryController['commands'] = {
    async load() {
      await Promise.all([refreshApproved(), refreshSuggestedCount()])
    },
    refreshApproved,
    refreshSuggestedCount,
    refreshSuggestedList,
    async openSuggested() {
      if (!isHost) return
      suggestedOpen = true
      project()
      await refreshSuggestedList()
    },
    closeSuggested() {
      suggestedOpen = false
      suggestedListRequest += 1
      suggestedList = {status: 'idle', items: []}
      project()
    },
    async setPage(page) {
      query = {...query, page}
      project()
      await refreshApproved()
    },
    async setPageSize(pageSize) {
      query = {...query, page: 0, pageSize}
      project()
      await refreshApproved()
    },
    setSearch(searchTerm) { query = {...query, searchTerm}; project() },
    setGenre(genre) { query = {...query, genre}; project() },
    setSort(sort) { query = {...query, sort}; project() },
    clearFilters() { query = {...query, searchTerm: '', genre: '', sort: 'title'}; project() },
    approve(music) {
      return runMutation('approve', music.id, () => operations!.update(music.id, {status: 'APPROVED'}))
    },
    edit(musicId, data) {
      return runMutation('edit', musicId, () => operations!.update(musicId, data))
    },
    reject(music) {
      return runMutation('reject', music.id, () => operations!.remove(music.id))
    },
    deleteMusic(music) {
      return runMutation('delete', music.id, () => operations!.remove(music.id))
    },
    requestConfirmation(kind, music) {
      pendingConfirmation = {kind, musicId: music.id, title: music.title, artist: music.artist}
      project()
    },
    cancelConfirmation() { pendingConfirmation = null; project() },
    async confirmPending() {
      const confirmation = pendingConfirmation
      if (!confirmation) {
        latestOutcome = {code: 'cancelled', operation: 'confirm_pending'}
        project()
        return latestOutcome
      }
      const music = {id: confirmation.musicId, title: confirmation.title, artist: confirmation.artist, createdAt: ''}
      const outcome = confirmation.kind === 'reject'
        ? await commands.reject(music)
        : await commands.deleteMusic(music)
      if (outcome.code !== 'duplicate_pending' && pendingConfirmation === confirmation) pendingConfirmation = null
      project()
      return outcome
    },
    openModal(kind) { modalIntent = {kind}; project() },
    closeModal() { modalIntent = null; project() },
    async completeModal() {
      modalIntent = null
      const refreshed = await refreshApproved()
      const outcome: MusicLibraryOutcome = !refreshed.ok
        ? {code: 'refresh_failure', operation: 'modal_complete', error: refreshed.error}
        : {code: 'success', operation: 'modal_complete'}
      latestOutcome = outcome
      project()
      return outcome
    },
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    commands,
    dispose() {
      disposed = true
      approvedRequest += 1
      suggestedCountRequest += 1
      suggestedListRequest += 1
      listeners.clear()
    },
  }
}
