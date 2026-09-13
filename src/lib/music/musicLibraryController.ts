import type {MusicResponseDto, PaginationMeta} from '../../types/api.types'
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

interface QueryError {message: string}
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
}

export interface MusicLibraryController {
  getSnapshot(): MusicLibraryState
  subscribe(listener: () => void): () => void
  commands: {
    load(): Promise<void>
    refreshApproved(): Promise<void>
    refreshSuggestedCount(): Promise<void>
    refreshSuggestedList(): Promise<void>
    openSuggested(): Promise<void>
    closeSuggested(): void
    setPage(page: number): Promise<void>
    setPageSize(pageSize: number): Promise<void>
    setSearch(searchTerm: string): void
    setGenre(genre: string): void
    setSort(sort: MusicLibrarySort): void
    clearFilters(): void
  }
  dispose(): void
}

function queryError(cause: unknown, fallback: string): QueryError {
  return {message: cause instanceof Error ? cause.message : fallback}
}

export function createMusicLibraryController({
  isHost,
  queries,
}: {
  isHost: boolean
  queries: MusicLibraryQueryPort
}): MusicLibraryController {
  let query = {page: 0, pageSize: 50, searchTerm: '', genre: '', sort: 'title' as MusicLibrarySort}
  let approved: ApprovedQueryState = {status: 'idle', items: [], meta: null}
  let suggestedCount: SuggestedCountState = {status: 'idle', count: 0}
  let suggestedList: SuggestedListState = {status: 'idle', items: []}
  let suggestedOpen = false
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
    }
    if (notify && !disposed) listeners.forEach((listener) => listener())
  }
  project(false)

  const refreshApproved = async () => {
    const request = ++approvedRequest
    approved = {...approved, status: 'loading', error: undefined}
    project()
    try {
      const page = await queries.list({skip: query.page * query.pageSize, take: query.pageSize, status: 'APPROVED'})
      if (request !== approvedRequest || disposed) return
      approved = {status: 'ready', items: page.items, meta: page.meta}
    } catch (cause) {
      if (request !== approvedRequest || disposed) return
      approved = {...approved, status: 'failed', error: queryError(cause, 'Failed to fetch Music')}
    }
    project()
  }

  const refreshSuggestedCount = async () => {
    if (!isHost) return
    const request = ++suggestedCountRequest
    suggestedCount = {...suggestedCount, status: 'loading', error: undefined}
    project()
    try {
      const page = await queries.list({skip: 0, take: 1, status: 'SUGGESTED'})
      if (request !== suggestedCountRequest || disposed) return
      suggestedCount = {status: 'ready', count: page.meta.total}
    } catch (cause) {
      if (request !== suggestedCountRequest || disposed) return
      suggestedCount = {...suggestedCount, status: 'failed', error: queryError(cause, 'Failed to fetch Suggestion count')}
    }
    project()
  }

  const refreshSuggestedList = async () => {
    if (!isHost) return
    const request = ++suggestedListRequest
    suggestedList = {...suggestedList, status: 'loading', error: undefined}
    project()
    try {
      const page = await queries.list({skip: 0, take: 100, status: 'SUGGESTED'})
      if (request !== suggestedListRequest || disposed) return
      suggestedList = {status: 'ready', items: page.items}
    } catch (cause) {
      if (request !== suggestedListRequest || disposed) return
      suggestedList = {...suggestedList, status: 'failed', error: queryError(cause, 'Failed to fetch Suggestions')}
    }
    project()
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
