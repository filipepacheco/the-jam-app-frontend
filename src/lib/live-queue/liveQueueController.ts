export interface LiveQueuePerformance {
  id: string
  order: number
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'SUGGESTED'
  startedAt?: string | null
  completedAt?: string | null
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
  currentPerformance: LiveQueuePerformance | null
  upcomingPerformances: readonly LiveQueuePerformance[]
  previousPerformances: readonly LiveQueuePerformance[]
  suggestedPerformances: readonly LiveQueuePerformance[]
  jamStatus: 'ACTIVE' | 'INACTIVE' | 'FINISHED'
  playbackState: 'STOPPED' | 'PLAYING' | 'PAUSED'
}

export interface LiveQueueFailure {
  message: string
}

export type LiveQueueMutationResult = {ok: true} | {ok: false; error: LiveQueueFailure}
export type LiveQueueRefreshResult =
  | {ok: true; snapshot: LiveQueueSnapshot}
  | {ok: false; error: LiveQueueFailure}

export interface LiveQueueOperationsPort {
  reorder(input: {
    jamId: string
    performances: readonly LiveQueuePerformance[]
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

/**
 * Fingerprints detect a changed poll before persistence, but they are not an
 * atomic compare-and-swap. A server revision token is still required to close
 * the race between this client-side check and the reorder request.
 */
export function fingerprintQueue(performances: readonly LiveQueuePerformance[]): string {
  return JSON.stringify(performances.map(({id}) => id))
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
  let draftPerformances = [...server.upcomingPerformances]
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
    const reordered = [...draftPerformances]
    const [moved] = reordered.splice(sourceIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    const baseOrder = Math.min(...reordered.map(({order}) => order))
    draftPerformances = reordered.map((performance, index) => ({
      ...performance,
      order: baseOrder + index,
    }))
  }

  const commands: LiveQueueController['commands'] = {
    replaceServerSnapshot(snapshot) {
      server = normalizeSnapshot(snapshot)
      if (session.status === 'idle') {
        draftPerformances = [...server.upcomingPerformances]
        conflict = null
      } else {
        const latestFingerprint = fingerprintQueue(server.upcomingPerformances)
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
        startingFingerprint: fingerprintQueue(startingSnapshot.upcomingPerformances),
      }
      draftPerformances = [...startingSnapshot.upcomingPerformances]
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
      if (sourceIndex < 0) return
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
      draftPerformances = [...server.upcomingPerformances]
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
      const latestFingerprint = fingerprintQueue(server.upcomingPerformances)
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
            const latestFingerprint = fingerprintQueue(server.upcomingPerformances)
            const startingFingerprint = fingerprintQueue(startingSnapshot.upcomingPerformances)
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
                ? await operations.reorder({jamId: server.jamId, performances: draftPerformances}, abort.signal)
                : {ok: false, error: {message: 'Live Queue operations adapter is required'}}
            } catch (cause) {
              if (disposed || abort.signal.aborted) return
              server = startingSnapshot
              draftPerformances = [...startingSnapshot.upcomingPerformances]
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
              server = startingSnapshot
              draftPerformances = [...startingSnapshot.upcomingPerformances]
              session = {status: 'idle'}
              conflict = null
              persistenceStatus = 'idle'
              latestOutcome = {
                code: 'failure',
                operation: 'save_reorder',
                failure: 'resolved',
                error: mutation.error,
              }
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
            draftPerformances = [...server.upcomingPerformances]
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
