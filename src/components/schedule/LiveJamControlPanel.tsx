/** Host control interface for managing the active Jam's Live Queue. */
import React, {useMemo} from 'react'
import {ArrowUpDown, Check, GripVertical, Loader2, X} from 'lucide-react'
import {useTranslation} from 'react-i18next'
import {useLiveQueueController} from '../../hooks/useLiveQueueController'
import {formatDuration} from '../../lib/formatters'
import type {LiveQueueOutcome, LiveQueuePerformance} from '../../lib/live-queue/liveQueueController'
import {getInstrumentIcon} from '../../lib/schedule/instrumentHelpers'
import {CORE_BAND} from '../../utils/scheduleUtils'
import {normalizeInstrument} from '../../utils/musicianUtils'
import {Action} from '../Action'
import {Alert} from '../Alert'
import {DataCard} from '../data-display'

interface LiveJamControlPanelProps {
  jamId: string
}

type LiveQueueMusician = LiveQueuePerformance['musicians'][number]

function groupMusiciansByInstrument(
  musicians: readonly LiveQueueMusician[],
): Map<string, LiveQueueMusician[]> {
  const grouped = new Map<string, LiveQueueMusician[]>()
  musicians.forEach((musician) => {
    if (!musician.instrument) return
    const instrument = normalizeInstrument(musician.instrument)
    const group = grouped.get(instrument) ?? []
    group.push(musician)
    grouped.set(instrument, group)
  })
  return grouped
}

function getInstrumentOrder(instrument: string): number {
  const order: Record<string, number> = {vocals: 0, drums: 1, guitars: 2, bass: 3, keys: 4}
  return order[instrument] ?? 99
}

function NowPlayingCard({currentPerformance}: {currentPerformance: LiveQueuePerformance}) {
  const {t} = useTranslation()
  const sortedInstruments = useMemo(
    () => Array.from(groupMusiciansByInstrument(currentPerformance.musicians).entries())
      .sort(([left], [right]) => getInstrumentOrder(left) - getInstrumentOrder(right)),
    [currentPerformance.musicians],
  )

  return (
    <div className="bg-primary rounded-xl px-4 py-3 text-primary-content shadow-lg flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-primary-content/60">{t('live_control.now_playing')}</p>
        <p className="font-bold text-lg truncate">{currentPerformance.music.title || t('schedule.song_tba')}</p>
        <p className="text-sm text-primary-content/80 truncate">{currentPerformance.music.artist || t('schedule.artist_tba')}</p>
      </div>
      <div className="shrink-0 text-right">
        {currentPerformance.music.duration && (
          <p className="text-sm tabular-nums text-primary-content/70">{formatDuration(currentPerformance.music.duration)}</p>
        )}
        {sortedInstruments.length > 0 && (
          <div className="flex gap-1 mt-1 justify-end">
            {sortedInstruments.map(([instrument, musicians]) => (
              <span key={instrument} className="text-base" title={musicians.map(({name}) => name || t('common.unknown')).join(', ')}>
                {getInstrumentIcon(instrument)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getPerformanceReadiness(performance: LiveQueuePerformance): 'ready' | 'partial' | 'empty' {
  if (performance.musicians.length === 0) return 'empty'
  const instruments = new Set(performance.musicians.map(({instrument}) => normalizeInstrument(instrument)))
  return CORE_BAND.every((instrument) => instruments.has(instrument)) ? 'ready' : 'partial'
}

const readinessStyles = {
  ready: 'bg-success/10 border-success/30',
  partial: 'bg-warning/10 border-warning/30',
  empty: 'bg-base-200 border-transparent',
} as const

interface QueueItemProps {
  performance: LiveQueuePerformance
  isReorderMode: boolean
  isReordering: boolean
  isDragging: boolean
  isDragOver: boolean
  onDragStart: (performanceId: string) => void
  onDragOver: (event: React.DragEvent<HTMLDivElement>, performanceId: string) => void
  onDragEnd: () => void
  onDrop: (event: React.DragEvent<HTMLDivElement>, performanceId: string) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>, performanceId: string) => void
  onRefChange: (id: string, element: HTMLDivElement | null) => void
}

const QueueItem = React.memo(function QueueItem({
  performance,
  isReorderMode,
  isReordering,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onKeyDown,
  onRefChange,
}: QueueItemProps) {
  const {t} = useTranslation()
  const musicianNames = useMemo(
    () => performance.musicians.map(({name}) => name?.split(' ')[0] || t('common.unknown')).join(', '),
    [performance.musicians, t],
  )
  const readiness = useMemo(() => getPerformanceReadiness(performance), [performance])
  const baseStyle = isReordering
    ? 'bg-primary/5 border-primary/30 cursor-wait'
    : isReorderMode
      ? readinessStyles[readiness] + ' cursor-move hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      : readinessStyles[readiness]
  const className = [
    'rounded-lg p-2 sm:p-3 flex items-center gap-2 border-2 transition-colors duration-200 select-none',
    baseStyle,
    isDragOver ? 'bg-primary/10 border-primary' : '',
    isDragging ? 'opacity-50 border-primary border-dashed z-10 relative' : 'opacity-100',
  ].join(' ')
  const label = performance.order + '. ' + (performance.music.title || t('schedule.song_tba'))
    + (isReorderMode ? ' - ' + t('live_control.drag_to_reorder') : '')

  return (
    <div
      ref={(element) => onRefChange(performance.id, element)}
      draggable={isReorderMode && !isReordering}
      onDragStart={() => onDragStart(performance.id)}
      onDragOver={(event) => onDragOver(event, performance.id)}
      onDragEnd={onDragEnd}
      onDrop={(event) => onDrop(event, performance.id)}
      onKeyDown={(event) => onKeyDown(event, performance.id)}
      data-performance-id={performance.id}
      className={className}
      role="listitem"
      tabIndex={isReorderMode ? 0 : -1}
      aria-label={label}
      aria-roledescription={isReorderMode ? t('live_control.reorderable_item', 'reorderable item') : undefined}
      aria-busy={isReordering}
    >
      {isReorderMode && (
        <div className={'shrink-0 transition-colors ' + (isReordering ? 'text-primary/50' : 'text-base-content/40')} aria-hidden="true">
          {isReordering ? <Loader2 className="size-4 animate-spin" /> : <GripVertical className="size-4" />}
        </div>
      )}
      <span className={'text-sm font-bold tabular-nums shrink-0 w-6 text-right ' + (isReordering ? 'text-base-content/50' : 'text-base-content/70')}>
        {performance.order}.
      </span>
      <div className={'min-w-0 flex-1 ' + (isReordering ? 'text-base-content/70' : 'text-base-content')}>
        <p className="text-sm font-semibold truncate">{performance.music.title || t('schedule.song_tba')}</p>
        {musicianNames && <p className="text-xs text-base-content/60 truncate">{musicianNames}</p>}
      </div>
    </div>
  )
})

function outcomeError(outcome: LiveQueueOutcome, conflictMessage: string): string | null {
  if (outcome.code === 'conflict') return conflictMessage
  if (outcome.code === 'failure' || outcome.code === 'refresh_failure') return outcome.error.message
  return null
}

export function LiveJamControlPanel({jamId}: LiveJamControlPanelProps) {
  const {t} = useTranslation()
  const {state, commands, interactions, isLoading, error} = useLiveQueueController(jamId)
  const currentPerformance = state.server.currentPerformance
  const performances = state.draftPerformances
  const isReorderMode = state.session.status === 'editing'
  const isReordering = state.persistence.status !== 'idle'
  const activeInput = state.input.mode === 'idle' ? null : state.input
  const dragOverId = activeInput ? performances[activeInput.targetIndex]?.id ?? null : null
  const outcomeMessage = state.latestOutcome?.code === 'success'
    ? t('live_control.reordered_feedback')
    : state.latestOutcome
      ? outcomeError(
          state.latestOutcome,
          t('live_control.reorder_conflict', 'The Live Queue changed. Reload it and reapply your order.'),
        )
      : null
  const conflictMessage = state.conflict
    ? t('live_control.reorder_conflict', 'The Live Queue changed. Reload it and reapply your order.')
    : null
  const queueFeedback = error ?? conflictMessage ?? outcomeMessage
  const queueFeedbackType = !error && !conflictMessage && state.latestOutcome?.code === 'success'
    ? 'success' as const
    : 'error' as const

  if (isLoading && !currentPerformance && performances.length === 0) {
    return (
      <div className="space-y-6">
        <DataCard className="p-8 text-center">
          <span className="loading loading-spinner loading-lg" />
          <p className="text-base-content/60 mt-4">{t('common.loading')}</p>
        </DataCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {currentPerformance ? (
        <NowPlayingCard currentPerformance={currentPerformance} />
      ) : (
        <DataCard className="p-6 text-center">
          <p className="text-base-content/60">{t('live_control.no_song_playing')}</p>
          <p className="text-sm text-base-content/50 mt-1">{t('live_control.start_to_begin')}</p>
        </DataCard>
      )}

      <DataCard as="section" className="p-6">
        {queueFeedback && (
          <Alert
            type={queueFeedbackType}
            message={queueFeedback}
            className="mb-4"
          />
        )}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-balance">
            {isReorderMode ? t('live_control.up_next') : t('live_control.queue_title')}
          </h3>
          {isReorderMode ? (
            <div className="flex items-center gap-2">
              <Action
                variant="quiet"
                state={isReordering ? 'disabled' : 'idle'}
                onClick={commands.cancelReorder}
              >
                <Action.Icon><X className="size-4" /></Action.Icon>
                <Action.Label>{t('live_control.reorder_cancel', 'Cancel')}</Action.Label>
              </Action>
              {isReordering ? (
                <Action
                  variant="primary"
                  state="loading"
                  loadingLabel={t('live_control.saving_order')}
                >
                  <Action.Label>{t('live_control.reorder_save', 'Save order')}</Action.Label>
                </Action>
              ) : (
                <Action variant="primary" onClick={() => { void commands.saveReorder() }}>
                  <Action.Icon><Check className="size-4" /></Action.Icon>
                  <Action.Label>{t('live_control.reorder_save', 'Save order')}</Action.Label>
                </Action>
              )}
            </div>
          ) : performances.length > 1 ? (
            <Action variant="quiet" onClick={commands.beginReorder}>
              <Action.Icon><ArrowUpDown className="size-4" /></Action.Icon>
              <Action.Label>{t('live_control.reorder_drag', 'Arrastar')}</Action.Label>
            </Action>
          ) : null}
        </div>

        {isReorderMode && performances.length > 1 && (
          <>
            <p className="text-xs text-base-content/50 mb-2 md:hidden">{t('live_control.reorder_hint_mobile')}</p>
            <p className="sr-only">{t('live_control.reorder_hint_keyboard', 'Use arrow keys to reorder songs')}</p>
          </>
        )}

        {performances.length > 0 ? (
          <div
            ref={interactions.setSurfaceNode}
            className={'space-y-2 ' + (isReorderMode ? 'border-2 border-dashed border-primary/20 rounded-xl p-2 touch-none' : '')}
            role="list"
            aria-label={t('live_control.up_next')}
          >
            {performances.map((performance) => (
              <QueueItem
                key={performance.id}
                performance={performance}
                isReorderMode={isReorderMode}
                isReordering={isReordering}
                isDragging={activeInput?.performanceId === performance.id}
                isDragOver={dragOverId === performance.id && activeInput?.performanceId !== performance.id}
                onDragStart={interactions.onDragStart}
                onDragOver={interactions.onDragOver}
                onDragEnd={interactions.onDragEnd}
                onDrop={interactions.onDrop}
                onKeyDown={interactions.onKeyDown}
                onRefChange={interactions.setItemNode}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-base-content/60 py-4">{t('live_control.no_more_songs')}</p>
        )}
      </DataCard>
    </div>
  )
}
