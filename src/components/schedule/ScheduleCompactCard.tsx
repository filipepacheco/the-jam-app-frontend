/**
 * ScheduleCompactCard - Mobile-first compact schedule card
 * Replaces ScheduleCardManagement with a denser layout:
 * - Row 1: Order badge + title/artist + status badge + overflow menu
 * - Row 2: InstrumentBadges (badge-sm)
 * - Row 3+: MusicianSlotList (compact rows)
 *
 * ~110-130px per card vs ~350-400px for ScheduleCardManagement
 */

import type { ScheduleResponseDto } from '../../types/api.types'
import { useTranslation } from 'react-i18next'
import { ScheduleStatusBadge } from './ScheduleStatusBadge'
import { InstrumentBadges } from './InstrumentBadges'
import { NotesEditor } from './NotesEditor'
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
                  className="btn btn-sm btn-success"
                  disabled={loading}
                >
                  {t('common.approve')}
                </button>
                <button
                  onClick={() => onDelete?.(schedule.id)}
                  className="btn btn-sm btn-error"
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
            <NotesEditor
              notes={notes}
              jamMusicId={jamMusicId}
              loading={loading}
              onSave={onSaveNotes}
            />
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
