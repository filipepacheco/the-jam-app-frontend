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

export interface ScheduleFailure {
  message: string
}

export type ScheduleMutationResult = {ok: true} | {ok: false; error: ScheduleFailure}
export type ScheduleRefreshResult =
  | {ok: true; snapshot: HostScheduleSnapshot}
  | {ok: false; error: ScheduleFailure}

export interface HostScheduleOperationsPort {
  updateNotes(input: {jamId: string; jamMusicId: string; notes: string}): Promise<ScheduleMutationResult>
  updatePerformance(input: {performanceId: string; status: PerformanceStatus; order?: number}): Promise<ScheduleMutationResult>
  createPerformance(input: {jamId: string; musicId: string; order: number}): Promise<ScheduleMutationResult>
  removePerformance(performanceId: string): Promise<ScheduleMutationResult>
  updateRegistration(input: {registrationId: string; status: 'APPROVED'}): Promise<ScheduleMutationResult>
  removeRegistration(registrationId: string): Promise<ScheduleMutationResult>
  refresh(jamId: string): Promise<ScheduleRefreshResult>
}

export interface ScheduleTimerPort {
  schedule(delayMs: number, callback: () => void): () => void
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
  pendingEntityIds: ReadonlySet<string>
  pendingConfirmation: HostScheduleConfirmation | null
  latestOutcome: HostScheduleOutcome | null
}

export type HostScheduleConfirmation =
  | {kind: 'remove_performance'; performanceId: string}
  | {kind: 'remove_registration'; registrationId: string}

export type HostScheduleFilter = 'all' | 'needs_musicians' | 'complete'

export interface HostScheduleCommands {
  replaceSnapshot(snapshot: HostScheduleSnapshot): void
  setSearch(search: string): void
  clearSearch(): void
  setFilter(filter: HostScheduleFilter): void
  addCatalogueMusic(music: Music): void
  loadMusicCatalogue(): Promise<HostScheduleOutcome>
  cancelMusicCatalogueLoad(): void
  updateNotes(jamMusicId: string, notes: string): Promise<HostScheduleOutcome>
  transitionPerformance(performanceId: string, status: PerformanceStatus): Promise<HostScheduleOutcome>
  createPerformance(musicId: string): Promise<HostScheduleOutcome>
  requestRemovePerformance(performanceId: string): void
  requestRemoveRegistration(registrationId: string): void
  cancelPendingAction(): void
  confirmPendingAction(): Promise<HostScheduleOutcome>
  approveRegistration(registrationId: string): Promise<HostScheduleOutcome>
  approveAllRegistrations(performanceId: string): Promise<HostScheduleOutcome>
}

export type HostScheduleMutationOperation =
  | 'update_notes'
  | 'transition_performance'
  | 'create_performance'
  | 'remove_performance'
  | 'remove_registration'
  | 'approve_registration'
  | 'approve_all_registrations'

type PendingEntityKind = 'jam_music' | 'performance' | 'music' | 'registration'
interface PendingEntity {
  kind: PendingEntityKind
  id: string
}

export type HostScheduleOutcome =
  | {code: 'success'; operation: 'load_music_catalogue'}
  | {code: 'success'; operation: HostScheduleMutationOperation; affectedIds: string[]}
  | {
      code: 'failure'
      operation: HostScheduleMutationOperation
      failure: 'resolved' | 'thrown'
      affectedIds: string[]
      error: ScheduleFailure
    }
  | {
      code: 'refresh_failure'
      operation: HostScheduleMutationOperation
      affectedIds: string[]
      error: ScheduleFailure
    }
  | {code: 'duplicate_pending'; operation: HostScheduleMutationOperation; entityId: string}
  | {
      code: 'partial_success' | 'bulk_failure'
      operation: 'approve_all_registrations'
      affectedIds: string[]
      succeededIds: string[]
      failed: Array<{id: string; failure: 'resolved' | 'thrown'; error: ScheduleFailure}>
    }
  | {code: 'failure'; operation: 'load_music_catalogue'; error: {message: string}}
  | {code: 'cancelled'; operation: 'load_music_catalogue'}
  | {code: 'cancelled'; operation: 'confirm_pending_action'}

export interface HostScheduleController {
  getSnapshot(): HostScheduleState
  subscribe(listener: () => void): () => void
  commands: HostScheduleCommands
  dispose(): void
}

const CORE_BAND = ['drums', 'guitars', 'bass', 'vocals'] as const
const browserTimer: ScheduleTimerPort = {
  schedule(delayMs, callback) {
    const handle = setTimeout(callback, delayMs)
    return () => clearTimeout(handle)
  },
}

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
  operations,
  timer = browserTimer,
}: {
  initialSnapshot: HostScheduleSnapshot
  catalogue: MusicCataloguePort
  operations?: HostScheduleOperationsPort
  timer?: ScheduleTimerPort
}): HostScheduleController {
  let performances = [...initialSnapshot.performances].sort((left, right) => left.order - right.order)
  let activePerformances = performances.filter(({status}) => status !== 'SUGGESTED')
  let suggestedPerformances = performances.filter(({status}) => status === 'SUGGESTED')
  let rawSearch = ''
  let appliedSearch = ''
  let filter: HostScheduleFilter = 'all'
  let cancelSearchTimer: (() => void) | undefined
  let catalogueStatus: HostScheduleState['catalogue']['status'] = 'idle'
  let catalogueMusic: readonly Music[] = []
  let catalogueError: {message: string} | undefined
  let catalogueRequest = 0
  let currentJamId = initialSnapshot.jamId
  const pendingLocks = new Set<string>()
  const pendingEntityCounts = new Map<string, number>()
  let pendingConfirmation: HostScheduleConfirmation | null = null
  let latestOutcome: HostScheduleOutcome | null = null
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
      pendingEntityIds: new Set(pendingEntityCounts.keys()),
      pendingConfirmation,
      latestOutcome,
    }

    if (notify) listeners.forEach((listener) => listener())
  }

  project(false)

  const refreshSnapshot = async (): Promise<ScheduleRefreshResult> => {
    if (!operations) return {ok: false, error: {message: 'Host Schedule operations adapter is required'}}
    try {
      return await operations.refresh(currentJamId)
    } catch (cause) {
      return {ok: false, error: {message: cause instanceof Error ? cause.message : 'Unknown refresh error'}}
    }
  }

  const runMutation = async (
    operation: HostScheduleMutationOperation,
    entities: PendingEntity[],
    affectedIds: string[],
    mutate: () => Promise<ScheduleMutationResult>,
  ): Promise<HostScheduleOutcome> => {
    const duplicate = entities.find(({kind, id}) => pendingLocks.has(`${kind}:${id}`))
    if (duplicate) {
      latestOutcome = {code: 'duplicate_pending', operation, entityId: duplicate.id}
      project()
      return latestOutcome
    }

    entities.forEach(({kind, id}) => {
      pendingLocks.add(`${kind}:${id}`)
      pendingEntityCounts.set(id, (pendingEntityCounts.get(id) ?? 0) + 1)
    })
    project()
    try {
      let mutation: ScheduleMutationResult
      try {
        mutation = await mutate()
      } catch (cause) {
        const refreshed = await refreshSnapshot()
        if (refreshed.ok) commands.replaceSnapshot(refreshed.snapshot)
        latestOutcome = {
          code: 'failure',
          operation,
          failure: 'thrown',
          affectedIds,
          error: {message: cause instanceof Error ? cause.message : 'Unknown mutation error'},
        }
        return latestOutcome
      }

      if (!mutation.ok) {
        latestOutcome = {code: 'failure', operation, failure: 'resolved', affectedIds, error: mutation.error}
        return latestOutcome
      }

      const refreshed = await refreshSnapshot()
      if (!refreshed.ok) {
        latestOutcome = {code: 'refresh_failure', operation, affectedIds, error: refreshed.error}
        return latestOutcome
      }
      commands.replaceSnapshot(refreshed.snapshot)
      latestOutcome = {code: 'success', operation, affectedIds}
      return latestOutcome
    } finally {
      entities.forEach(({kind, id}) => {
        pendingLocks.delete(`${kind}:${id}`)
        const count = pendingEntityCounts.get(id) ?? 0
        if (count <= 1) pendingEntityCounts.delete(id)
        else pendingEntityCounts.set(id, count - 1)
      })
      project()
    }
  }

  const commands: HostScheduleCommands = {
    replaceSnapshot(snapshot) {
      currentJamId = snapshot.jamId
      performances = [...snapshot.performances].sort((left, right) => left.order - right.order)
      activePerformances = performances.filter(({status}) => status !== 'SUGGESTED')
      suggestedPerformances = performances.filter(({status}) => status === 'SUGGESTED')
      project()
    },
    setSearch(search) {
      rawSearch = search
      project()
      cancelSearchTimer?.()
      cancelSearchTimer = timer.schedule(200, () => {
        cancelSearchTimer = undefined
        appliedSearch = rawSearch
        project()
      })
    },
    clearSearch() {
      cancelSearchTimer?.()
      cancelSearchTimer = undefined
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
      const request = ++catalogueRequest
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

        if (request !== catalogueRequest) {
          return {code: 'cancelled', operation: 'load_music_catalogue'}
        }

        catalogueMusic = items
        catalogueStatus = 'ready'
        project()
        return {code: 'success', operation: 'load_music_catalogue'}
      } catch (cause) {
        if (request !== catalogueRequest) {
          return {code: 'cancelled', operation: 'load_music_catalogue'}
        }
        catalogueError = {message: cause instanceof Error ? cause.message : 'Unknown catalogue error'}
        catalogueStatus = 'failed'
        project()
        return {code: 'failure', operation: 'load_music_catalogue', error: catalogueError}
      }
    },
    cancelMusicCatalogueLoad() {
      catalogueRequest += 1
      catalogueStatus = 'idle'
      catalogueError = undefined
      project()
    },
    async updateNotes(jamMusicId, notes) {
      if (!operations) throw new Error('Host Schedule operations adapter is required')
      return runMutation('update_notes', [{kind: 'jam_music', id: jamMusicId}], [jamMusicId], () => (
        operations.updateNotes({jamId: currentJamId, jamMusicId, notes})
      ))
    },
    async transitionPerformance(performanceId, status) {
      if (!operations) throw new Error('Host Schedule operations adapter is required')
      const performance = performances.find(({id}) => id === performanceId)
      const order = performance?.status === 'SUGGESTED' && status === 'SCHEDULED'
        ? Math.max(0, ...activePerformances.map((item) => item.order)) + 1
        : undefined
      return runMutation('transition_performance', [{kind: 'performance', id: performanceId}], [performanceId], () => (
        operations.updatePerformance({performanceId, status, ...(order === undefined ? {} : {order})})
      ))
    },
    async createPerformance(musicId) {
      if (!operations) throw new Error('Host Schedule operations adapter is required')
      const order = Math.max(0, ...performances.map((performance) => performance.order)) + 1
      return runMutation('create_performance', [{kind: 'music', id: musicId}], [musicId], () => (
        operations.createPerformance({jamId: currentJamId, musicId, order})
      ))
    },
    requestRemovePerformance(performanceId) {
      pendingConfirmation = {kind: 'remove_performance', performanceId}
      project()
    },
    requestRemoveRegistration(registrationId) {
      pendingConfirmation = {kind: 'remove_registration', registrationId}
      project()
    },
    cancelPendingAction() {
      pendingConfirmation = null
      project()
    },
    async confirmPendingAction() {
      if (!operations) throw new Error('Host Schedule operations adapter is required')
      const confirmation = pendingConfirmation
      if (!confirmation) return {code: 'cancelled', operation: 'confirm_pending_action'}
      pendingConfirmation = null
      project()
      if (confirmation.kind === 'remove_performance') {
        return runMutation('remove_performance', [{kind: 'performance', id: confirmation.performanceId}], [confirmation.performanceId], () => (
          operations.removePerformance(confirmation.performanceId)
        ))
      }
      return runMutation('remove_registration', [{kind: 'registration', id: confirmation.registrationId}], [confirmation.registrationId], () => (
        operations.removeRegistration(confirmation.registrationId)
      ))
    },
    async approveRegistration(registrationId) {
      if (!operations) throw new Error('Host Schedule operations adapter is required')
      return runMutation('approve_registration', [{kind: 'registration', id: registrationId}], [registrationId], () => (
        operations.updateRegistration({registrationId, status: 'APPROVED'})
      ))
    },
    async approveAllRegistrations(performanceId) {
      if (!operations) throw new Error('Host Schedule operations adapter is required')
      const registrationIds = performances
        .find(({id}) => id === performanceId)
        ?.registrations.filter(({status}) => status === 'PENDING')
        .map(({id}) => id) ?? []
      const lockEntities: PendingEntity[] = [
        {kind: 'performance', id: performanceId},
        ...registrationIds.map((id) => ({kind: 'registration' as const, id})),
      ]
      const duplicate = lockEntities.find(({kind, id}) => pendingLocks.has(`${kind}:${id}`))
      if (duplicate) {
        latestOutcome = {code: 'duplicate_pending', operation: 'approve_all_registrations', entityId: duplicate.id}
        project()
        return latestOutcome
      }
      if (registrationIds.length === 0) {
        latestOutcome = {code: 'success', operation: 'approve_all_registrations', affectedIds: []}
        project()
        return latestOutcome
      }

      lockEntities.forEach(({kind, id}) => {
        pendingLocks.add(`${kind}:${id}`)
        pendingEntityCounts.set(id, (pendingEntityCounts.get(id) ?? 0) + 1)
      })
      project()
      try {
        const results = await Promise.all(registrationIds.map(async (id) => {
          try {
            const result = await operations.updateRegistration({registrationId: id, status: 'APPROVED'})
            return result.ok
              ? {id, ok: true as const}
              : {id, ok: false as const, failure: 'resolved' as const, error: result.error}
          } catch (cause) {
            return {
              id,
              ok: false as const,
              failure: 'thrown' as const,
              error: {message: cause instanceof Error ? cause.message : 'Unknown mutation error'},
            }
          }
        }))
        const refreshed = await refreshSnapshot()
        if (!refreshed.ok) {
          latestOutcome = {
            code: 'refresh_failure',
            operation: 'approve_all_registrations',
            affectedIds: registrationIds,
            error: refreshed.error,
          }
          return latestOutcome
        }
        commands.replaceSnapshot(refreshed.snapshot)
        const succeededIds = results.filter(({ok}) => ok).map(({id}) => id)
        const failed = results.filter((result) => !result.ok).map(({id, failure, error}) => ({id, failure, error}))
        latestOutcome = failed.length === 0
          ? {code: 'success', operation: 'approve_all_registrations', affectedIds: registrationIds}
          : {
              code: succeededIds.length > 0 ? 'partial_success' : 'bulk_failure',
              operation: 'approve_all_registrations',
              affectedIds: registrationIds,
              succeededIds,
              failed,
            }
        return latestOutcome
      } finally {
        lockEntities.forEach(({kind, id}) => {
          pendingLocks.delete(`${kind}:${id}`)
          const count = pendingEntityCounts.get(id) ?? 0
          if (count <= 1) pendingEntityCounts.delete(id)
          else pendingEntityCounts.set(id, count - 1)
        })
        project()
      }
    },
  }

  return {
    commands,
    dispose() {
      catalogueRequest += 1
      cancelSearchTimer?.()
      cancelSearchTimer = undefined
      listeners.clear()
    },
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
