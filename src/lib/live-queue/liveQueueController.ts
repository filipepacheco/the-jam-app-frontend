export interface LiveQueuePerformance {
  id: string
  order: number
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'SUGGESTED'
  startedAt?: string | null
  completedAt?: string | null
  pausedAt?: string | null
  music: {
    title: string
    artist: string
    duration?: number | null
    neededDrums?: number
    neededGuitars?: number
    neededVocals?: number
    neededBass?: number
    neededKeys?: number
  }
  musicians: readonly {id: string; name: string | null; instrument: string}[]
}

export interface LiveQueueSnapshot {
  jamId: string
  queueRevision?: string
  resumeFromQueue?: boolean
  allPerformances?: readonly LiveQueuePerformance[]
  currentPerformance: LiveQueuePerformance | null
  upcomingPerformances: readonly LiveQueuePerformance[]
  previousPerformances: readonly LiveQueuePerformance[]
  suggestedPerformances: readonly LiveQueuePerformance[]
  jamStatus: 'ACTIVE' | 'INACTIVE' | 'FINISHED'
  playbackState: 'STOPPED' | 'PLAYING' | 'PAUSED'
}

export interface LiveQueueFailure {
  message: string
  status?: number
}

export type LiveQueueMutationResult = {ok: true} | {ok: false; error: LiveQueueFailure}
export type LiveQueueRefreshResult =
  | {ok: true; snapshot: LiveQueueSnapshot}
  | {ok: false; error: LiveQueueFailure}

export interface LiveQueueOperationsPort {
  reorder(input: {
    jamId: string
    performances: readonly LiveQueuePerformance[]
    expectedRevision?: string
  }, signal?: AbortSignal): Promise<LiveQueueMutationResult>
  refresh(jamId: string, signal?: AbortSignal): Promise<LiveQueueRefreshResult>
}

export interface LiveQueueTimerPort {
  schedule(delayMs: number, callback: () => void): () => void
}

export type LiveQueueOutcome =
  | {code: 'success'; operation: 'save_reorder'}
  | {code: 'cancelled'; operation: 'reorder_session' | 'save_reorder'}
  | {code: 'duplicate_pending'; operation: 'save_reorder'}
  | {
      code: 'conflict'
      operation: 'save_reorder'
      startingFingerprint: string
      latestFingerprint: string
    }
  | {
      code: 'failure'
      operation: 'save_reorder'
      failure: 'resolved' | 'thrown'
      error: LiveQueueFailure
    }
  | {code: 'refresh_failure'; operation: 'save_reorder'; error: LiveQueueFailure}

export interface LiveQueueState {
  server: LiveQueueSnapshot
  draftPerformances: readonly LiveQueuePerformance[]
  session: {status: 'idle'} | {
    status: 'editing'
    startingSnapshot: LiveQueueSnapshot
    startingFingerprint: string
  }
  persistence: {status: 'idle' | 'debouncing' | 'saving'}
  input: {mode: 'idle'} | {
    mode: 'mouse' | 'touch' | 'keyboard'
    performanceId: string
    targetIndex: number
  }
  conflict: null | {
    status: 'detected'
    startingFingerprint: string
    latestFingerprint: string
  }
  latestOutcome: LiveQueueOutcome | null
}

export interface LiveQueueController {
  getSnapshot(): LiveQueueState
  subscribe(listener: () => void): () => void
  commands: {
    replaceServerSnapshot(snapshot: LiveQueueSnapshot): void
    beginReorder(): void
    movePerformance(performanceId: string, targetIndex: number): void
    beginMove(input: {mode: 'mouse' | 'touch' | 'keyboard'; performanceId: string}): void
    updateMoveTarget(targetIndex: number): void
    commitMove(): void
    cancelMove(): void
    cancelReorder(): LiveQueueOutcome
    saveReorder(): Promise<LiveQueueOutcome>
  }
  dispose(): void
}

function normalizeSnapshot(snapshot: LiveQueueSnapshot): LiveQueueSnapshot {
  return {
    ...snapshot,
    upcomingPerformances: [...snapshot.upcomingPerformances].sort((left, right) => left.order - right.order),
    previousPerformances: [...snapshot.previousPerformances].sort((left, right) => left.order - right.order),
    suggestedPerformances: [...snapshot.suggestedPerformances].sort((left, right) => left.order - right.order),
  }
}

/** The order editor owns the whole Schedule, independently of playback groups. */
export function orderedPerformances(snapshot: LiveQueueSnapshot): LiveQueuePerformance[] {
  const performances = snapshot.allPerformances ?? [
    ...snapshot.previousPerformances,
    ...(snapshot.currentPerformance ? [snapshot.currentPerformance] : []),
    ...snapshot.upcomingPerformances,
    ...snapshot.suggestedPerformances,
  ]
  return [...new Map(performances.map((performance) => [performance.id, performance])).values()]
    .sort((left, right) => left.order - right.order)
}

export function isPerformanceLocked(snapshot: LiveQueueSnapshot, id: string): boolean {
  return snapshot.playbackState === 'PLAYING' && snapshot.currentPerformance?.id === id
}

export function fingerprintQueue(performances: readonly LiveQueuePerformance[]): string {
  return JSON.stringify(performances.map(({id, order, status}) => [id, order, status]))
}

function fingerprintSnapshot(snapshot: LiveQueueSnapshot): string {
  return JSON.stringify([
    snapshot.queueRevision,
    snapshot.playbackState,
    snapshot.currentPerformance?.id,
    fingerprintQueue(orderedPerformances(snapshot)),
  ])
}

const browserTimer: LiveQueueTimerPort = {
  schedule(delayMs, callback) {
    const handle = setTimeout(callback, delayMs)
    return () => clearTimeout(handle)
  },
}

export function createLiveQueueController({
  initialSnapshot,
  operations,
  timer = browserTimer,
}: {
  initialSnapshot: LiveQueueSnapshot
  operations?: LiveQueueOperationsPort
  timer?: LiveQueueTimerPort
}): LiveQueueController {
  let server = normalizeSnapshot(initialSnapshot)
  let draftPerformances = orderedPerformances(server)
  let session: LiveQueueState['session'] = {status: 'idle'}
  let conflict: LiveQueueState['conflict'] = null
  let latestOutcome: LiveQueueOutcome | null = null
  let persistenceStatus: LiveQueueState['persistence']['status'] = 'idle'
  let input: LiveQueueState['input'] = {mode: 'idle'}
  let pendingSave: {
    cancel: () => void
    resolve: (outcome: LiveQueueOutcome) => void
  } | null = null
  let activeSaveAbort: AbortController | null = null
  let disposed = false
  let state: LiveQueueState
  const listeners = new Set<() => void>()

  const project = (notify = true) => {
    state = {
      server,
      draftPerformances,
      session,
      persistence: {status: persistenceStatus},
      input,
      conflict,
      latestOutcome,
    }
    if (notify && !disposed) listeners.forEach((listener) => listener())
  }

  const movePerformance = (performanceId: string, targetIndex: number) => {
    if (session.status !== 'editing' || persistenceStatus !== 'idle') return
    const sourceIndex = draftPerformances.findIndex(({id}) => id === performanceId)
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= draftPerformances.length) return
    if (isPerformanceLocked(server, performanceId)) return
    if (isPerformanceLocked(server, draftPerformances[targetIndex].id)) {
      targetIndex += Math.sign(targetIndex - sourceIndex)
      if (targetIndex < 0 || targetIndex >= draftPerformances.length) return
    }
    // Reorder the movable entries across their existing slots. The active
    // Performance stays at its saved position even when a move crosses it.
    const positions = draftPerformances.filter(({id}) => !isPerformanceLocked(server, id))
      .map(({order}) => order).sort((left, right) => left - right)
    const reordered = [...draftPerformances]
    const [moved] = reordered.splice(sourceIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    let positionIndex = 0
    draftPerformances = reordered.map((performance) => isPerformanceLocked(server, performance.id)
      ? performance
      : {...performance, order: positions[positionIndex++]})
      .sort((left, right) => left.order - right.order)
  }

  const commands: LiveQueueController['commands'] = {
    replaceServerSnapshot(snapshot) {
      server = normalizeSnapshot(snapshot)
      if (session.status === 'idle') {
        draftPerformances = orderedPerformances(server)
        conflict = null
      } else {
        const latestFingerprint = fingerprintSnapshot(server)
        conflict = latestFingerprint === session.startingFingerprint
          ? null
          : {
              status: 'detected',
              startingFingerprint: session.startingFingerprint,
              latestFingerprint,
            }
      }
      project()
    },
    beginReorder() {
      if (persistenceStatus !== 'idle') return
      const startingSnapshot = normalizeSnapshot(server)
      session = {
        status: 'editing',
        startingSnapshot,
        startingFingerprint: fingerprintSnapshot(startingSnapshot),
      }
      draftPerformances = orderedPerformances(startingSnapshot)
      conflict = null
      input = {mode: 'idle'}
      project()
    },
    movePerformance(performanceId, targetIndex) {
      movePerformance(performanceId, targetIndex)
      project()
    },
    beginMove({mode, performanceId}) {
      if (session.status !== 'editing' || persistenceStatus !== 'idle') return
      const sourceIndex = draftPerformances.findIndex(({id}) => id === performanceId)
      if (sourceIndex < 0 || isPerformanceLocked(server, performanceId)) return
      input = {mode, performanceId, targetIndex: sourceIndex}
      project()
    },
    updateMoveTarget(targetIndex) {
      if (input.mode === 'idle' || targetIndex < 0 || targetIndex >= draftPerformances.length) return
      input = {...input, targetIndex}
      project()
    },
    commitMove() {
      if (input.mode === 'idle') return
      movePerformance(input.performanceId, input.targetIndex)
      input = {mode: 'idle'}
      project()
    },
    cancelMove() {
      input = {mode: 'idle'}
      project()
    },
    cancelReorder() {
      if (persistenceStatus !== 'idle') return {code: 'duplicate_pending', operation: 'save_reorder'}
      draftPerformances = orderedPerformances(server)
      session = {status: 'idle'}
      conflict = null
      input = {mode: 'idle'}
      latestOutcome = {code: 'cancelled', operation: 'reorder_session'}
      project()
      return latestOutcome
    },
    saveReorder() {
      if (session.status !== 'editing') {
        return Promise.reject(new Error('Cannot save outside a reorder session'))
      }
      if (persistenceStatus !== 'idle') {
        latestOutcome = {code: 'duplicate_pending', operation: 'save_reorder'}
        project()
        return Promise.resolve(latestOutcome)
      }
      const latestFingerprint = fingerprintSnapshot(server)
      if (latestFingerprint !== session.startingFingerprint) {
        conflict = {
          status: 'detected',
          startingFingerprint: session.startingFingerprint,
          latestFingerprint,
        }
        latestOutcome = {
          code: 'conflict',
          operation: 'save_reorder',
          startingFingerprint: session.startingFingerprint,
          latestFingerprint,
        }
        project()
        return Promise.resolve(latestOutcome)
      }

      const startingSnapshot = session.startingSnapshot
      persistenceStatus = 'debouncing'
      project()

      return new Promise<LiveQueueOutcome>((resolve) => {
        const cancel = timer.schedule(300, () => {
          void (async () => {
            const latestFingerprint = fingerprintSnapshot(server)
            const startingFingerprint = fingerprintSnapshot(startingSnapshot)
            if (latestFingerprint !== startingFingerprint) {
              persistenceStatus = 'idle'
              conflict = {status: 'detected', startingFingerprint, latestFingerprint}
              latestOutcome = {
                code: 'conflict',
                operation: 'save_reorder',
                startingFingerprint,
                latestFingerprint,
              }
              project()
              pendingSave = null
              resolve(latestOutcome)
              return
            }
            persistenceStatus = 'saving'
            project()
            const abort = new AbortController()
            activeSaveAbort = abort
            let mutation: LiveQueueMutationResult
            try {
              mutation = operations
                ? await operations.reorder({jamId: server.jamId, performances: draftPerformances, expectedRevision: startingSnapshot.queueRevision}, abort.signal)
                : {ok: false, error: {message: 'Live Queue operations adapter is required'}}
            } catch (cause) {
              if (disposed || abort.signal.aborted) return
              draftPerformances = orderedPerformances(server)
              session = {status: 'idle'}
              conflict = null
              persistenceStatus = 'idle'
              latestOutcome = {
                code: 'failure',
                operation: 'save_reorder',
                failure: 'thrown',
                error: {message: cause instanceof Error ? cause.message : 'Unknown reorder error'},
              }
              project()
              activeSaveAbort = null
              pendingSave = null
              resolve(latestOutcome)
              return
            }

            if (disposed || abort.signal.aborted) return

            if (!mutation.ok) {
              draftPerformances = orderedPerformances(server)
              session = {status: 'idle'}
              conflict = null
              persistenceStatus = 'idle'
              latestOutcome = mutation.error.status === 409
                ? {code: 'conflict', operation: 'save_reorder', startingFingerprint: fingerprintSnapshot(startingSnapshot), latestFingerprint: fingerprintSnapshot(server)}
                : {code: 'failure', operation: 'save_reorder', failure: 'resolved', error: mutation.error}
              project()
              activeSaveAbort = null
              pendingSave = null
              resolve(latestOutcome)
              return
            }

            let refreshed: LiveQueueRefreshResult
            try {
              refreshed = await operations!.refresh(server.jamId, abort.signal)
            } catch (cause) {
              if (disposed || abort.signal.aborted) return
              refreshed = {
                ok: false,
                error: {message: cause instanceof Error ? cause.message : 'Unknown refresh error'},
              }
            }
            if (disposed || abort.signal.aborted) return
            if (!refreshed.ok) {
              session = {status: 'idle'}
              conflict = null
              persistenceStatus = 'idle'
              latestOutcome = {
                code: 'refresh_failure',
                operation: 'save_reorder',
                error: refreshed.error,
              }
              project()
              activeSaveAbort = null
              pendingSave = null
              resolve(latestOutcome)
              return
            }

            server = normalizeSnapshot(refreshed.snapshot)
            draftPerformances = orderedPerformances(server)
            session = {status: 'idle'}
            conflict = null
            persistenceStatus = 'idle'
            latestOutcome = {code: 'success', operation: 'save_reorder'}
            project()
            activeSaveAbort = null
            pendingSave = null
            resolve(latestOutcome)
          })()
        })
        pendingSave = {cancel, resolve}
      })
    },
  }

  project(false)

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    commands,
    dispose() {
      disposed = true
      activeSaveAbort?.abort()
      activeSaveAbort = null
      if (pendingSave) {
        pendingSave.cancel()
        pendingSave.resolve({code: 'cancelled', operation: 'save_reorder'})
        pendingSave = null
      }
      listeners.clear()
    },
  }
}
