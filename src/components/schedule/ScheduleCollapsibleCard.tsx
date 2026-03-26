/**
 * ScheduleCollapsibleCard - Collapsed/expanded schedule card
 * Collapsed: ~44px row with order, title, fill indicator, status dot, chevron
 * Expanded: full details with instruments, musicians, notes, actions
 */

import { useState, useEffect, useCallback } from 'react'
import type { ScheduleResponseDto } from '../../types/api.types'
import { useTranslation } from 'react-i18next'
import { ChevronDown, FileText, Pencil } from 'lucide-react'
import { InstrumentBadges } from './InstrumentBadges'
import { ScheduleOverflowMenu } from './ScheduleOverflowMenu'
import { MusicianSlotList } from './MusicianSlotList'
import { SlotFillIndicator } from './SlotFillIndicator'
import { StatusDot } from './StatusDot'

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
  onAddMusician?: () => void
  onMusicianClick?: (musicianId: string) => void
  onSaveNotes?: (jamMusicId: string, notes: string) => void
}

export function ScheduleCollapsibleCard({
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
}: ScheduleCollapsibleCardProps) {
  const { t } = useTranslation()
  const music = schedule.music
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(notes || '')

  // Auto-expand IN_PROGRESS cards
  useEffect(() => {
    if (schedule.status === 'IN_PROGRESS') setIsExpanded(true)
  }, [schedule.status])

  useEffect(() => {
    if (!editingNotes) setNotesValue(notes || '')
  }, [notes, editingNotes])

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleExpand()
    }
  }, [toggleExpand])

  // Border styling based on status
  const borderClass = schedule.status === 'IN_PROGRESS'
    ? 'border-l-4 border-l-warning bg-warning/5'
    : schedule.status === 'COMPLETED'
      ? 'border-l-4 border-l-success/30 opacity-60'
      : isSuggested
        ? 'border-l-4 border-l-info bg-info/5'
        : 'border-l-4 border-l-primary/30 bg-base-200'

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

        {/* Fill indicator */}
        <SlotFillIndicator registrations={schedule.registrations} music={music} />

        {/* Status dot */}
        <StatusDot status={schedule.status} />

        {/* Suggested: inline approve/reject, others: chevron */}
        {isSuggested ? (
          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-xs btn-success btn-square"
              onClick={() => onStatusChange?.(schedule.id, 'SCHEDULED')}
              disabled={loading}
              title={t('common.approve')}
            >
              ✓
            </button>
            <button
              className="btn btn-xs btn-error btn-square"
              onClick={() => onDelete?.(schedule.id)}
              disabled={loading}
              title={t('common.reject')}
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
      {isExpanded && (
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
            <div>
              {editingNotes ? (
                <div className="space-y-1">
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    className="textarea textarea-bordered textarea-xs w-full text-xs"
                    rows={2}
                    maxLength={2000}
                    placeholder={t('schedule.notes_placeholder')}
                    autoFocus
                  />
                  <div className="flex gap-1 justify-end">
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={() => { setEditingNotes(false); setNotesValue(notes || '') }}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      className="btn btn-xs btn-primary"
                      disabled={loading}
                      onClick={() => {
                        onSaveNotes?.(jamMusicId, notesValue)
                        setEditingNotes(false)
                      }}
                    >
                      {t('common.save')}
                    </button>
                  </div>
                </div>
              ) : notes ? (
                <div className="flex items-start gap-1 text-xs text-base-content/70 bg-base-100 rounded px-2 py-1">
                  <FileText className="w-3 h-3 mt-0.5 shrink-0 text-base-content/40" />
                  <p className="whitespace-pre-line flex-1 min-w-0">{notes}</p>
                  {onSaveNotes && (
                    <button
                      className="btn btn-ghost btn-xs btn-circle shrink-0"
                      onClick={() => setEditingNotes(true)}
                      title={t('schedule.edit_notes')}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : onSaveNotes ? (
                <button
                  className="btn btn-xs btn-ghost text-base-content/40 gap-1"
                  onClick={() => setEditingNotes(true)}
                >
                  <FileText className="w-3 h-3" />
                  {t('schedule.add_notes')}
                </button>
              ) : null}
            </div>
          )}

          {/* Musician slots */}
          <MusicianSlotList
            registrations={schedule.registrations}
            loading={loading}
            showActions={schedule.status !== 'COMPLETED' && schedule.status !== 'CANCELED'}
            onApprove={onApproveRegistration}
            onReject={onRejectRegistration}
            onDelete={onDeleteRegistration}
            onAddMusician={onAddMusician}
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
                onStatusChange={(status) => onStatusChange?.(schedule.id, status)}
                onDelete={() => onDelete?.(schedule.id)}
                onAddMusician={onAddMusician}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
