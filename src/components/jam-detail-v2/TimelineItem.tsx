import type {ScheduleResponseDto} from '../../types/api.types'
import type {AuthUser} from '../../types/auth.types'
import {useTranslation} from 'react-i18next'
import {getInstrumentIcon} from '../../lib/schedule/instrumentHelpers'
import {formatJamDuration} from '../../lib/formatters'
import {Action} from '../Action'
import {Badge, type DataDisplayTone} from '../data-display'

function scheduleStatusTone(status: ScheduleResponseDto['status']): DataDisplayTone {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'IN_PROGRESS':
      return 'warning'
    case 'SUGGESTED':
      return 'info'
    default:
      return 'neutral'
  }
}

interface TimelineItemProps {
  schedule: ScheduleResponseDto
  user: AuthUser | null
  onRegisterClick: () => void
}

export function TimelineItem({
  schedule,
  user,
  onRegisterClick,
}: TimelineItemProps) {
  const { t } = useTranslation()

  const userRegistered = user?.id
    ? schedule.registrations?.some(
        (reg) => reg.musician?.id === user.id
      )
    : false

  return (
    <div className="card bg-gradient-to-br from-base-200 to-base-300 shadow-lg hover:shadow-xl transition-shadow">
      <div className="card-body p-4 sm:p-5">

        {/* Status Badge */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">
              {schedule.status === 'SUGGESTED' ? t('jams.suggested') : t('jams.scheduled')}
            </p>
          </div>
          <Badge tone={scheduleStatusTone(schedule.status)}>
            {schedule.status === 'COMPLETED' && t('schedule.statuses.completed')}
            {schedule.status === 'IN_PROGRESS' && t('schedule.statuses.in_progress')}
            {schedule.status === 'SUGGESTED' && t('common.statuses.suggested')}
            {schedule.status === 'SCHEDULED' && t('schedule.statuses.scheduled')}
          </Badge>
        </div>

        {/* Song Info (Prominent) */}
        <div className="mb-4">
          <h3 className="text-lg sm:text-xl font-bold truncate">
            {schedule.music?.title}
          </h3>
          <p className="text-sm text-base-content/70 truncate">
            {schedule.music?.artist}
          </p>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-y border-base-300/30">
          {/* Duration */}
          <div>
            <p className="text-xs text-base-content/60 font-semibold">{t('jams.info.duration')}</p>
            <p className="font-bold tabular-nums"><span aria-hidden="true">⏱️</span> {formatJamDuration(schedule.music?.duration || 0)}</p>
          </div>

          {/* Musicians Registered */}
          <div>
            <p className="text-xs text-base-content/60 font-semibold">{t('jams.info.musicians')}</p>
            <p className="font-bold tabular-nums">
              <span aria-hidden="true">👥</span> {schedule.registrations?.length || 0}
            </p>
          </div>

          {/* Needed Instruments */}
          <div>
            <p className="text-xs text-base-content/60 font-semibold">{t('jams.instruments')}</p>
            <p className="font-bold tabular-nums"><span aria-hidden="true">🎸</span> {schedule.registrations?.length || 0}</p>
          </div>
        </div>

        {/* Instruments Breakdown */}
        {schedule.registrations && schedule.registrations.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {schedule.registrations.map((reg) => (
              <Badge key={reg.id} size="sm" aria-hidden="true">
                {getInstrumentIcon(reg.instrument)}
              </Badge>
            ))}
          </div>
        )}

        {/* Quick Register Button */}
        <Action
          onClick={onRegisterClick}
          state={userRegistered ? 'disabled' : 'idle'}
          className="w-full"
        >
          {userRegistered ? (
            t('schedule.already_enrolled')
          ) : (
            <>
              <span className="text-lg" aria-hidden="true">+</span>
              {t('jams.register')}
            </>
          )}
        </Action>
      </div>
    </div>
  )
}
