/**
 * Live Jam Control Panel Component
 * Host control interface for managing active jam queue
 * Uses live state for real-time performance data
 * Allows queue reordering via toggle-based reorder mode (mouse, touch, keyboard)
 */

import React, {useState, useEffect, useCallback, useMemo} from 'react'
import {GripVertical, Loader2, ArrowUpDown, Check, X} from 'lucide-react'
import type {ScheduleResponseDto, MusicResponseDto, RegistrationResponseDto} from '../../types/api.types'
import type {LiveStateSongDto, LiveStateMusicianDto} from '../../types/jamControl.types'
import {formatDuration} from '../../lib/formatters'
import {getInstrumentIcon} from '../../lib/schedule/instrumentHelpers'
import {useTranslation} from 'react-i18next'
import {normalizeInstrument} from '../../utils/musicianUtils'
import {countActiveRegistrationsByInstrument, CORE_BAND} from '../../utils/scheduleUtils'
import {useJamControl, useQueueReorder} from '../../hooks'

interface LiveJamControlPanelProps {
  jamId: string
  onActionSuccess?: (message: string) => void
  onActionError?: (error: string) => void
}

/**
 * Group musicians by instrument
 */
const groupMusiciansByInstrument = (
  musicians: LiveStateMusicianDto[] | undefined
): Map<string, LiveStateMusicianDto[]> => {
  const grouped = new Map<string, LiveStateMusicianDto[]>()
  if (!musicians) return grouped

  musicians.forEach((m) => {
    if (m.instrument) {
      const normalized = normalizeInstrument(m.instrument)
      if (!grouped.has(normalized)) {
        grouped.set(normalized, [])
      }
      grouped.get(normalized)!.push(m)
    }
  })

  return grouped
}

/**
 * Get the order of instruments for consistent display
 */
const getInstrumentOrder = (instrument: string): number => {
  const order: Record<string, number> = {
    'vocals': 0,
    'drums': 1,
    'guitars': 2,
    'bass': 3,
    'keys': 4,
  }
  return order[instrument] ?? 99
}

/**
 * Convert LiveStateSongDto to ScheduleResponseDto for compatibility with reorder hook.
 * Explicit field mapping - only maps fields used by QueueItem and reorder logic.
 */
const liveSongToSchedule = (song: LiveStateSongDto): ScheduleResponseDto => ({
  id: song.id,
  jamId: '',
  musicId: '',
  order: song.order,
  status: song.status,
  createdAt: '',
  music: {
    title: song.music.title,
    artist: song.music.artist,
    duration: song.music.duration,
    neededDrums: song.music.neededDrums,
    neededGuitars: song.music.neededGuitars,
    neededVocals: song.music.neededVocals,
    neededBass: song.music.neededBass,
    neededKeys: song.music.neededKeys,
  } as MusicResponseDto,
  registrations: song.musicians.map(m => ({
    id: m.id,
    status: 'APPROVED',
    instrument: m.instrument,
    musician: { id: m.id, name: m.name || '' },
  } as RegistrationResponseDto)),
})

// ============================================================================
// Sub-components
// ============================================================================

interface NowPlayingCardProps {
  currentSong: LiveStateSongDto
}

function NowPlayingCard({ currentSong }: NowPlayingCardProps) {
  const { t } = useTranslation()

  const groupedMusicians = useMemo(
    () => groupMusiciansByInstrument(currentSong.musicians),
    [currentSong.musicians]
  )

  const sortedInstruments = useMemo(
    () => Array.from(groupedMusicians.entries()).sort(([a], [b]) => getInstrumentOrder(a) - getInstrumentOrder(b)),
    [groupedMusicians]
  )

  return (
    <div className="bg-primary rounded-xl p-6 text-primary-content shadow-lg">
      <div className="mb-4">
        <p className="text-sm font-semibold text-primary-content/70 mb-1">{t('live_control.now_playing')}</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-balance line-clamp-2">{currentSong.music?.title || t('schedule.song_tba')}</h2>
        <p className="text-xl text-primary-content/80 mt-1 text-pretty">{currentSong.music?.artist || t('schedule.artist_tba')}</p>
      </div>

      {currentSong.music?.duration && (
        <p className="text-lg mb-4 tabular-nums">
          <span aria-hidden="true">&#x23F1;&#xFE0F;</span> {formatDuration(currentSong.music.duration)}
        </p>
      )}

      {sortedInstruments.length > 0 && (
        <div className="mb-2 bg-primary-content/10 rounded-lg p-4">
          <p className="text-sm font-semibold text-primary-content/80 mb-3">{t('nav.musicians')}</p>
          <div className="flex flex-wrap gap-2">
            {sortedInstruments.map(([instrument, musicians]) => (
              <div key={instrument} className="flex items-center gap-2 bg-primary-content/10 rounded-full px-3 py-1">
                <span className="text-lg">{getInstrumentIcon(instrument)}</span>
                <span className="text-sm text-primary-content/90">
                  {musicians.map(m => m.name || t('common.unknown')).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface QueueItemProps {
  schedule: ScheduleResponseDto
  index: number
  isReorderMode: boolean
  isReordering: boolean
  isReorderingThisItem: boolean
  isDragging: boolean
  isDragActive: boolean
  isDragOver: boolean
  onDragStart: (scheduleId: string) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>, scheduleId: string) => void
  onDragEnd: () => void
  onDrop: (e: React.DragEvent<HTMLDivElement>, scheduleId: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, index: number) => void
  onRefChange: (id: string, el: HTMLDivElement | null) => void
}

/**
 * Compute song readiness based on core band coverage (drums, guitars, bass, vocals).
 * 'ready' = all core instruments have at least 1 musician
 * 'partial' = some musicians registered but core band incomplete
 * 'empty' = no musicians at all
 */
function getSongReadiness(schedule: ScheduleResponseDto): 'ready' | 'partial' | 'empty' {
  const { counts, activeCount } = countActiveRegistrationsByInstrument(schedule.registrations)
  if (activeCount === 0) return 'empty'
  const bandComplete = CORE_BAND.every(inst => (counts[inst] || 0) >= 1)
  return bandComplete ? 'ready' : 'partial'
}

const readinessStyles = {
  ready: 'bg-success/10 border-success/30',
  partial: 'bg-warning/10 border-warning/30',
  empty: 'bg-base-200 border-transparent',
} as const

const QueueItem = React.memo(function QueueItem({
  schedule,
  index,
  isReorderMode,
  isReordering,
  isReorderingThisItem,
  isDragging,
  isDragActive,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onKeyDown,
  onRefChange,
}: QueueItemProps) {
  const { t } = useTranslation()

  const musicianNames = useMemo(() => {
    if (!schedule.registrations?.length) return ''
    return schedule.registrations
      .map(r => r.musician?.name?.split(' ')[0] || t('common.unknown'))
      .join(', ')
  }, [schedule.registrations, t])

  const readiness = useMemo(() => getSongReadiness(schedule), [schedule])

  // Base style from readiness, overridden by drag/reorder states
  const baseStyle = isReorderingThisItem
    ? 'bg-primary/5 border-primary/30 cursor-wait'
    : isReorderMode
      ? `${readinessStyles[readiness]} cursor-move hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`
      : readinessStyles[readiness]

  return (
    <div
      ref={(el) => onRefChange(schedule.id, el)}
      draggable={isReorderMode && !isReordering}
      onDragStart={() => onDragStart(schedule.id)}
      onDragOver={(e) => onDragOver(e, schedule.id)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, schedule.id)}
      onKeyDown={(e) => onKeyDown(e, index)}
      data-schedule-id={schedule.id}
      className={`
        rounded-lg p-2 sm:p-3 flex items-center gap-2 border-2 transition-colors duration-200 select-none
        ${baseStyle}
        ${isDragOver ? 'bg-primary/10 border-primary' : ''}
        ${isDragging && isDragActive ? 'opacity-50 border-primary border-dashed z-10 relative' : 'opacity-100'}
      `}
      role="listitem"
      tabIndex={isReorderMode ? 0 : -1}
      aria-label={isReorderMode
        ? `${schedule.order}. ${schedule.music?.title || t('schedule.song_tba')} - ${t('live_control.drag_to_reorder')}`
        : `${schedule.order}. ${schedule.music?.title || t('schedule.song_tba')}`
      }
      aria-roledescription={isReorderMode ? t('live_control.reorderable_item', 'reorderable item') : undefined}
      aria-busy={isReorderingThisItem}
    >
      {/* Drag Handle - only in reorder mode */}
      {isReorderMode && (
        <div
          className={`shrink-0 transition-colors ${isReorderingThisItem ? 'text-primary/50' : 'text-base-content/40'}`}
          aria-hidden="true"
        >
          {isReorderingThisItem ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <GripVertical className="size-4" />
          )}
        </div>
      )}

      {/* Order number */}
      <span className={`text-sm font-bold tabular-nums shrink-0 w-6 text-right ${isReorderingThisItem ? 'text-base-content/50' : 'text-base-content/70'}`}>
        {schedule.order}.
      </span>

      {/* Song title + musicians on separate lines */}
      <div className={`min-w-0 flex-1 ${isReorderingThisItem ? 'text-base-content/70' : 'text-base-content'}`}>
        <p className="text-sm font-semibold truncate">
          {schedule.music?.title || t('schedule.song_tba')}
        </p>
        {musicianNames && (
          <p className="text-xs text-base-content/60 truncate">
            {musicianNames}
          </p>
        )}
      </div>
    </div>
  )
})

// ============================================================================
// Main Component
// ============================================================================

export function LiveJamControlPanel({
  jamId,
  onActionSuccess,
  onActionError,
}: LiveJamControlPanelProps) {
  const { t } = useTranslation()

  // Use live state hook for real-time data
  const { liveState, isLoading, error, refresh } = useJamControl(jamId, {
    autoRefreshEnabled: true,
    autoRefreshInterval: 5000,
  })

  // Local queue state for drag-and-drop
  const [localQueue, setLocalQueue] = useState<ScheduleResponseDto[]>([])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [reorderingItemId, setReorderingItemId] = useState<string | null>(null)

  // Reorder mode state
  const [isReorderMode, setIsReorderMode] = useState(false)
  const snapshotQueueRef = React.useRef<ScheduleResponseDto[]>([])
  const isReorderModeRef = React.useRef(false)

  // Touch drag state
  const [touchDragItem, setTouchDragItem] = useState<string | null>(null)
  const [touchOverIndex, setTouchOverIndex] = useState<number | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const itemRefs = React.useRef<Map<string, HTMLDivElement>>(new Map())
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Refs for native touch event handlers (avoid stale closures)
  const touchDragItemRef = React.useRef<string | null>(null)
  const isDragActiveRef = React.useRef(false)
  const touchOverIndexRef = React.useRef<number | null>(null)
  const localQueueRef = React.useRef(localQueue)
  const reorderQueueRef = React.useRef<(q: ScheduleResponseDto[]) => void>(() => {})
  const isReorderingRef = React.useRef(false)
  const touchCleanupRef = React.useRef<(() => void) | null>(null)

  // Memoize derived state
  const currentSong = liveState?.currentSong ?? null
  const nextSongs = localQueue

  // Calculate dragged index once (not inside map)
  const draggedIndex = useMemo(
    () => touchDragItem ? localQueue.findIndex((s) => s.id === touchDragItem) : -1,
    [touchDragItem, localQueue]
  )

  // Surface live state errors to parent via effect (not during render)
  const lastReportedErrorRef = React.useRef<string | null>(null)
  useEffect(() => {
    if (error && error !== lastReportedErrorRef.current) {
      lastReportedErrorRef.current = error
      onActionError?.(error)
    } else if (!error) {
      lastReportedErrorRef.current = null
    }
  }, [error, onActionError])

  // Clean up native touch listeners on unmount
  useEffect(() => {
    return () => { touchCleanupRef.current?.() }
  }, [])

  // Reorder callbacks - defined before hook for clarity
  const handleReorderSuccess = useCallback((updatedSchedules: ScheduleResponseDto[]) => {
    setLocalQueue(updatedSchedules)
    setReorderingItemId(null)
    onActionSuccess?.(t('live_control.reordered_feedback'))
    void refresh()
  }, [onActionSuccess, t, refresh])

  const handleReorderError = useCallback((errorMessage: string) => {
    setReorderingItemId(null)
    onActionError?.(errorMessage)
  }, [onActionError])

  const handleReorderRollback = useCallback((previousQueue: ScheduleResponseDto[]) => {
    setLocalQueue(previousQueue)
    setReorderingItemId(null)
  }, [])

  // Reorder hook
  const { reorderQueue, isReordering } = useQueueReorder(
    jamId,
    localQueue,
    handleReorderSuccess,
    handleReorderError,
    handleReorderRollback
  )

  // Sync local queue with live state when it changes (skip during drag/reorder/reorder-mode)
  useEffect(() => {
    if (liveState?.nextSongs && !reorderingItemId && !touchDragItem && !draggedItem && !isReorderMode && !isReordering) {
      setLocalQueue(liveState.nextSongs.map(liveSongToSchedule))
    }
  }, [liveState?.nextSongs, reorderingItemId, touchDragItem, draggedItem, isReorderMode, isReordering])

  // Keep refs in sync for native touch handlers
  localQueueRef.current = localQueue
  reorderQueueRef.current = reorderQueue
  isReorderingRef.current = isReordering
  isReorderModeRef.current = isReorderMode

  // Reorder mode handlers
  const enterReorderMode = useCallback(() => {
    snapshotQueueRef.current = localQueue
    setIsReorderMode(true)
  }, [localQueue])

  const saveReorder = useCallback(() => {
    setIsReorderMode(false)
    void reorderQueue(localQueue)
  }, [localQueue, reorderQueue])

  const cancelReorder = useCallback(() => {
    setLocalQueue(snapshotQueueRef.current)
    setIsReorderMode(false)
  }, [])

  // Ref change handler - stable callback for QueueItem memo
  const handleRefChange = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(id, el)
    } else {
      itemRefs.current.delete(id)
    }
  }, [])

  // Mouse drag handlers - accept scheduleId for stable props
  const handleDragStart = useCallback((scheduleId: string) => {
    setDraggedItem(scheduleId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, scheduleId: string) => {
    e.preventDefault()
    setDragOverItem(scheduleId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setDragOverItem(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetScheduleId: string) => {
    e.preventDefault()
    setDragOverItem(null)

    if (!draggedItem) return

    const fromIndex = localQueue.findIndex((s) => s.id === draggedItem)
    const toIndex = localQueue.findIndex((s) => s.id === targetScheduleId)

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      setDraggedItem(null)
      return
    }

    const newQueue = [...localQueue]
    const [draggedSchedule] = newQueue.splice(fromIndex, 1)
    newQueue.splice(toIndex, 0, draggedSchedule)

    setLocalQueue(newQueue)
    setDraggedItem(null)

    // In reorder mode: local-only. Otherwise: commit immediately.
    if (!isReorderMode) {
      setReorderingItemId(draggedItem)
      reorderQueue(newQueue)
    }
  }, [draggedItem, localQueue, reorderQueue, isReorderMode])

  // Native touch drag: passive listeners only during normal scrolling.
  // Non-passive touchmove registered dynamically only when drag is active,
  // then removed when drag ends - so normal page scroll is never blocked.
  const setupTouchListeners = useCallback((node: HTMLDivElement | null) => {
    touchCleanupRef.current?.()
    touchCleanupRef.current = null
    containerRef.current = node
    if (!node) return

    let longPressTimer: ReturnType<typeof setTimeout> | null = null
    let startPos: { x: number; y: number } | null = null
    let autoScrollRaf: number | null = null

    const clearLongPress = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
      startPos = null
    }

    const stopAutoScroll = () => {
      if (autoScrollRaf) {
        cancelAnimationFrame(autoScrollRaf)
        autoScrollRaf = null
      }
    }

    // Auto-scroll when finger is near viewport edges during drag
    const EDGE_ZONE = 80 // px from edge to start scrolling
    const MAX_SCROLL_SPEED = 16 // px per frame (instant scroll, not smooth)
    let lastTouchY = 0

    const autoScrollTick = () => {
      if (!isDragActiveRef.current) return
      const vh = window.innerHeight
      let speed = 0

      if (lastTouchY < EDGE_ZONE) {
        // Near top: scroll up, faster the closer to edge
        speed = -MAX_SCROLL_SPEED * (1 - lastTouchY / EDGE_ZONE)
      } else if (lastTouchY > vh - EDGE_ZONE) {
        // Near bottom: scroll down
        speed = MAX_SCROLL_SPEED * (1 - (vh - lastTouchY) / EDGE_ZONE)
      }

      if (speed !== 0) {
        // Bypass CSS scroll-behavior: smooth which throttles scrollBy speed
        document.documentElement.style.scrollBehavior = 'auto'
        window.scrollBy(0, speed)
        document.documentElement.style.scrollBehavior = ''
        autoScrollRaf = requestAnimationFrame(autoScrollTick)
      } else {
        autoScrollRaf = null
      }
    }

    // Non-passive drag move handler - only attached while dragging
    const onDragTouchMove = (e: TouchEvent) => {
      if (!touchDragItemRef.current || !isDragActiveRef.current) return

      e.preventDefault()

      const touch = e.touches[0]
      const touchY = touch.clientY
      lastTouchY = touchY
      let newOverIndex: number | null = null
      const queue = localQueueRef.current

      queue.forEach((schedule, index) => {
        const element = itemRefs.current.get(schedule.id)
        if (element) {
          const rect = element.getBoundingClientRect()
          const itemMiddle = rect.top + rect.height / 2
          if (touchY >= rect.top && touchY <= rect.bottom) {
            newOverIndex = touchY < itemMiddle ? index : index + 1
          }
        }
      })

      if (newOverIndex === null && queue.length > 0) {
        const firstItem = itemRefs.current.get(queue[0].id)
        const lastItem = itemRefs.current.get(queue[queue.length - 1].id)
        if (firstItem && touchY < firstItem.getBoundingClientRect().top) {
          newOverIndex = 0
        } else if (lastItem && touchY > lastItem.getBoundingClientRect().bottom) {
          newOverIndex = queue.length
        }
      }

      touchOverIndexRef.current = newOverIndex
      setTouchOverIndex(newOverIndex)

      // Start auto-scroll if near edge (idempotent: won't double-start)
      if (!autoScrollRaf && (touchY < EDGE_ZONE || touchY > window.innerHeight - EDGE_ZONE)) {
        autoScrollRaf = requestAnimationFrame(autoScrollTick)
      }
    }

    const resetTouchState = () => {
      clearLongPress()
      stopAutoScroll()
      // Remove non-passive drag handler when drag ends
      node.removeEventListener('touchmove', onDragTouchMove)
      touchDragItemRef.current = null
      isDragActiveRef.current = false
      touchOverIndexRef.current = null
      setTouchDragItem(null)
      setIsDragActive(false)
      setTouchOverIndex(null)
    }

    const onTouchStart = (e: TouchEvent) => {
      // Only allow drag in reorder mode
      if (!isReorderModeRef.current) return
      if (isReorderingRef.current) return
      const itemEl = (e.target as HTMLElement).closest('[data-schedule-id]') as HTMLElement | null
      if (!itemEl?.dataset.scheduleId) return

      const scheduleId = itemEl.dataset.scheduleId
      const touch = e.touches[0]
      startPos = { x: touch.clientX, y: touch.clientY }

      // In reorder mode: activate drag immediately (container has touch-action: none)
      touchDragItemRef.current = scheduleId
      isDragActiveRef.current = true
      setTouchDragItem(scheduleId)
      setIsDragActive(true)
      if (navigator.vibrate) navigator.vibrate(30)
      node.addEventListener('touchmove', onDragTouchMove, { passive: false })
    }

    // Passive touchmove: only cancels long press if finger moves during detection window
    const onPassiveTouchMove = (e: TouchEvent) => {
      if (!longPressTimer || !startPos) return
      const touch = e.touches[0]
      const dx = touch.clientX - startPos.x
      const dy = touch.clientY - startPos.y
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        clearLongPress()
      }
    }

    const onTouchEnd = () => {
      clearLongPress()
      const dragItem = touchDragItemRef.current
      const dragActive = isDragActiveRef.current
      const overIndex = touchOverIndexRef.current
      const queue = localQueueRef.current

      resetTouchState()

      if (!dragItem || !dragActive || overIndex === null) return

      const fromIndex = queue.findIndex(s => s.id === dragItem)
      if (fromIndex === -1) return

      let targetIndex = overIndex
      if (targetIndex > fromIndex) targetIndex -= 1
      if (targetIndex === fromIndex) return

      const newQueue = [...queue]
      const [draggedSchedule] = newQueue.splice(fromIndex, 1)
      newQueue.splice(targetIndex, 0, draggedSchedule)

      setLocalQueue(newQueue)

      // In reorder mode: local-only. Otherwise: commit immediately.
      if (!isReorderModeRef.current) {
        setReorderingItemId(dragItem)
        reorderQueueRef.current(newQueue)
      }
    }

    // Only passive listeners on mount - page scroll is never blocked
    node.addEventListener('touchstart', onTouchStart, { passive: true })
    node.addEventListener('touchmove', onPassiveTouchMove, { passive: true })
    node.addEventListener('touchend', onTouchEnd, { passive: true })
    node.addEventListener('touchcancel', resetTouchState, { passive: true })

    touchCleanupRef.current = () => {
      clearLongPress()
      node.removeEventListener('touchstart', onTouchStart)
      node.removeEventListener('touchmove', onPassiveTouchMove)
      node.removeEventListener('touchmove', onDragTouchMove)
      node.removeEventListener('touchend', onTouchEnd)
      node.removeEventListener('touchcancel', resetTouchState)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Stable: all state access via refs, setState functions are stable

  // Keyboard handler for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    if (!isReorderMode) return
    if (isReordering) return

    const schedule = localQueue[index]
    if (!schedule) return

    let targetIndex: number | null = null

    if (e.key === 'ArrowUp' && index > 0) {
      targetIndex = index - 1
    } else if (e.key === 'ArrowDown' && index < localQueue.length - 1) {
      targetIndex = index + 1
    }

    if (targetIndex !== null) {
      e.preventDefault()

      const newQueue = [...localQueue]
      const [movedSchedule] = newQueue.splice(index, 1)
      newQueue.splice(targetIndex, 0, movedSchedule)

      setLocalQueue(newQueue)

      // Focus the moved item after reorder
      setTimeout(() => {
        const element = itemRefs.current.get(schedule.id)
        element?.focus()
      }, 100)
    }
  }, [isReorderMode, isReordering, localQueue])

  // Loading state
  if (isLoading && !liveState) {
    return (
      <div className="space-y-6">
        <div className="bg-base-200 rounded-xl p-8 text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="text-base-content/60 mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Now Playing Section */}
      {currentSong ? (
        <NowPlayingCard currentSong={currentSong} />
      ) : (
        <div className="bg-base-200 rounded-xl p-6 text-center">
          <p className="text-base-content/60">{t('live_control.no_song_playing')}</p>
          <p className="text-sm text-base-content/50 mt-1">{t('live_control.start_to_begin')}</p>
        </div>
      )}

      {/* Up Next Section */}
      <div className="bg-base-100 rounded-xl p-6 border border-base-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-balance">
            {t('live_control.up_next')}
          </h3>

          {isReorderMode ? (
            <div className="flex items-center gap-2">
              {isReordering ? (
                <div className="flex items-center gap-2 text-sm text-base-content/60">
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t('live_control.saving_order')}</span>
                </div>
              ) : (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={cancelReorder}>
                    <X className="size-4" />
                    {t('live_control.reorder_cancel', 'Cancel')}
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={saveReorder}>
                    <Check className="size-4" />
                    {t('live_control.reorder_save', 'Save order')}
                  </button>
                </>
              )}
            </div>
          ) : nextSongs.length > 1 ? (
            <button className="btn btn-ghost btn-sm gap-1" onClick={enterReorderMode}>
              <ArrowUpDown className="size-4" />
              {t('live_control.reorder_toggle', 'Reorder')}
            </button>
          ) : null}
        </div>

        {isReorderMode && nextSongs.length > 1 && (
          <>
            <p className="text-xs text-base-content/50 mb-2 md:hidden">
              {t('live_control.reorder_hint_mobile')}
            </p>
            <p className="sr-only">
              {t('live_control.reorder_hint_keyboard', 'Use arrow keys to reorder songs')}
            </p>
          </>
        )}

        {nextSongs.length > 0 ? (
          <div
            ref={setupTouchListeners}
            className={`space-y-2 ${isReorderMode ? 'border-2 border-dashed border-primary/20 rounded-xl p-2 touch-none' : ''}`}
            role="list"
            aria-label={t('live_control.up_next')}
          >
            {nextSongs.map((schedule, index) => {
              const isReorderingThisItem = reorderingItemId === schedule.id
              const isDragging = touchDragItem === schedule.id || draggedItem === schedule.id
              const showDropBefore = touchDragItem && isDragActive && touchOverIndex === index && touchDragItem !== schedule.id
              const showDropAfter = touchDragItem && isDragActive && touchOverIndex === index + 1 && index === localQueue.length - 1 && draggedIndex !== index

              return (
                <React.Fragment key={schedule.id}>
                  {showDropBefore && (
                    <div className="h-0.5 bg-primary rounded-full mx-4" aria-hidden="true" />
                  )}
                  <QueueItem
                    schedule={schedule}
                    index={index}
                    isReorderMode={isReorderMode}
                    isReordering={isReordering}
                    isReorderingThisItem={isReorderingThisItem}
                    isDragging={isDragging}
                    isDragActive={isDragActive}
                    isDragOver={dragOverItem === schedule.id}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    onKeyDown={handleKeyDown}
                    onRefChange={handleRefChange}
                  />
                  {showDropAfter && (
                    <div className="h-0.5 bg-primary rounded-full mx-4" aria-hidden="true" />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-base-content/60 py-4">{t('live_control.no_more_songs')}</p>
        )}
      </div>
    </div>
  )
}
