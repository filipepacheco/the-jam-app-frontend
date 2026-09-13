import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type DragEvent,
  type KeyboardEvent,
} from 'react'
import {createLiveQueueOperationsAdapter} from '../lib/live-queue/liveQueueAdapters'
import {
  createLiveQueueController,
  type LiveQueueController,
  type LiveQueueOperationsPort,
  type LiveQueueState,
  type LiveQueueTimerPort,
} from '../lib/live-queue/liveQueueController'
import {mapLiveStateToLiveQueueSnapshot} from '../lib/live-queue/liveQueueAdapters'
import {useJamControl} from './useJamControl'

interface UseLiveQueueControllerOptions {
  operations?: LiveQueueOperationsPort
  timer?: LiveQueueTimerPort
}

function emptySnapshot(jamId: string) {
  return {
    jamId,
    currentPerformance: null,
    upcomingPerformances: [],
    previousPerformances: [],
    suggestedPerformances: [],
    jamStatus: 'INACTIVE' as const,
    playbackState: 'STOPPED' as const,
  }
}

function useLiveQueueInteractions(controller: LiveQueueController, state: LiveQueueState) {
  const stateRef = useRef(state)
  stateRef.current = state
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const surfaceCleanupRef = useRef<(() => void) | null>(null)
  const autoScrollFrameRef = useRef<number | null>(null)
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTouchYRef = useRef(0)
  const touchPerformanceIdRef = useRef<string | null>(null)

  const stopAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current)
      autoScrollFrameRef.current = null
    }
  }, [])

  const startAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current !== null) return
    const edgeZone = 80
    const maxSpeed = 16
    const tick = () => {
      if (touchPerformanceIdRef.current === null) {
        autoScrollFrameRef.current = null
        return
      }
      const y = lastTouchYRef.current
      const viewportHeight = window.innerHeight
      let speed = 0
      if (y < edgeZone) speed = -maxSpeed * (1 - y / edgeZone)
      else if (y > viewportHeight - edgeZone) {
        speed = maxSpeed * (1 - (viewportHeight - y) / edgeZone)
      }
      if (speed === 0) {
        autoScrollFrameRef.current = null
        return
      }
      const previousBehavior = document.documentElement.style.scrollBehavior
      document.documentElement.style.scrollBehavior = 'auto'
      window.scrollBy(0, speed)
      document.documentElement.style.scrollBehavior = previousBehavior
      autoScrollFrameRef.current = requestAnimationFrame(tick)
    }
    autoScrollFrameRef.current = requestAnimationFrame(tick)
  }, [])

  const targetIndexAt = useCallback((clientY: number, performanceId: string) => {
    const performances = stateRef.current.draftPerformances
    let insertionIndex: number | null = null
    performances.forEach((performance, index) => {
      const element = itemRefs.current.get(performance.id)
      if (!element) return
      const rect = element.getBoundingClientRect()
      if (clientY >= rect.top && clientY <= rect.bottom) {
        insertionIndex = clientY < rect.top + rect.height / 2 ? index : index + 1
      }
    })
    if (insertionIndex === null && performances.length > 0) {
      const first = itemRefs.current.get(performances[0].id)
      const last = itemRefs.current.get(performances[performances.length - 1].id)
      if (first && clientY < first.getBoundingClientRect().top) insertionIndex = 0
      else if (last && clientY > last.getBoundingClientRect().bottom) insertionIndex = performances.length
    }
    if (insertionIndex === null) return null
    const sourceIndex = performances.findIndex(({id}) => id === performanceId)
    if (sourceIndex < 0) return null
    const finalIndex = insertionIndex > sourceIndex ? insertionIndex - 1 : insertionIndex
    return Math.max(0, Math.min(performances.length - 1, finalIndex))
  }, [])

  const setSurfaceNode = useCallback((node: HTMLDivElement | null) => {
    surfaceCleanupRef.current?.()
    surfaceCleanupRef.current = null
    if (!node) return

    const resetTouch = () => {
      stopAutoScroll()
      node.removeEventListener('touchmove', onTouchMove)
      touchPerformanceIdRef.current = null
      controller.commands.cancelMove()
    }
    const onTouchMove = (event: TouchEvent) => {
      const performanceId = touchPerformanceIdRef.current
      const touch = event.touches[0]
      if (!performanceId || !touch) return
      event.preventDefault()
      lastTouchYRef.current = touch.clientY
      const targetIndex = targetIndexAt(touch.clientY, performanceId)
      if (targetIndex !== null) controller.commands.updateMoveTarget(targetIndex)
      startAutoScroll()
    }
    const onTouchStart = (event: TouchEvent) => {
      const current = stateRef.current
      if (current.session.status !== 'editing' || current.persistence.status !== 'idle') return
      const target = event.target as HTMLElement | null
      const item = target?.closest('[data-performance-id]') as HTMLElement | null
      const performanceId = item?.dataset.performanceId
      if (!performanceId) return
      touchPerformanceIdRef.current = performanceId
      controller.commands.beginMove({mode: 'touch', performanceId})
      node.addEventListener('touchmove', onTouchMove, {passive: false})
      navigator.vibrate?.(30)
    }
    const onTouchEnd = () => {
      stopAutoScroll()
      node.removeEventListener('touchmove', onTouchMove)
      if (touchPerformanceIdRef.current) controller.commands.commitMove()
      touchPerformanceIdRef.current = null
    }

    node.addEventListener('touchstart', onTouchStart, {passive: true})
    node.addEventListener('touchend', onTouchEnd, {passive: true})
    node.addEventListener('touchcancel', resetTouch, {passive: true})
    surfaceCleanupRef.current = () => {
      stopAutoScroll()
      node.removeEventListener('touchstart', onTouchStart)
      node.removeEventListener('touchmove', onTouchMove)
      node.removeEventListener('touchend', onTouchEnd)
      node.removeEventListener('touchcancel', resetTouch)
      if (touchPerformanceIdRef.current) controller.commands.cancelMove()
      touchPerformanceIdRef.current = null
    }
  }, [controller, startAutoScroll, stopAutoScroll, targetIndexAt])

  const setItemNode = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) itemRefs.current.set(id, node)
    else itemRefs.current.delete(id)
  }, [])

  const onDragStart = useCallback((performanceId: string) => {
    controller.commands.beginMove({mode: 'mouse', performanceId})
  }, [controller])

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>, performanceId: string) => {
    event.preventDefault()
    const targetIndex = stateRef.current.draftPerformances.findIndex(({id}) => id === performanceId)
    if (targetIndex >= 0) controller.commands.updateMoveTarget(targetIndex)
  }, [controller])

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>, performanceId: string) => {
    event.preventDefault()
    const targetIndex = stateRef.current.draftPerformances.findIndex(({id}) => id === performanceId)
    if (targetIndex >= 0) controller.commands.updateMoveTarget(targetIndex)
    controller.commands.commitMove()
  }, [controller])

  const onDragEnd = useCallback(() => controller.commands.cancelMove(), [controller])

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>, performanceId: string) => {
    const performances = stateRef.current.draftPerformances
    const sourceIndex = performances.findIndex(({id}) => id === performanceId)
    const delta = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
    const targetIndex = sourceIndex + delta
    if (delta === 0 || targetIndex < 0 || targetIndex >= performances.length) return
    event.preventDefault()
    controller.commands.beginMove({mode: 'keyboard', performanceId})
    controller.commands.updateMoveTarget(targetIndex)
    controller.commands.commitMove()
    if (focusTimerRef.current !== null) clearTimeout(focusTimerRef.current)
    focusTimerRef.current = setTimeout(() => itemRefs.current.get(performanceId)?.focus(), 100)
  }, [controller])

  useEffect(() => () => {
    surfaceCleanupRef.current?.()
    surfaceCleanupRef.current = null
    stopAutoScroll()
    if (focusTimerRef.current !== null) clearTimeout(focusTimerRef.current)
    itemRefs.current.clear()
  }, [stopAutoScroll])

  return {setSurfaceNode, setItemNode, onDragStart, onDragOver, onDrop, onDragEnd, onKeyDown}
}

export function useLiveQueueController(
  jamId: string,
  options: UseLiveQueueControllerOptions = {},
) {
  const {liveState, isLoading, error} = useJamControl(jamId, {
    autoRefreshEnabled: true,
    autoRefreshInterval: 5000,
  })
  const operations = useMemo(
    () => options.operations ?? createLiveQueueOperationsAdapter(),
    [options.operations],
  )
  const controller = useMemo(() => createLiveQueueController({
    initialSnapshot: emptySnapshot(jamId),
    operations,
    timer: options.timer,
  }), [jamId, operations, options.timer])
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
  const interactions = useLiveQueueInteractions(controller, state)

  useEffect(() => {
    if (liveState) controller.commands.replaceServerSnapshot(mapLiveStateToLiveQueueSnapshot(jamId, liveState))
  }, [controller, jamId, liveState])

  useEffect(() => () => controller.dispose(), [controller])

  return {state, commands: controller.commands, interactions, isLoading, error}
}
