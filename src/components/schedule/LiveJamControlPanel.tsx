/**
 * Live Jam Control Panel Component
 * Host control interface for managing active jam queue
 * Uses live state for real-time performance data
 * Allows queue reordering via toggle-based reorder mode (mouse, touch, keyboard)
 */

import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react'
import {GripVertical, Loader2, ArrowUpDown, Check, X} from 'lucide-react'
import type {ScheduleResponseDto, MusicResponseDto, RegistrationResponseDto} from '../../types/api.types'
import type {LiveStateSongDto, LiveStateMusicianDto} from '../../types/jamControl.types'
import {formatDuration} from '../../lib/formatters'
import {getInstrumentIcon} from '../../lib/schedule/instrumentHelpers'
import {useTranslation} from 'react-i18next'
import {normalizeInstrument} from '../../utils/musicianUtils'
import {countActiveRegistrationsByInstrument, hasCoreBand} from '../../utils/scheduleUtils'
import {useJamControl, useQueueReorder, useMouseReorder, useTouchReorder, useKeyboardReorder} from '../../hooks'

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

const NowPlayingCard = React.memo(function NowPlayingCard({ currentSong }: NowPlayingCardProps) {
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
    <div className="bg-primary rounded-xl px-4 py-3 text-primary-content shadow-lg flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-primary-content/60">{t('live_control.now_playing')}</p>
        <p className="font-bold text-lg truncate">{currentSong.music?.title || t('schedule.song_tba')}</p>
        <p className="text-sm text-primary-content/80 truncate">{currentSong.music?.artist || t('schedule.artist_tba')}</p>
      </div>
      <div className="shrink-0 text-right">
        {currentSong.music?.duration && (
          <p className="text-sm tabular-nums text-primary-content/70">{formatDuration(currentSong.music.duration)}</p>
        )}
        {sortedInstruments.length > 0 && (
          <div className="flex gap-1 mt-1 justify-end">
            {sortedInstruments.map(([instrument, musicians]) => (
              <span key={instrument} className="text-base" title={musicians.map(m => m.name || t('common.unknown')).join(', ')}>
                {getInstrumentIcon(instrument)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

interface QueueItemProps {
  schedule: ScheduleResponseDto
  index: number
  isReorderMode: boolean
  isReordering: boolean
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
  const { activeCount } = countActiveRegistrationsByInstrument(schedule.registrations)
  if (activeCount === 0) return 'empty'
  return hasCoreBand(schedule) ? 'ready' : 'partial'
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

  // Base style from readiness, plus drag affordances while in reorder mode
  const baseStyle = isReorderMode
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
      aria-busy={isReordering}
    >
      {/* Drag Handle - only in reorder mode */}
      {isReorderMode && (
        <div className="shrink-0 transition-colors text-base-content/40" aria-hidden="true">
          <GripVertical className="size-4" />
        </div>
      )}

      {/* Order number */}
      <span className={`text-sm font-bold tabular-nums shrink-0 w-6 text-right ${isReordering ? 'text-base-content/50' : 'text-base-content/70'}`}>
        {schedule.order}.
      </span>

      {/* Song title + musicians on separate lines */}
      <div className={`min-w-0 flex-1 ${isReordering ? 'text-base-content/70' : 'text-base-content'}`}>
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

  // Local queue state, shared by all reorder interactions
  const [localQueue, setLocalQueue] = useState<ScheduleResponseDto[]>([])

  // Reorder mode state
  const [isReorderMode, setIsReorderMode] = useState(false)
  const snapshotQueueRef = useRef<ScheduleResponseDto[]>([])

  // Item DOM refs, shared by the touch and keyboard hooks (drop-position
  // geometry and post-move refocus respectively)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const registerItemRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(id, el)
    } else {
      itemRefs.current.delete(id)
    }
  }, [])
  const getItemElement = useCallback((id: string) => itemRefs.current.get(id), [])

  // Memoize derived state
  const currentSong = liveState?.currentSong ?? null
  const nextSongs = localQueue

  // Surface live state errors to parent via effect (not during render)
  const lastReportedErrorRef = useRef<string | null>(null)
  useEffect(() => {
    if (error && error !== lastReportedErrorRef.current) {
      lastReportedErrorRef.current = error
      onActionError?.(error)
    } else if (!error) {
      lastReportedErrorRef.current = null
    }
  }, [error, onActionError])

  // Reorder callbacks - defined before hook for clarity
  const handleReorderSuccess = useCallback((updatedSchedules: ScheduleResponseDto[]) => {
    setLocalQueue(updatedSchedules)
    onActionSuccess?.(t('live_control.reordered_feedback'))
    void refresh()
  }, [onActionSuccess, t, refresh])

  const handleReorderError = useCallback((errorMessage: string) => {
    onActionError?.(errorMessage)
  }, [onActionError])

  const handleReorderRollback = useCallback((previousQueue: ScheduleResponseDto[]) => {
    setLocalQueue(previousQueue)
  }, [])

  // Reorder hook - commits the queue to the backend (only called by saveReorder)
  const { reorderQueue, isReordering } = useQueueReorder(
    jamId,
    localQueue,
    handleReorderSuccess,
    handleReorderError,
    handleReorderRollback
  )

  // Mouse, touch, and keyboard reorder interactions. Each only ever applies a
  // local reorder (setLocalQueue) - dragging/keyboard-nav is gated to reorder
  // mode, where the queue is only ever committed explicitly via saveReorder.
  const mouse = useMouseReorder(localQueue, setLocalQueue)
  const touch = useTouchReorder(localQueue, isReorderMode, isReordering, setLocalQueue, getItemElement)
  const keyboard = useKeyboardReorder(localQueue, isReorderMode, isReordering, setLocalQueue, getItemElement)

  // Calculate dragged index once (not inside map)
  const draggedIndex = useMemo(
    () => touch.touchDragItem ? localQueue.findIndex((s) => s.id === touch.touchDragItem) : -1,
    [touch.touchDragItem, localQueue]
  )

  // Sync local queue with live state when it changes (skip during drag/reorder/reorder-mode)
  useEffect(() => {
    if (
      liveState?.nextSongs &&
      !touch.touchDragItem &&
      !mouse.draggedItem &&
      !isReorderMode &&
      !isReordering
    ) {
      setLocalQueue(liveState.nextSongs.map(liveSongToSchedule))
    }
  }, [liveState?.nextSongs, touch.touchDragItem, mouse.draggedItem, isReorderMode, isReordering])

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
              {t('live_control.reorder_drag', 'Arrastar')}
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
            ref={touch.setupTouchListeners}
            className={`space-y-2 ${isReorderMode ? 'border-2 border-dashed border-primary/20 rounded-xl p-2 touch-none' : ''}`}
            role="list"
            aria-label={t('live_control.up_next')}
          >
            {nextSongs.map((schedule, index) => {
              const isDragging = touch.touchDragItem === schedule.id || mouse.draggedItem === schedule.id
              const showDropBefore = touch.touchDragItem && touch.isDragActive && touch.touchOverIndex === index && touch.touchDragItem !== schedule.id
              const showDropAfter = touch.touchDragItem && touch.isDragActive && touch.touchOverIndex === index + 1 && index === localQueue.length - 1 && draggedIndex !== index

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
                    isDragging={isDragging}
                    isDragActive={touch.isDragActive}
                    isDragOver={mouse.dragOverItem === schedule.id}
                    onDragStart={mouse.handleDragStart}
                    onDragOver={mouse.handleDragOver}
                    onDragEnd={mouse.handleDragEnd}
                    onDrop={mouse.handleDrop}
                    onKeyDown={keyboard.handleKeyDown}
                    onRefChange={registerItemRef}
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
