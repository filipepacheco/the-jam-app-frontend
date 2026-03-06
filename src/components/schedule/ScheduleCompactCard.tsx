/**
 * ScheduleCompactCard - Mobile-first compact schedule card
 * Replaces ScheduleCardManagement with a denser layout:
 * - Row 1: Order badge + title/artist + status badge + overflow menu
 * - Row 2: InstrumentBadges (badge-sm)
 * - Row 3+: MusicianSlotList (compact rows)
 *
 * ~110-130px per card vs ~350-400px for ScheduleCardManagement
 */

import { useState, useEffect } from 'react'
import type { ScheduleResponseDto } from '../../types/api.types'
import { useTranslation } from 'react-i18next'
import { FileText, Pencil } from 'lucide-react'
import { ScheduleStatusBadge } from './ScheduleStatusBadge'
import { InstrumentBadges } from './InstrumentBadges'
import { ScheduleOverflowMenu } from './ScheduleOverflowMenu'
import { MusicianSlotList } from './MusicianSlotList'

interface ScheduleCompactCardProps {
  schedule: ScheduleResponseDto
  loading?: boolean
  isSuggested?: boolean
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

export function ScheduleCompactCard({
  schedule,
  loading = false,
  isSuggested = false,
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
}: ScheduleCompactCardProps) {
  const { t } = useTranslation()
  const music = schedule.music
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(notes || '')

  useEffect(() => {
    if (!editingNotes) setNotesValue(notes || '')
  }, [notes, editingNotes])

  // Card border style based on status
  const borderClass = schedule.status === 'IN_PROGRESS'
    ? 'border-l-4 border-l-warning bg-warning/10'
    : isSuggested
      ? 'border-l-4 border-l-info bg-info/5'
      : 'border-l-4 border-l-primary/30 bg-base-200'

  return (
    <div className={`card shadow-sm ${borderClass}`}>
      <div className="card-body p-2.5 lg:p-4 gap-1">
        {/* Row 1: Order + Title/Artist + Status + Actions */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Order badge */}
          {!isSuggested && (
            <span className="badge badge-sm badge-info font-bold flex-shrink-0">
              #{schedule.order}
            </span>
          )}

          {/* Title and artist */}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {music?.title || t('schedule.song_tba')}
            </p>
            <p className="truncate text-xs text-base-content/60 leading-tight">
              {t('common.by')} {music?.artist || t('schedule.artist_tba')}
              {music?.genre && (
                <span className="hidden lg:inline"> - {music.genre}</span>
              )}
            </p>
          </div>

          {/* Status badge */}
          <div className="flex-shrink-0">
            <ScheduleStatusBadge status={schedule.status} isSuggested={isSuggested} />
          </div>

          {/* Actions: suggested gets inline approve/reject, others get overflow menu */}
          <div className="flex-shrink-0">
            {isSuggested ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onStatusChange?.(schedule.id, 'SCHEDULED')}
                  className="btn btn-xs btn-success"
                  disabled={loading}
                >
                  {t('common.approve')}
                </button>
                <button
                  onClick={() => onDelete?.(schedule.id)}
                  className="btn btn-xs btn-error"
                  disabled={loading}
                >
                  {t('common.reject')}
                </button>
              </div>
            ) : (
              <ScheduleOverflowMenu
                status={schedule.status}
                loading={loading}
                onStatusChange={(status) => onStatusChange?.(schedule.id, status)}
                onDelete={() => onDelete?.(schedule.id)}
                onAddMusician={onAddMusician}
              />
            )}
          </div>
        </div>

        {/* Row 2: Instrument badges */}
        <InstrumentBadges
          neededDrums={music?.neededDrums}
          neededGuitars={music?.neededGuitars}
          neededVocals={music?.neededVocals}
          neededBass={music?.neededBass}
          neededKeys={music?.neededKeys}
          duration={music?.duration}
          badgeSize="badge-sm"
        />

        {/* Arrangement notes */}
        {(notes || onSaveNotes) && jamMusicId && (
          <div className="mt-0.5">
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
                <FileText className="w-3 h-3 mt-0.5 flex-shrink-0 text-base-content/40" />
                <p className="whitespace-pre-line flex-1 min-w-0">{notes}</p>
                {onSaveNotes && (
                  <button
                    className="btn btn-ghost btn-xs btn-circle flex-shrink-0"
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

        {/* Row 3+: Musician slot rows */}
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
      </div>
    </div>
  )
}
