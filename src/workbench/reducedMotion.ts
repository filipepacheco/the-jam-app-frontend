const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

let nativeMatchMedia: typeof window.matchMedia | undefined
let simulatedQuery: MediaQueryList | undefined
let reducedMotion = false
const listeners = new Set<Exclude<MediaQueryList['onchange'], null>>()

function createSimulatedQuery(): MediaQueryList {
  return {
    get matches() { return reducedMotion },
    media: REDUCED_MOTION_QUERY,
    onchange: null,
    addListener: (listener) => { if (listener) listeners.add(listener) },
    removeListener: (listener) => { if (listener) listeners.delete(listener) },
    addEventListener: ((type: string, listener: EventListenerOrEventListenerObject | null) => {
      if (type === 'change' && typeof listener === 'function') {
        listeners.add(listener as Exclude<MediaQueryList['onchange'], null>)
      }
    }) as MediaQueryList['addEventListener'],
    removeEventListener: ((type: string, listener: EventListenerOrEventListenerObject | null) => {
      if (type === 'change' && typeof listener === 'function') {
        listeners.delete(listener as Exclude<MediaQueryList['onchange'], null>)
      }
    }) as MediaQueryList['removeEventListener'],
    dispatchEvent: (event) => {
      listeners.forEach((listener) => listener.call(simulatedQuery!, event as MediaQueryListEvent))
      return true
    },
  }
}

export function installReducedMotionPreference(nextValue: boolean): void {
  if (!nativeMatchMedia) {
    nativeMatchMedia = window.matchMedia.bind(window)
    simulatedQuery = createSimulatedQuery()
    window.matchMedia = (query: string) =>
      query === REDUCED_MOTION_QUERY ? simulatedQuery! : nativeMatchMedia!(query)
  }

  if (reducedMotion === nextValue) return
  reducedMotion = nextValue

  const event = new Event('change') as MediaQueryListEvent
  Object.defineProperties(event, {
    matches: { value: reducedMotion },
    media: { value: REDUCED_MOTION_QUERY },
  })
  simulatedQuery?.dispatchEvent(event)
  simulatedQuery?.onchange?.call(simulatedQuery, event)
}

/**
 * Resolves when one-shot cues finish, so an accessibility scan reads settled
 * colors instead of text mid-fade. Ambient loops never finish and are ignored.
 */
export async function waitForMotionToSettle(): Promise<void> {
  const cues = document.getAnimations().filter(animation => animation.effect?.getComputedTiming().endTime !== Infinity)
  await Promise.allSettled(cues.map(animation => animation.finished))
}

export function resetReducedMotionPreference(): void {
  if (nativeMatchMedia) window.matchMedia = nativeMatchMedia
  nativeMatchMedia = undefined
  simulatedQuery = undefined
  reducedMotion = false
  listeners.clear()
}
