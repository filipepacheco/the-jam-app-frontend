import type {CreateMusicDto} from '../../types/api.types'
import type {Performance} from '../schedule/hostScheduleController'

export type ParticipationOverlay = 'none' | 'performance_picker' | 'enrollment' | 'suggestion' | 'new_music' | 'share'
export type ParticipationIntent = 'registration' | 'suggestion'
export type ParticipationMutation = 'registration' | 'suggestion' | 'create_and_suggest'
export type ParticipationFeedback = 'registration_success' | 'suggestion_success' | 'new_music_success'
export interface ParticipationError {message: string; reason?: 'unknown'}

export interface JamParticipationContext {
  jamId: string
  participationOpen: boolean
  isAuthenticated: boolean
  musicianId: string | null
  performances: readonly Performance[]
}

export type ParticipationMutationResult = {ok: true} | {ok: false; error: ParticipationError}
export type ParticipationRefreshResult = {ok: true; context: JamParticipationContext} | {ok: false; error: ParticipationError}
export type ParticipationCreateResult = {ok: true; musicId: string} | {ok: false; error: ParticipationError}

export interface JamParticipationOperationsPort {
  register(input: {musicianId: string; performanceId: string; instrument: string}): Promise<ParticipationMutationResult>
  suggest(input: {jamId: string; musicId: string}): Promise<ParticipationMutationResult>
  createMusic(data: CreateMusicDto): Promise<ParticipationCreateResult>
  refresh(): Promise<ParticipationRefreshResult>
}

export interface ParticipationClockPort {
  schedule(delayMs: number, callback: () => void): () => void
}

export interface ParticipationSharePort {
  canNativeShare(): boolean
  copy(text: string): Promise<boolean>
  whatsapp(input: {url: string; message: string}): void
  native(input: {title: string; url: string}): Promise<boolean>
}

export type JamParticipationOutcome =
  | {code: 'ready'; intent: 'registration'; performanceId: string}
  | {code: 'ready'; intent: 'suggestion'}
  | {code: 'choose_performance'; eligibleIds: string[]}
  | {code: 'auth_required'; intent: ParticipationIntent; redirect: string}
  | {code: 'unavailable'; intent: ParticipationIntent | 'share'}
  | {code: 'success'; operation: ParticipationMutation; entityId: string}
  | {code: 'success'; operation: 'refresh'}
  | {code: 'failure'; operation: ParticipationMutation; phase: 'mutation' | 'create'; failure: 'resolved' | 'thrown'; error: ParticipationError; refreshError?: ParticipationError}
  | {code: 'partial_success'; operation: 'create_and_suggest'; musicId: string; error: ParticipationError; refreshError?: ParticipationError}
  | {code: 'refresh_failure'; operation: ParticipationMutation | 'refresh'; error: ParticipationError}
  | {code: 'duplicate_pending'; operation: ParticipationMutation}
  | {code: 'share_success'; method: 'copy' | 'instagram' | 'whatsapp' | 'native'}
  | {code: 'share_failure'; method: 'copy' | 'instagram' | 'whatsapp' | 'native'}

export interface JamParticipationState {
  eligiblePerformances: readonly Performance[]
  selectedPerformanceId: string | null
  selectedPerformance: Performance | null
  activeOverlay: ParticipationOverlay
  authRequired: {intent: ParticipationIntent; redirect: string} | null
  pendingOperation: ParticipationMutation | null
  retryMusicId: string | null
  feedback: ParticipationFeedback | null
  shareCapability: {native: boolean}
  latestOutcome: JamParticipationOutcome | null
}

export interface JamParticipationController {
  getSnapshot(): JamParticipationState
  subscribe(listener: () => void): () => void
  commands: {
    replaceContext(context: JamParticipationContext): void
    beginRegistration(performanceId?: string): JamParticipationOutcome
    choosePerformance(performanceId: string): JamParticipationOutcome
    beginSuggestion(): JamParticipationOutcome
    beginNewMusic(): void
    beginShare(): void
    closeOverlay(): void
    register(instrument: string): Promise<JamParticipationOutcome>
    suggestMusic(musicId: string): Promise<JamParticipationOutcome>
    createAndSuggestMusic(data: CreateMusicDto): Promise<JamParticipationOutcome>
    refresh(): Promise<JamParticipationOutcome>
    shareCopy(text: string, method?: 'copy' | 'instagram'): Promise<JamParticipationOutcome>
    shareWhatsApp(input: {url: string; message: string}): JamParticipationOutcome
    shareNative(input: {title: string; url: string}): Promise<JamParticipationOutcome>
  }
  dispose(): void
}

const browserClock: ParticipationClockPort = {
  schedule(delayMs, callback) {
    const handle = setTimeout(callback, delayMs)
    return () => clearTimeout(handle)
  },
}

function isEligible(performance: Performance, context: JamParticipationContext): boolean {
  if (!context.participationOpen || performance.status !== 'SCHEDULED') return false
  return true
}

function errorFrom(cause: unknown): ParticipationError {
  if (cause instanceof Error) return {message: cause.message}
  if (typeof cause === 'string' && cause) return {message: cause}
  return {message: '', reason: 'unknown'}
}

export function createJamParticipationController(
  initialContext: JamParticipationContext,
  adapters: {operations?: JamParticipationOperationsPort; clock?: ParticipationClockPort; share?: ParticipationSharePort} = {},
): JamParticipationController {
  const {operations, clock = browserClock, share} = adapters
  let context = initialContext
  let selectedPerformanceId: string | null = null
  let activeOverlay: ParticipationOverlay = 'none'
  let authRequired: JamParticipationState['authRequired'] = null
  let pendingOperation: ParticipationMutation | null = null
  let retryMusicId: string | null = null
  let retryLinkRequired = false
  let feedback: ParticipationFeedback | null = null
  let latestOutcome: JamParticipationOutcome | null = null
  let cancelFeedback: (() => void) | undefined
  let state: JamParticipationState
  let disposed = false
  const listeners = new Set<() => void>()

  const project = (notify = true) => {
    const eligiblePerformances = context.performances.filter((performance) => isEligible(performance, context))
    const selectedPerformance = context.performances.find(({id}) => id === selectedPerformanceId) ?? null
    if (selectedPerformanceId && !selectedPerformance) {
      selectedPerformanceId = null
      if (activeOverlay === 'enrollment') activeOverlay = 'none'
    }
    state = {
      eligiblePerformances, selectedPerformanceId, selectedPerformance, activeOverlay, authRequired,
      pendingOperation, retryMusicId, feedback,
      shareCapability: {native: share?.canNativeShare() ?? false}, latestOutcome,
    }
    if (notify && !disposed) listeners.forEach((listener) => listener())
  }
  project(false)

  const setFeedback = (nextFeedback: ParticipationFeedback) => {
    cancelFeedback?.()
    feedback = nextFeedback
    cancelFeedback = clock.schedule(3000, () => {
      feedback = null
      cancelFeedback = undefined
      project()
    })
  }

  const refreshContext = async (): Promise<ParticipationError | undefined> => {
    if (!operations) return {message: '', reason: 'unknown'}
    try {
      const refreshed = await operations.refresh()
      if (!refreshed.ok) return refreshed.error
      context = refreshed.context
      return undefined
    } catch (cause) {
      return errorFrom(cause)
    }
  }

  const requireAuth = (intent: ParticipationIntent): JamParticipationOutcome | undefined => {
    if (context.isAuthenticated) return undefined
    const redirect = `/jams/${context.jamId}`
    authRequired = {intent, redirect}
    activeOverlay = 'none'
    latestOutcome = {code: 'auth_required', intent, redirect}
    project()
    return latestOutcome
  }

  const unavailable = (intent: ParticipationIntent | 'share'): JamParticipationOutcome => {
    latestOutcome = {code: 'unavailable', intent}
    project()
    return latestOutcome
  }

  const runMutation = async ({operation, entityId, mutate, successFeedback}: {
    operation: 'registration' | 'suggestion'
    entityId: string
    mutate: () => Promise<ParticipationMutationResult>
    successFeedback: ParticipationFeedback
  }): Promise<JamParticipationOutcome> => {
    if (pendingOperation) {
      latestOutcome = {code: 'duplicate_pending', operation}
      project()
      return latestOutcome
    }
    if (!operations) return unavailable(operation)
    pendingOperation = operation
    project()
    try {
      let mutation: ParticipationMutationResult
      try {
        mutation = await mutate()
      } catch (cause) {
        const refreshError = await refreshContext()
        latestOutcome = {code: 'failure', operation, phase: 'mutation', failure: 'thrown', error: errorFrom(cause), ...(refreshError ? {refreshError} : {})}
        return latestOutcome
      }
      if (!mutation.ok) {
        latestOutcome = {code: 'failure', operation, phase: 'mutation', failure: 'resolved', error: mutation.error}
        return latestOutcome
      }
      const refreshError = await refreshContext()
      if (refreshError) {
        latestOutcome = {code: 'refresh_failure', operation, error: refreshError}
        return latestOutcome
      }
      activeOverlay = 'none'
      selectedPerformanceId = null
      setFeedback(successFeedback)
      latestOutcome = {code: 'success', operation, entityId}
      return latestOutcome
    } finally {
      pendingOperation = null
      project()
    }
  }

  const commands: JamParticipationController['commands'] = {
    replaceContext(nextContext) { context = nextContext; project() },
    beginRegistration(performanceId) {
      const authOutcome = requireAuth('registration')
      if (authOutcome) return authOutcome
      const eligible = context.performances.filter((performance) => isEligible(performance, context))
      if (performanceId) return commands.choosePerformance(performanceId)
      if (eligible.length === 0) return unavailable('registration')
      if (eligible.length > 1) {
        selectedPerformanceId = null
        activeOverlay = 'performance_picker'
        latestOutcome = {code: 'choose_performance', eligibleIds: eligible.map(({id}) => id)}
        project()
        return latestOutcome
      }
      return commands.choosePerformance(eligible[0].id)
    },
    choosePerformance(performanceId) {
      const authOutcome = requireAuth('registration')
      if (authOutcome) return authOutcome
      const performance = context.performances.find(({id}) => id === performanceId)
      if (!performance || !isEligible(performance, context)) return unavailable('registration')
      selectedPerformanceId = performanceId
      activeOverlay = 'enrollment'
      authRequired = null
      latestOutcome = {code: 'ready', intent: 'registration', performanceId}
      project()
      return latestOutcome
    },
    beginSuggestion() {
      const authOutcome = requireAuth('suggestion')
      if (authOutcome) return authOutcome
      activeOverlay = 'suggestion'
      authRequired = null
      latestOutcome = {code: 'ready', intent: 'suggestion'}
      project()
      return latestOutcome
    },
    beginNewMusic() { activeOverlay = 'new_music'; project() },
    beginShare() { activeOverlay = 'share'; project() },
    closeOverlay() {
      if (activeOverlay === 'new_music') {
        retryMusicId = null
        retryLinkRequired = false
      }
      activeOverlay = 'none'; selectedPerformanceId = null; authRequired = null; project()
    },
    register(instrument) {
      if (!selectedPerformanceId || !context.musicianId) return Promise.resolve(unavailable('registration'))
      const performanceId = selectedPerformanceId
      return runMutation({
        operation: 'registration', entityId: performanceId, successFeedback: 'registration_success',
        mutate: () => operations!.register({musicianId: context.musicianId!, performanceId, instrument}),
      })
    },
    suggestMusic(musicId) {
      const authOutcome = requireAuth('suggestion')
      if (authOutcome) return Promise.resolve(authOutcome)
      return runMutation({
        operation: 'suggestion', entityId: musicId, successFeedback: 'suggestion_success',
        mutate: () => operations!.suggest({jamId: context.jamId, musicId}),
      })
    },
    async createAndSuggestMusic(data) {
      const authOutcome = requireAuth('suggestion')
      if (authOutcome) return authOutcome
      if (pendingOperation) {
        latestOutcome = {code: 'duplicate_pending', operation: 'create_and_suggest'}
        project()
        return latestOutcome
      }
      if (!operations) return unavailable('suggestion')
      pendingOperation = 'create_and_suggest'
      project()
      try {
        let musicId = retryMusicId
        let shouldLink = retryLinkRequired
        if (!musicId) {
          try {
            const created = await operations.createMusic(data)
            if (!created.ok) {
              latestOutcome = {code: 'failure', operation: 'create_and_suggest', phase: 'create', failure: 'resolved', error: created.error}
              return latestOutcome
            }
            musicId = created.musicId
            shouldLink = true
          } catch (cause) {
            const refreshError = await refreshContext()
            latestOutcome = {code: 'failure', operation: 'create_and_suggest', phase: 'create', failure: 'thrown', error: errorFrom(cause), ...(refreshError ? {refreshError} : {})}
            return latestOutcome
          }
        }

        if (shouldLink) {
          let linked: ParticipationMutationResult
          try {
            linked = await operations.suggest({jamId: context.jamId, musicId})
          } catch (cause) {
            retryMusicId = musicId
            retryLinkRequired = true
            const refreshError = await refreshContext()
            latestOutcome = {code: 'partial_success', operation: 'create_and_suggest', musicId, error: errorFrom(cause), ...(refreshError ? {refreshError} : {})}
            return latestOutcome
          }
          if (!linked.ok) {
            retryMusicId = musicId
            retryLinkRequired = true
            const refreshError = await refreshContext()
            latestOutcome = {code: 'partial_success', operation: 'create_and_suggest', musicId, error: linked.error, ...(refreshError ? {refreshError} : {})}
            return latestOutcome
          }
          retryMusicId = musicId
          retryLinkRequired = false
        }
        const refreshError = await refreshContext()
        if (refreshError) {
          latestOutcome = {code: 'refresh_failure', operation: 'create_and_suggest', error: refreshError}
          return latestOutcome
        }
        retryMusicId = null
        retryLinkRequired = false
        activeOverlay = 'none'
        setFeedback('new_music_success')
        latestOutcome = {code: 'success', operation: 'create_and_suggest', entityId: musicId}
        return latestOutcome
      } finally {
        pendingOperation = null
        project()
      }
    },
    async refresh() {
      const error = await refreshContext()
      latestOutcome = error ? {code: 'refresh_failure', operation: 'refresh', error} : {code: 'success', operation: 'refresh'}
      project()
      return latestOutcome
    },
    async shareCopy(text, method = 'copy') {
      if (!share) return unavailable('share')
      let ok = false
      try { ok = await share.copy(text) } catch { /* normalized below */ }
      latestOutcome = ok ? {code: 'share_success', method} : {code: 'share_failure', method}
      project()
      return latestOutcome
    },
    shareWhatsApp(input) {
      if (!share) return unavailable('share')
      try {
        share.whatsapp(input)
        latestOutcome = {code: 'share_success', method: 'whatsapp'}
      } catch {
        latestOutcome = {code: 'share_failure', method: 'whatsapp'}
      }
      project()
      return latestOutcome
    },
    async shareNative(input) {
      if (!share || !share.canNativeShare()) return unavailable('share')
      let ok = false
      try { ok = await share.native(input) } catch { /* normalized below */ }
      latestOutcome = ok ? {code: 'share_success', method: 'native'} : {code: 'share_failure', method: 'native'}
      project()
      return latestOutcome
    },
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    commands,
    dispose() { disposed = true; cancelFeedback?.(); listeners.clear() },
  }
}
