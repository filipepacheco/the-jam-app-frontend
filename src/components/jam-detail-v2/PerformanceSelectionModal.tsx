/**
 * Performance Selection Modal Component
 * Shows all available performances for the user to choose from
 */

import { useTranslation } from 'react-i18next'
import type { ScheduleResponseDto, RegistrationResponseDto } from '../../types/api.types'
import { Modal } from '../Modal'
import { formatJamDuration } from '../../lib/formatters'

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
      (reg: RegistrationResponseDto) => reg.musician?.id === userId
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('jams.select_performance')}
      size="md"
      footer={
        <button
          onClick={onClose}
          className="btn btn-ghost w-full"
          type="button"
        >
          {t('common.cancel')}
        </button>
      }
    >
      <p className="text-sm text-base-content/70 mb-4">
        {t('jams.select_performance_desc')}
      </p>

      {/* Performance List */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto mb-4">
        {performances.map((schedule) => {
          const alreadyRegistered = isAlreadyRegistered(schedule)

          return (
            <button
              key={schedule.id}
              onClick={() => {
                onSelectPerformance(schedule)
                onClose()
              }}
              className={`w-full text-left p-4 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                alreadyRegistered
                  ? 'bg-success/10 border-2 border-success/30 cursor-default'
                  : 'bg-base-200 hover:bg-base-300'
              }`}
              type="button"
              disabled={alreadyRegistered}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-sm sm:text-base truncate">
                      {schedule.music?.title}
                    </h4>
                    {alreadyRegistered && (
                      <span className="badge badge-success badge-sm">
                        {t('schedule.already_enrolled')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-base-content/70 truncate">
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
                  <span
                    className={`badge badge-sm flex-shrink-0 ${
                      schedule.status === 'COMPLETED'
                        ? 'badge-success'
                        : schedule.status === 'IN_PROGRESS'
                        ? 'badge-warning'
                        : schedule.status === 'SUGGESTED'
                        ? 'badge-info'
                        : 'badge-ghost'
                    }`}
                  >
                    {schedule.status === 'COMPLETED' && t('schedule.statuses.completed')}
                    {schedule.status === 'IN_PROGRESS' && t('schedule.statuses.in_progress')}
                    {schedule.status === 'SUGGESTED' && t('common.statuses.suggested')}
                    {schedule.status === 'SCHEDULED' && t('schedule.statuses.scheduled')}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Empty State */}
      {performances.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3" aria-hidden="true">🎵</div>
          <p className="text-sm font-semibold">{t('jams.no_performances_available')}</p>
        </div>
      )}
    </Modal>
  )
}
