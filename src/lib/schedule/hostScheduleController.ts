import {normalizeInstrument} from '../../utils/musicianUtils'

export type PerformanceStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'SUGGESTED'

export interface Music {
  id: string
  title: string
  artist: string
  genre?: string
  duration?: number
  description?: string
  link?: string
  info?: string
  status?: 'APPROVED' | 'SUGGESTED'
  createdAt: string
  neededDrums?: number
  neededGuitars?: number
  neededVocals?: number
  neededBass?: number
  neededKeys?: number
}

export interface Musician {
  id: string
  name?: string | null
  instrument?: string | null
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL' | null
  contact?: string | null
  phone?: string | null
  email?: string | null
  supabaseUserId?: string | null
  bio?: string | null
  otherInstruments?: string | null
  isHost: boolean
  createdAt: string
}

export interface PerformanceRegistration {
  id: string
  musicianId: string
  jamId: string
  jamMusicId?: string
  scheduleId?: string
  instrument: string
  status?: string
  createdAt?: string
  musician?: Musician
}

export interface Performance {
  id: string
  jamId: string
  musicId: string
  order: number
  status: PerformanceStatus
  createdAt: string
  registrationId?: string
  music: Music
  registrations: PerformanceRegistration[]
  registration?: PerformanceRegistration
  jamMusic?: {id: string; notes?: string | null}
}

export interface HostScheduleSnapshot {
  jamId: string
  performances: readonly Performance[]
}

export interface MusicCataloguePage {
  items: readonly Music[]
  hasMore: boolean
}

export interface MusicCataloguePort {
  listApproved(input: {skip: number; take: number}): Promise<MusicCataloguePage>
}

export interface HostScheduleState {
  performances: readonly Performance[]
  activePerformances: readonly Performance[]
  suggestedPerformances: readonly Performance[]
  filteredActivePerformances: readonly Performance[]
  filteredSuggestedPerformances: readonly Performance[]
  counts: {total: number; needsMusicians: number; complete: number}
  rawSearch: string
  appliedSearch: string
  filter: HostScheduleFilter
  catalogue: {
    status: 'idle' | 'loading' | 'ready' | 'failed'
    items: readonly Music[]
    error?: {message: string}
  }
  availableMusic: readonly Music[]
}

export type HostScheduleFilter = 'all' | 'needs_musicians' | 'complete'

export interface HostScheduleCommands {
  replaceSnapshot(snapshot: HostScheduleSnapshot): void
  setSearch(search: string): void
  clearSearch(): void
  setFilter(filter: HostScheduleFilter): void
  addCatalogueMusic(music: Music): void
  loadMusicCatalogue(): Promise<HostScheduleOutcome>
}

export type HostScheduleOutcome =
  | {code: 'success'; operation: 'load_music_catalogue'}
  | {code: 'failure'; operation: 'load_music_catalogue'; error: {message: string}}

export interface HostScheduleController {
  getSnapshot(): HostScheduleState
  subscribe(listener: () => void): () => void
  commands: HostScheduleCommands
  dispose(): void
}

const CORE_BAND = ['drums', 'guitars', 'bass', 'vocals'] as const

function hasCoreBand(performance: Performance): boolean {
  const instruments = new Set(
    performance.registrations
      .filter(({status}) => status !== 'REJECTED')
      .map(({instrument}) => normalizeInstrument(instrument)),
  )
  return CORE_BAND.every((instrument) => instruments.has(instrument))
}

function matchesSearch(performance: Performance, search: string): boolean {
  const query = search.toLowerCase().trim()
  if (!query) return true

  return performance.music.title.toLowerCase().includes(query)
    || performance.music.artist.toLowerCase().includes(query)
    || performance.registrations.some(({musician}) => musician?.name?.toLowerCase().includes(query))
}

export function createHostScheduleController({
  initialSnapshot,
  catalogue,
}: {
  initialSnapshot: HostScheduleSnapshot
  catalogue: MusicCataloguePort
}): HostScheduleController {
  let performances = [...initialSnapshot.performances].sort((left, right) => left.order - right.order)
  let activePerformances = performances.filter(({status}) => status !== 'SUGGESTED')
  let suggestedPerformances = performances.filter(({status}) => status === 'SUGGESTED')
  let rawSearch = ''
  let appliedSearch = ''
  let filter: HostScheduleFilter = 'all'
  let searchTimer: ReturnType<typeof setTimeout> | undefined
  let catalogueStatus: HostScheduleState['catalogue']['status'] = 'idle'
  let catalogueMusic: readonly Music[] = []
  let catalogueError: {message: string} | undefined
  let state: HostScheduleState
  const listeners = new Set<() => void>()

  const project = (notify = true) => {
    const searchedActive = activePerformances.filter((performance) => matchesSearch(performance, appliedSearch))
    const filteredActivePerformances = searchedActive.filter((performance) => {
      if (filter === 'needs_musicians') return !hasCoreBand(performance)
      if (filter === 'complete') return hasCoreBand(performance)
      return true
    })
    const filteredSuggestedPerformances = suggestedPerformances.filter((performance) => matchesSearch(performance, appliedSearch))
    const complete = searchedActive.filter(hasCoreBand).length

    state = {
      performances,
      activePerformances,
      suggestedPerformances,
      filteredActivePerformances,
      filteredSuggestedPerformances,
      counts: {
        total: searchedActive.length + filteredSuggestedPerformances.length,
        needsMusicians: searchedActive.length - complete,
        complete,
      },
      rawSearch,
      appliedSearch,
      filter,
      catalogue: {
        status: catalogueStatus,
        items: catalogueMusic,
        ...(catalogueError ? {error: catalogueError} : {}),
      },
      availableMusic: catalogueMusic.filter(({id}) => !performances.some(({musicId}) => musicId === id)),
    }

    if (notify) listeners.forEach((listener) => listener())
  }

  project(false)

  const commands: HostScheduleCommands = {
    replaceSnapshot(snapshot) {
      performances = [...snapshot.performances].sort((left, right) => left.order - right.order)
      activePerformances = performances.filter(({status}) => status !== 'SUGGESTED')
      suggestedPerformances = performances.filter(({status}) => status === 'SUGGESTED')
      project()
    },
    setSearch(search) {
      rawSearch = search
      project()
      if (searchTimer) clearTimeout(searchTimer)
      searchTimer = setTimeout(() => {
        appliedSearch = rawSearch
        project()
      }, 200)
    },
    clearSearch() {
      if (searchTimer) clearTimeout(searchTimer)
      searchTimer = undefined
      rawSearch = ''
      appliedSearch = ''
      project()
    },
    setFilter(nextFilter) {
      filter = nextFilter
      project()
    },
    addCatalogueMusic(music) {
      catalogueMusic = [music, ...catalogueMusic.filter(({id}) => id !== music.id)]
      catalogueStatus = 'ready'
      catalogueError = undefined
      project()
    },
    async loadMusicCatalogue() {
      catalogueStatus = 'loading'
      catalogueError = undefined
      project()

      try {
        const items: Music[] = []
        let skip = 0
        let hasMore = true
        while (hasMore) {
          const page = await catalogue.listApproved({skip, take: 100})
          items.push(...page.items)
          hasMore = page.hasMore
          skip += 100
        }

        catalogueMusic = items
        catalogueStatus = 'ready'
        project()
        return {code: 'success', operation: 'load_music_catalogue'}
      } catch (cause) {
        catalogueError = {message: cause instanceof Error ? cause.message : 'Unknown catalogue error'}
        catalogueStatus = 'failed'
        project()
        return {code: 'failure', operation: 'load_music_catalogue', error: catalogueError}
      }
    },
  }

  return {
    commands,
    dispose() {
      if (searchTimer) clearTimeout(searchTimer)
      searchTimer = undefined
      listeners.clear()
    },
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
