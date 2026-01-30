/**
 * Live Jam Control Panel Component
 * Host control interface for managing active jam queue
 * Uses live state for real-time performance data
 * Allows queue reordering via drag and drop (mouse + touch)
 */

import React, {useState, useEffect, useCallback, useMemo} from 'react'
import {GripVertical, Music, Loader2} from 'lucide-react'
import type {RegistrationResponseDto, ScheduleResponseDto} from '../../types/api.types'
import type {LiveStateSongDto} from '../../types/jamControl.types'
import {formatDuration} from '../../lib/formatters'
import {getInstrumentIcon} from './RegistrationList'
import {useTranslation} from 'react-i18next'
import {normalizeInstrument} from '../../utils/musicianUtils'
import {useJamControl, useQueueReorder} from '../../hooks'

interface LiveJamControlPanelProps {
  jamId: string
  onActionSuccess?: (message: string) => void
  onActionError?: (error: string) => void
}

/**
 * Group registrations by instrument
 */
const groupRegistrationsByInstrument = (
  registrations: RegistrationResponseDto[] | undefined
): Map<string, RegistrationResponseDto[]> => {
  const grouped = new Map<string, RegistrationResponseDto[]>()
  if (!registrations) return grouped

  registrations.forEach((reg) => {
    const instrument = reg.instrument || reg.musician?.instrument || ''
    if (instrument) {
      const normalized = normalizeInstrument(instrument)
      if (!grouped.has(normalized)) {
        grouped.set(normalized, [])
      }
      grouped.get(normalized)!.push(reg)
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
 * Convert LiveStateSongDto to ScheduleResponseDto for compatibility with reorder hook
 */
const liveSongToSchedule = (song: LiveStateSongDto): ScheduleResponseDto => ({
  id: song.id,
  jamId: song.jamId,
  musicId: song.musicId,
  order: song.order,
  status: song.status,
  createdAt: song.createdAt,
  music: song.music as unknown as ScheduleResponseDto['music'],
  registrations: song.registrations,
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
    () => groupRegistrationsByInstrument(currentSong.registrations),
    [currentSong.registrations]
  )

  const sortedInstruments = useMemo(
    () => Array.from(groupedMusicians.entries()).sort(([a], [b]) => getInstrumentOrder(a) - getInstrumentOrder(b)),
    [groupedMusicians]
  )

  return (
    <div className="bg-gradient-to-br from-primary to-primary-focus rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-white/80 mb-1">{t('live_control.now_playing')}</p>
          <h2 className="text-3xl font-bold text-balance">{currentSong.music?.title || t('schedule.song_tba')}</h2>
          <p className="text-xl text-white/90 mt-1 text-pretty">{currentSong.music?.artist || t('schedule.artist_tba')}</p>
        </div>
        <Music className="size-12 text-white/60" aria-hidden="true" />
      </div>

      {currentSong.music?.duration && (
        <p className="text-lg mb-4 tabular-nums">
          <span aria-hidden="true">⏱️</span> {formatDuration(currentSong.music.duration)}
        </p>
      )}

      {sortedInstruments.length > 0 && (
        <div className="mb-6 bg-white/10 rounded-lg p-4">
          <p className="text-sm font-semibold text-white/90 mb-3">{t('nav.musicians')}</p>
          <div className="flex flex-wrap gap-2">
            {sortedInstruments.map(([instrument, musicians]) => (
              <div key={instrument} className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                <span className="text-lg">{getInstrumentIcon(instrument)}</span>
                <span className="text-sm text-white/90">
                  {musicians.map(m => m.musician?.name || t('common.unknown')).join(', ')}
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
  isReordering: boolean
  isReorderingThisItem: boolean
  isDragging: boolean
  isDragActive: boolean
  isDragOver: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
  itemRef: (el: HTMLDivElement | null) => void
}

const QueueItem = React.memo(function QueueItem({
  schedule,
  index,
  isReordering,
  isReorderingThisItem,
  isDragging,
  isDragActive,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onTouchStart,
  onKeyDown,
  itemRef,
}: QueueItemProps) {
  const { t } = useTranslation()

  return (
    <div
      ref={itemRef}
      draggable={!isReordering}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onTouchStart={onTouchStart}
      onKeyDown={onKeyDown}
      className={`
        rounded-lg p-4 flex items-start gap-3 border-2 transition-all duration-200 select-none touch-none
        ${isReorderingThisItem
          ? 'bg-primary/5 border-primary/30 cursor-wait'
          : 'bg-base-200 border-transparent cursor-move hover:bg-base-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        }
        ${isDragOver ? 'bg-primary/10 border-primary' : ''}
        ${isDragging && isDragActive ? 'opacity-50 border-primary border-dashed scale-105 shadow-lg z-10 relative' : 'opacity-100'}
      `}
      role="listitem"
      tabIndex={0}
      aria-label={`${index + 1}. ${schedule.music?.title || t('schedule.song_tba')} - ${t('live_control.drag_to_reorder')}`}
      aria-busy={isReorderingThisItem}
    >
      {/* Drag Handle */}
      <div
        className={`pt-1 transition-colors ${isReorderingThisItem ? 'text-primary/50' : 'text-base-content/40'}`}
        aria-hidden="true"
      >
        {isReorderingThisItem ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <GripVertical className="size-5" />
        )}
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-balance ${isReorderingThisItem ? 'text-base-content/70' : 'text-base-content'}`}>
          {index + 1}. {schedule.music?.title || t('schedule.song_tba')}
        </p>
        <p className="text-sm text-base-content/70 text-pretty">
          {schedule.music?.artist || t('schedule.artist_tba')}
        </p>
        {schedule.music?.duration && (
          <p className="text-xs text-base-content/60 mt-1 tabular-nums">
            <span aria-hidden="true">⏱️</span> {formatDuration(schedule.music.duration)}
          </p>
        )}
      </div>

      {/* Musicians Count */}
      {schedule.registrations && schedule.registrations.length > 0 && (
        <div className="badge badge-outline text-xs">
          {t('schedule.musicians_count', { count: schedule.registrations.length })}
        </div>
      )}
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

  // Touch drag state
  const [touchDragItem, setTouchDragItem] = useState<string | null>(null)
  const [touchOverIndex, setTouchOverIndex] = useState<number | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const itemRefs = React.useRef<Map<string, HTMLDivElement>>(new Map())
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Memoize derived state
  const currentSong = liveState?.currentSong ?? null
  const nextSongs = localQueue

  // Calculate dragged index once (not inside map)
  const draggedIndex = useMemo(
    () => touchDragItem ? localQueue.findIndex((s) => s.id === touchDragItem) : -1,
    [touchDragItem, localQueue]
  )

  // Sync local queue with live state when it changes
  useEffect(() => {
    if (liveState?.nextSongs && !reorderingItemId) {
      setLocalQueue(liveState.nextSongs.map(liveSongToSchedule))
    }
  }, [liveState?.nextSongs, reorderingItemId])

  // Handle errors from live state
  useEffect(() => {
    if (error && onActionError) {
      onActionError(error)
    }
  }, [error, onActionError])

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

  // Ref callback - memoized
  const setItemRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(id, el)
    } else {
      itemRefs.current.delete(id)
    }
  }, [])

  // Mouse drag handlers
  const handleDragStart = useCallback((scheduleId: string) => {
    setDraggedItem(scheduleId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, scheduleId: string) => {
    e.preventDefault()
    setDragOverItem(scheduleId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverItem(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetSchedule: ScheduleResponseDto) => {
    e.preventDefault()
    setDragOverItem(null)

    if (!draggedItem) return

    const fromIndex = localQueue.findIndex((s) => s.id === draggedItem)
    const toIndex = localQueue.findIndex((s) => s.id === targetSchedule.id)

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      setDraggedItem(null)
      return
    }

    setReorderingItemId(draggedItem)

    const newQueue = [...localQueue]
    const [draggedSchedule] = newQueue.splice(fromIndex, 1)
    newQueue.splice(toIndex, 0, draggedSchedule)

    setLocalQueue(newQueue)
    setDraggedItem(null)
    reorderQueue(newQueue)
  }, [draggedItem, localQueue, reorderQueue])

  // Touch handlers - immediate drag on the grip handle area
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>, scheduleId: string) => {
    if (isReordering) return

    // Prevent scrolling immediately when touching a draggable item
    e.preventDefault()

    setTouchDragItem(scheduleId)
    setIsDragActive(true)

    // Vibrate on supported devices
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }
  }, [isReordering])

  // Container-level touch move handler
  const handleContainerTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchDragItem || !isDragActive) return

    // Prevent scrolling
    e.preventDefault()

    const touch = e.touches[0]
    const touchY = touch.clientY
    let newOverIndex: number | null = null

    localQueue.forEach((schedule, index) => {
      const element = itemRefs.current.get(schedule.id)
      if (element) {
        const rect = element.getBoundingClientRect()
        const itemMiddle = rect.top + rect.height / 2

        if (touchY >= rect.top && touchY <= rect.bottom) {
          newOverIndex = touchY < itemMiddle ? index : index + 1
        }
      }
    })

    // Handle touch outside items
    if (newOverIndex === null && localQueue.length > 0) {
      const firstItem = itemRefs.current.get(localQueue[0].id)
      const lastItem = itemRefs.current.get(localQueue[localQueue.length - 1].id)

      if (firstItem && touchY < firstItem.getBoundingClientRect().top) {
        newOverIndex = 0
      } else if (lastItem && touchY > lastItem.getBoundingClientRect().bottom) {
        newOverIndex = localQueue.length
      }
    }

    setTouchOverIndex(newOverIndex)
  }, [touchDragItem, isDragActive, localQueue])

  const handleTouchEnd = useCallback(() => {
    if (!touchDragItem || !isDragActive) {
      setTouchDragItem(null)
      setTouchOverIndex(null)
      setIsDragActive(false)
      return
    }

    // If no valid drop target, just cancel
    if (touchOverIndex === null) {
      setTouchDragItem(null)
      setTouchOverIndex(null)
      setIsDragActive(false)
      return
    }

    const fromIndex = localQueue.findIndex((s) => s.id === touchDragItem)
    if (fromIndex === -1) {
      setTouchDragItem(null)
      setTouchOverIndex(null)
      setIsDragActive(false)
      return
    }

    let targetIndex = touchOverIndex
    if (targetIndex > fromIndex) {
      targetIndex -= 1
    }

    if (targetIndex === fromIndex) {
      setTouchDragItem(null)
      setTouchOverIndex(null)
      setIsDragActive(false)
      return
    }

    setReorderingItemId(touchDragItem)

    const newQueue = [...localQueue]
    const [draggedSchedule] = newQueue.splice(fromIndex, 1)
    newQueue.splice(targetIndex, 0, draggedSchedule)

    setLocalQueue(newQueue)
    setTouchDragItem(null)
    setTouchOverIndex(null)
    setIsDragActive(false)
    reorderQueue(newQueue)
  }, [touchDragItem, isDragActive, touchOverIndex, localQueue, reorderQueue])

  // Cancel drag on touch cancel
  const handleTouchCancel = useCallback(() => {
    setTouchDragItem(null)
    setTouchOverIndex(null)
    setIsDragActive(false)
  }, [])

  // Keyboard handler for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
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
      setReorderingItemId(schedule.id)

      const newQueue = [...localQueue]
      const [movedSchedule] = newQueue.splice(index, 1)
      newQueue.splice(targetIndex, 0, movedSchedule)

      setLocalQueue(newQueue)
      reorderQueue(newQueue)

      // Focus the moved item after reorder
      setTimeout(() => {
        const element = itemRefs.current.get(schedule.id)
        element?.focus()
      }, 100)
    }
  }, [isReordering, localQueue, reorderQueue])

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
          <h3 className="text-lg font-bold flex items-center gap-2 text-balance">
            <Music className="size-5" aria-hidden="true" />
            {t('live_control.up_next')}
          </h3>

          {isReordering && (
            <div className="flex items-center gap-2 text-sm text-base-content/60">
              <Loader2 className="size-4 animate-spin" />
              <span>{t('live_control.saving_order')}</span>
            </div>
          )}
        </div>

        {nextSongs.length > 0 ? (
          <div
            ref={containerRef}
            className={`space-y-2 ${isDragActive ? 'touch-none' : ''}`}
            role="list"
            aria-label={t('live_control.up_next')}
            onTouchMove={handleContainerTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
          >
            {nextSongs.map((schedule, index) => {
              const isReorderingThisItem = reorderingItemId === schedule.id
              const isDragging = touchDragItem === schedule.id || draggedItem === schedule.id
              const showDropBefore = touchDragItem && isDragActive && touchOverIndex === index && touchDragItem !== schedule.id
              const showDropAfter = touchDragItem && isDragActive && touchOverIndex === index + 1 && index === localQueue.length - 1 && draggedIndex !== index

              return (
                <React.Fragment key={schedule.id}>
                  {showDropBefore && (
                    <div className="h-2 bg-primary rounded-full mx-4 animate-pulse shadow-lg" aria-hidden="true" />
                  )}
                  <QueueItem
                    schedule={schedule}
                    index={index}
                    isReordering={isReordering}
                    isReorderingThisItem={isReorderingThisItem}
                    isDragging={isDragging}
                    isDragActive={isDragActive}
                    isDragOver={dragOverItem === schedule.id}
                    onDragStart={() => handleDragStart(schedule.id)}
                    onDragOver={(e) => handleDragOver(e, schedule.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, schedule)}
                    onTouchStart={(e) => handleTouchStart(e, schedule.id)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    itemRef={setItemRef(schedule.id)}
                  />
                  {showDropAfter && (
                    <div className="h-2 bg-primary rounded-full mx-4 animate-pulse shadow-lg" aria-hidden="true" />
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
