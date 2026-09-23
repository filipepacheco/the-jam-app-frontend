/**
 * Performance Selection Modal Component
 * Shows all available performances for the user to choose from
 */

import { useTranslation } from 'react-i18next'
import type { ScheduleResponseDto, RegistrationResponseDto } from '../../types/api.types'
import { Modal } from '../Modal'
import { Action } from '../Action'
import { Badge, type DataDisplayTone } from '../data-display'
import { CanonicalEmptyState } from '../FeedbackStates'
import { formatJamDuration } from '../../lib/formatters'
import {isActiveRegistration} from '../../utils/musicianUtils'
import {getDisplayScheduleStatus} from '../../lib/schedule/statusHelpers'

function scheduleStatusTone(status: ScheduleResponseDto['status'] | 'PAUSED'): DataDisplayTone {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'IN_PROGRESS':
    case 'PAUSED':
      return 'warning'
    case 'SUGGESTED':
      return 'info'
    default:
      return 'neutral'
  }
}

interface PerformanceSelectionModalProps {
  performances: ScheduleResponseDto[]
  isOpen: boolean
  onClose: () => void
  onSelectPerformance: (schedule: ScheduleResponseDto) => void
  userId?: string
}

export function PerformanceSelectionModal({
  performances,
  isOpen,
  onClose,
  onSelectPerformance,
  userId,
}: PerformanceSelectionModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  // Helper to check if user is already registered for a performance
  const isAlreadyRegistered = (schedule: ScheduleResponseDto) => {
    if (!userId) return false
    return schedule.registrations?.some(
      (reg: RegistrationResponseDto) => isActiveRegistration(reg) && (reg.musician?.id === userId || reg.musicianId === userId)
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('jams.select_performance')}
      size="md"
      footer={
        <Action onClick={onClose} variant="quiet" className="w-full">
          {t('common.cancel')}
        </Action>
      }
    >
      <p className="text-sm text-base-content/70 mb-4">
        {t('jams.select_performance_desc')}
      </p>

      {/* Performance List */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto mb-4">
        {performances.map((schedule) => {
          const alreadyRegistered = isAlreadyRegistered(schedule)
          const displayStatus = getDisplayScheduleStatus(schedule)

          return (
            /* Documented exception: this selectable performance card stays a
               hand-rolled button. Action renders one canonical control shell, so
               it cannot hold this multi-line card layout. See
               docs/design-system/jam-music-migration.md. */
            <button
              key={schedule.id}
              onClick={() => {
                onSelectPerformance(schedule)
              }}
              className={`w-full text-left p-4 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                alreadyRegistered
                  ? 'bg-success/10 border-2 border-success/30 hover:bg-success/15'
                  : 'bg-base-200 hover:bg-base-300'
              }`}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="ds-wrap-user-content font-bold text-sm sm:text-base">
                      {schedule.music?.title}
                    </h4>
                    {alreadyRegistered && (
                      <Badge tone="success" size="sm">
                        {t('schedule.already_enrolled')}
                      </Badge>
                    )}
                  </div>
                  <p className="ds-wrap-user-content text-xs sm:text-sm text-base-content/70">
                    {schedule.music?.artist}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-base-content/60">
                    <span>
                      <span aria-hidden="true">⏱️</span>{' '}
                      {formatJamDuration(schedule.music?.duration || 0)}
                    </span>
                    <span>
                      <span aria-hidden="true">👥</span>{' '}
                      {schedule.registrations?.length || 0} {t('jams.info.musicians')}
                    </span>
                  </div>
                </div>
                {!alreadyRegistered && (
                  <Badge tone={scheduleStatusTone(displayStatus)} size="sm" className="flex-shrink-0">
                    {displayStatus === 'COMPLETED' && t('schedule.statuses.completed')}
                    {displayStatus === 'IN_PROGRESS' && t('schedule.statuses.in_progress')}
                    {displayStatus === 'PAUSED' && t('schedule.statuses.paused')}
                    {displayStatus === 'SUGGESTED' && t('common.statuses.suggested')}
                    {displayStatus === 'SCHEDULED' && t('schedule.statuses.scheduled')}
                  </Badge>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Empty State */}
      {performances.length === 0 && (
        <CanonicalEmptyState
          kind="content"
          icon="🎵"
          title={t('jams.no_performances_available')}
        />
      )}
    </Modal>
  )
}
