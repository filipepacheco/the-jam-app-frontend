/**
 * ScheduleCollapsibleCard - Collapsed/expanded schedule card
 * Collapsed: ~44px row with order, title, fill indicator, status dot, chevron
 * Expanded: full details with instruments, musicians, notes, actions
 */

import React, { useState, useEffect, useCallback, memo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ScheduleResponseDto } from '../../types/api.types'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, X } from 'lucide-react'
import { IconAction } from '../Action'
import { DataCard } from '../data-display'
import { InstrumentBadges } from './InstrumentBadges'
import { NotesEditor } from './NotesEditor'
import { ScheduleOverflowMenu } from './ScheduleOverflowMenu'
import { MusicianSlotList } from './MusicianSlotList'
import { SlotFillIndicator } from './SlotFillIndicator'
import { StatusDot } from './StatusDot'
import {getDisplayScheduleStatus} from '../../lib/schedule/statusHelpers'
import { countActiveRegistrationsByInstrument, CORE_BAND } from '../../utils/scheduleUtils'

interface ScheduleCollapsibleCardProps {
  schedule: ScheduleResponseDto
  loading?: boolean
  isSuggested?: boolean
  priority?: 'current' | 'queue' | 'secondary'
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
  onEditMusic?: (musicId: string) => void
}

export const ScheduleCollapsibleCard = memo(function ScheduleCollapsibleCard({
  schedule,
  loading = false,
  isSuggested = false,
  priority = 'queue',
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
  onEditMusic,
}: ScheduleCollapsibleCardProps) {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const music = schedule.music
  const displayStatus = getDisplayScheduleStatus(schedule)
  const pendingCount = schedule.registrations?.filter(r => r.status === 'PENDING').length || 0
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Auto-expand IN_PROGRESS cards
  useEffect(() => {
    if (displayStatus === 'IN_PROGRESS') setIsExpanded(true)
  }, [displayStatus])

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  // Readiness for scheduled items: ready (core band complete), partial, empty
  const getReadinessClass = () => {
    const { counts, activeCount } = countActiveRegistrationsByInstrument(schedule.registrations)
    if (activeCount === 0) return 'bg-base-200'
    const bandComplete = CORE_BAND.every(inst => (counts[inst] || 0) >= 1)
    return bandComplete
      ? 'bg-success/10'
      : 'bg-warning/10'
  }

  // Keep the current Performance visually dominant. Suggested and completed
  // Performances remain available without competing with the live Schedule.
  const surfaceClass = priority === 'current'
    ? 'border-warning bg-warning/10 shadow-sm'
    : priority === 'secondary'
      ? 'border-base-300/60 bg-base-200/40 text-base-content/65'
      : getReadinessClass()

  return (
    <DataCard
      as="article"
      density="compact"
      className={`relative overflow-visible p-0 ${surfaceClass}`}
      data-performance-priority={priority}
    >
      {/* Collapsed row - always visible */}
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <button
          type="button"
          className="ds-focusable flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-field)] text-left"
          onClick={toggleExpand}
          aria-controls={`schedule-details-${schedule.id}`}
          aria-expanded={isExpanded}
          aria-label={`${music?.title || t('schedule.song_tba')} - ${music?.artist || t('schedule.artist_tba')}`}
        >
          {/* Order badge */}
          {!isSuggested && (
            <span className="badge badge-xs badge-neutral font-bold tabular-nums shrink-0">
              {schedule.order}
            </span>
          )}

          {/* Title + artist */}
          <span className="flex-1 min-w-0">
            <span className="ds-wrap-user-content block text-sm font-semibold leading-tight">
              {music?.title || t('schedule.song_tba')}
            </span>
            <span className="ds-truncate-single block text-xs text-base-content/70 leading-tight">
              {music?.artist || t('schedule.artist_tba')}
            </span>
          </span>

          <SlotFillIndicator registrations={schedule.registrations} music={music} />

          <StatusDot status={displayStatus} />

          {!isSuggested && (
            <ChevronDown
              className={`size-4 shrink-0 text-base-content/60 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          )}
        </button>

        {!isSuggested && (
          <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
            <ScheduleOverflowMenu
              status={schedule.status}
              loading={loading}
              hasPendingRegistrations={pendingCount > 0}
              onStatusChange={(status) => onStatusChange?.(schedule.id, status)}
              onDelete={() => onDelete?.(schedule.id)}
              onAddMusician={() => onAddMusician?.(schedule.id)}
              onApproveAll={() => onApproveAllRegistrations?.(schedule.id)}
              onEditMusic={music?.id ? () => onEditMusic?.(music.id) : undefined}
            />
          </div>
        )}

        {isSuggested && (
          <div className="flex gap-1.5 shrink-0">
            <IconAction
              variant="primary"
              label={t('common.approve')}
              onClick={() => onStatusChange?.(schedule.id, 'SCHEDULED')}
              state={loading ? 'disabled' : 'idle'}
            >
              <Check size={16} />
            </IconAction>
            <IconAction
              variant="destructive"
              label={t('common.reject')}
              onClick={() => onDelete?.(schedule.id)}
              state={loading ? 'disabled' : 'idle'}
            >
              <X size={16} />
            </IconAction>
          </div>
        )}
      </div>

      {/* Expanded detail panel */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeInOut' }}
          >
            <div id={`schedule-details-${schedule.id}`} className="px-2.5 pb-2.5 pt-1 border-t border-base-300/30 space-y-1.5">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DataCard>
  )
})
