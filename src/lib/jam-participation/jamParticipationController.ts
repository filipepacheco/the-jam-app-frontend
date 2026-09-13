import type {Performance} from '../schedule/hostScheduleController'

export type ParticipationOverlay = 'none' | 'performance_picker' | 'enrollment' | 'suggestion' | 'new_music' | 'share'
export type ParticipationIntent = 'registration' | 'suggestion'

export interface JamParticipationContext {
  jamId: string
  participationOpen: boolean
  isAuthenticated: boolean
  musicianId: string | null
  performances: readonly Performance[]
}

export type JamParticipationOutcome =
  | {code: 'ready'; intent: 'registration'; performanceId: string}
  | {code: 'ready'; intent: 'suggestion'}
  | {code: 'choose_performance'; eligibleIds: string[]}
  | {code: 'auth_required'; intent: ParticipationIntent; redirect: string}
  | {code: 'unavailable'; intent: ParticipationIntent}

export interface JamParticipationState {
  eligiblePerformances: readonly Performance[]
  selectedPerformanceId: string | null
  selectedPerformance: Performance | null
  activeOverlay: ParticipationOverlay
  authRequired: {intent: ParticipationIntent; redirect: string} | null
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
  }
  dispose(): void
}

function isEligible(performance: Performance, context: JamParticipationContext): boolean {
  if (!context.participationOpen || performance.status !== 'SCHEDULED') return false
  if (!context.musicianId) return true
  return !performance.registrations.some(({musicianId, musician}) => (
    musicianId === context.musicianId || musician?.id === context.musicianId
  ))
}

export function createJamParticipationController(initialContext: JamParticipationContext): JamParticipationController {
  let context = initialContext
  let selectedPerformanceId: string | null = null
  let activeOverlay: ParticipationOverlay = 'none'
  let authRequired: JamParticipationState['authRequired'] = null
  let latestOutcome: JamParticipationOutcome | null = null
  let state: JamParticipationState
  const listeners = new Set<() => void>()

  const project = (notify = true) => {
    const eligiblePerformances = context.performances.filter((performance) => isEligible(performance, context))
    const selectedPerformance = eligiblePerformances.find(({id}) => id === selectedPerformanceId) ?? null
    if (selectedPerformanceId && !selectedPerformance) {
      selectedPerformanceId = null
      if (activeOverlay === 'enrollment') activeOverlay = 'none'
    }
    state = {eligiblePerformances, selectedPerformanceId, selectedPerformance, activeOverlay, authRequired, latestOutcome}
    if (notify) listeners.forEach((listener) => listener())
  }
  project(false)

  const requireAuth = (intent: ParticipationIntent): JamParticipationOutcome | undefined => {
    if (context.isAuthenticated) return undefined
    const redirect = `/jams/${context.jamId}`
    authRequired = {intent, redirect}
    activeOverlay = 'none'
    latestOutcome = {code: 'auth_required', intent, redirect}
    project()
    return latestOutcome
  }

  const unavailable = (intent: ParticipationIntent): JamParticipationOutcome => {
    latestOutcome = {code: 'unavailable', intent}
    project()
    return latestOutcome
  }

  const commands: JamParticipationController['commands'] = {
    replaceContext(nextContext) {
      context = nextContext
      project()
    },
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
      activeOverlay = 'none'
      selectedPerformanceId = null
      authRequired = null
      project()
    },
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    commands,
    dispose() { listeners.clear() },
  }
}
