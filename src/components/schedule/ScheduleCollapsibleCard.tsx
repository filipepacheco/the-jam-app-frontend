/**
 * ScheduleCollapsibleCard - Collapsed/expanded schedule card
 * Collapsed: ~44px row with order, title, fill indicator, status dot, chevron
 * Expanded: full details with instruments, musicians, notes, actions
 */

import { useState, useEffect, useCallback, memo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ScheduleResponseDto } from '../../types/api.types'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { InstrumentBadges } from './InstrumentBadges'
import { NotesEditor } from './NotesEditor'
import { ScheduleOverflowMenu } from './ScheduleOverflowMenu'
import { MusicianSlotList } from './MusicianSlotList'
import { SlotFillIndicator } from './SlotFillIndicator'
import { StatusDot } from './StatusDot'
import { countActiveRegistrationsByInstrument, CORE_BAND } from '../../utils/scheduleUtils'

interface ScheduleCollapsibleCardProps {
  schedule: ScheduleResponseDto
  loading?: boolean
  isSuggested?: boolean
  defaultExpanded?: boolean
  notes?: string | null
  jamMusicId?: string
  onStatusChange?: (scheduleId: string, status: string) => void
  onDelete?: (scheduleId: string) => void
  onApproveRegistration?: (registrationId: string) => void
  onRejectRegistration?: (registrationId: string) => void
  onDeleteRegistration?: (registrationId: string) => void
  onAddMusician?: (scheduleId: string) => void
  onMusicianClick?: (musicianId: string) => void
  onSaveNotes?: (jamMusicId: string, notes: string) => void
  onApproveAllRegistrations?: (scheduleId: string) => void
}

export const ScheduleCollapsibleCard = memo(function ScheduleCollapsibleCard({
  schedule,
  loading = false,
  isSuggested = false,
  defaultExpanded = false,
  onStatusChange,
  onDelete,
  onApproveRegistration,
  onRejectRegistration,
  onDeleteRegistration,
  onAddMusician,
  onMusicianClick,
  notes,
  jamMusicId,
  onSaveNotes,
  onApproveAllRegistrations,
}: ScheduleCollapsibleCardProps) {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const music = schedule.music
  const pendingCount = schedule.registrations?.filter(r => r.status === 'PENDING').length || 0
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Auto-expand IN_PROGRESS cards
  useEffect(() => {
    if (schedule.status === 'IN_PROGRESS') setIsExpanded(true)
  }, [schedule.status])

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleExpand()
    }
  }, [toggleExpand])

  // Readiness for scheduled items: ready (core band complete), partial, empty
  const getReadinessClass = () => {
    const { counts, activeCount } = countActiveRegistrationsByInstrument(schedule.registrations)
    if (activeCount === 0) return 'border-l-4 border-l-base-300 bg-base-200'
    const bandComplete = CORE_BAND.every(inst => (counts[inst] || 0) >= 1)
    return bandComplete
      ? 'border-l-4 border-l-success bg-success/5'
      : 'border-l-4 border-l-warning bg-warning/5'
  }

  // Border styling based on status, with readiness coloring for scheduled items
  const borderClass = schedule.status === 'IN_PROGRESS'
    ? 'border-l-4 border-l-warning bg-warning/5'
    : schedule.status === 'COMPLETED'
      ? 'border-l-4 border-l-success/30 text-base-content/60'
      : schedule.status === 'CANCELED'
        ? 'border-l-4 border-l-base-300 text-base-content/40'
        : isSuggested
          ? 'border-l-4 border-l-info bg-info/5'
          : getReadinessClass()

  return (
    <div className={`rounded-lg ${borderClass}`}>
      {/* Collapsed row - always visible */}
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer select-none"
        onClick={toggleExpand}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${music?.title} - ${music?.artist}`}
      >
        {/* Order badge */}
        {!isSuggested && (
          <span className="badge badge-xs badge-neutral font-bold tabular-nums shrink-0">
            {schedule.order}
          </span>
        )}

        {/* Title + artist */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">
            {music?.title || t('schedule.song_tba')}
          </p>
          <p className="truncate text-xs text-base-content/50 leading-tight">
            {music?.artist || t('schedule.artist_tba')}
          </p>
        </div>

        {/* Fill indicator - hidden on mobile, visible in expanded view */}
        {/*<div className="hidden sm:flex">*/}
          <SlotFillIndicator registrations={schedule.registrations} music={music} />
        {/*</div>*/}

        {/* Pending approval count - hidden on mobile */}
        {pendingCount > 0 && schedule.status !== 'COMPLETED' && schedule.status !== 'CANCELED' && (
          <span
            className="hidden sm:inline-flex badge badge-xs badge-outline badge-warning font-semibold shrink-0"
            title={t('schedule.pending_approvals', { count: pendingCount })}
          >
            {pendingCount} {t('schedule.pending_short', 'pending')}
          </span>
        )}

        {/* Status dot */}
        <StatusDot status={schedule.status} />

        {/* Suggested: inline approve/reject, others: chevron */}
        {isSuggested ? (
          <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-sm btn-success btn-square"
              onClick={() => onStatusChange?.(schedule.id, 'SCHEDULED')}
              disabled={loading}
              title={t('common.approve')}
              aria-label={t('common.approve')}
            >
              ✓
            </button>
            <button
              className="btn btn-sm btn-error btn-square"
              onClick={() => onDelete?.(schedule.id)}
              disabled={loading}
              title={t('common.reject')}
              aria-label={t('common.reject')}
            >
              ✕
            </button>
          </div>
        ) : (
          <ChevronDown
            className={`size-4 text-base-content/40 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        )}
      </div>

      {/* Expanded detail panel */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, overflow: 'visible' }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0, overflow: 'hidden' }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-2.5 pb-2.5 pt-1 border-t border-base-300/30 space-y-1.5">
              {/* Instrument badges */}
              <InstrumentBadges
                neededDrums={music?.neededDrums}
                neededGuitars={music?.neededGuitars}
                neededVocals={music?.neededVocals}
                neededBass={music?.neededBass}
                neededKeys={music?.neededKeys}
                duration={music?.duration}
                badgeSize="badge-sm"
              />

              {/* Notes section */}
              {(notes || onSaveNotes) && jamMusicId && (
                <NotesEditor
                  notes={notes}
                  jamMusicId={jamMusicId}
                  loading={loading}
                  onSave={onSaveNotes}
                />
              )}

              {/* Musician slots */}
              <MusicianSlotList
                registrations={schedule.registrations}
                loading={loading}
                showActions={schedule.status !== 'COMPLETED' && schedule.status !== 'CANCELED'}
                onApprove={onApproveRegistration}
                onReject={onRejectRegistration}
                onDelete={onDeleteRegistration}
                onMusicianClick={onMusicianClick}
                neededDrums={music?.neededDrums}
                neededGuitars={music?.neededGuitars}
                neededBass={music?.neededBass}
                neededVocals={music?.neededVocals}
                neededKeys={music?.neededKeys}
              />

              {/* Actions row */}
              {!isSuggested && (
                <div className="flex items-center gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                  <div className="flex-1" />
                  <ScheduleOverflowMenu
                    status={schedule.status}
                    loading={loading}
                    hasPendingRegistrations={pendingCount > 0}
                    onStatusChange={(status) => onStatusChange?.(schedule.id, status)}
                    onDelete={() => onDelete?.(schedule.id)}
                    onAddMusician={() => onAddMusician?.(schedule.id)}
                    onApproveAll={() => onApproveAllRegistrations?.(schedule.id)}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
