import type {RegistrationResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {useTranslation} from 'react-i18next'
import {useReducedMotion} from '../../hooks'
import {getInstrumentIcon} from '../../lib/schedule/instrumentHelpers'
import {isScheduleReadyToPlay, getInstrumentOptions} from '../../utils/scheduleUtils'
import {InstrumentsSummary} from '../schedule/InstrumentsSummary'
import React, {useCallback, useMemo} from "react"

interface TimelineUser {
  id: string
  name?: string | null
}

interface TimelineItemV2Props {
  schedule: ScheduleResponseDto
  user: TimelineUser | null
  onRegisterClick: () => void
  position?: number
  isExpanded?: boolean
  onToggleExpanded?: () => void
}

export function TimelineItemV2Waveform({
  schedule,
  user,
  onRegisterClick,
  position,
  isExpanded = false,
  onToggleExpanded,
}: TimelineItemV2Props) {
  const { t } = useTranslation()
  const { prefersReducedMotion } = useReducedMotion()

  const userRegistered = user?.id
    ? schedule.registrations?.some(
        (reg: RegistrationResponseDto) => reg.musician?.id === user.id
      )
    : false

  const handleCardClick = useCallback(() => {
    onToggleExpanded?.()
  }, [onToggleExpanded])

  const handleCardKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggleExpanded?.()
    }
  }, [onToggleExpanded])

  const handleRegisterClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onRegisterClick()
  }, [onRegisterClick])

  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleExpanded?.()
  }, [onToggleExpanded])

  // Memoize status-based styling
  const { bgClasses, borderClasses, isCompleted, isInProgress, isSuggested } = useMemo(() => {
    const completed = schedule.status === 'COMPLETED'
    const inProgress = schedule.status === 'IN_PROGRESS'
    const suggested = schedule.status === 'SUGGESTED'

    let bg = 'bg-linear-to-br from-base-100 to-base-200'
    let border = 'border border-base-300'

    if (completed) {
      bg = 'bg-linear-to-br from-success/10 to-success/5'
      border = 'border border-success/30'
    } else if (inProgress) {
      bg = 'bg-linear-to-br from-primary/15 to-primary/5'
      border = 'border-2 border-primary shadow-lg shadow-primary/20'
    } else if (suggested) {
      bg = 'bg-linear-to-br from-info/10 to-info/5'
      border = 'border border-info/30'
    }

    return { bgClasses: bg, borderClasses: border, isCompleted: completed, isInProgress: inProgress, isSuggested: suggested }
  }, [schedule.status])

  // Check if schedule is ready to play (all musician slots filled)
  const isReadyToPlay = !isCompleted && !isInProgress && !isSuggested && isScheduleReadyToPlay(schedule)

  // Get instrument options for showing available slots
  const instrumentOptions = useMemo(
    () => getInstrumentOptions(schedule, (key) => t(`schedule.instruments.${key}`)),
    [schedule, t]
  )

  // Memoize status object
  const status = useMemo(() => {
    if (isCompleted) return { icon: '✓', text: t('schedule.statuses.completed'), color: 'text-success' }
    if (isInProgress) return { icon: '▶', text: t('schedule.statuses.in_progress'), color: 'text-primary' }
    if (isSuggested) return { icon: '✨', text: t('common.statuses.suggested'), color: 'text-info' }
    if (isReadyToPlay) return { icon: '✓', text: t('schedule.statuses.ready_to_play'), color: 'text-success' }
    return { icon: '○', text: t('schedule.statuses.awaiting_registrations'), color: 'text-base-content/60' }
  }, [isCompleted, isInProgress, isSuggested, isReadyToPlay, t])

  return (
    <div
      role="button"
      tabIndex={0}
      className={`card w-full ${bgClasses} ${borderClasses} transition-shadow duration-300 cursor-pointer hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none text-left`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      aria-expanded={isExpanded}
      aria-label={`${schedule.music?.title} by ${schedule.music?.artist}. ${status.text}`}
    >
      <div className="card-body p-3">

        {/* Header: Grid layout for proper text truncation with status */}
        <div className="grid grid-cols-[auto_1fr_auto] items-start gap-2 mb-1">
          {position !== undefined ? (
            <div className="badge badge-neutral badge-sm font-bold shrink-0">
              #{position}
            </div>
          ) : <div />}
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-base-content mb-0.5 truncate">
              {schedule.music?.title}
            </h3>
            <p className="text-xs sm:text-sm text-base-content/70 truncate">
              {schedule.music?.artist}
            </p>
          </div>
          {/* Status - in grid, always takes its natural width */}
          <div className={`flex items-center gap-1 text-xs font-semibold ${status.color} shrink-0`}>
            <span className={`text-sm ${isInProgress && userRegistered && !prefersReducedMotion ? 'animate-pulse' : ''}`} aria-hidden="true">{status.icon}</span>
            <span className="whitespace-nowrap">{status.text}</span>
          </div>
        </div>

        {/* Musicians count and duration - same row */}
        <div className="flex items-center gap-4 text-xs text-base-content/60 mb-1.5">
          {schedule.registrations && schedule.registrations.length > 0 ? (
            <button
              onClick={handleExpandClick}
              className="flex items-center gap-1.5 hover:text-base-content/80 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded outline-none font-semibold"
              type="button"
              aria-expanded={isExpanded}
              aria-controls={`musician-list-${schedule.id}`}
            >
              <span aria-hidden="true">🎵</span>
              <span>{schedule.registrations.length} {schedule.registrations.length === 1 ? t('jams.info.musician') : t('jams.info.musicians')}</span>
              <span className="text-xs" aria-hidden="true">{isExpanded ? '▲' : '▼'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 text-warning font-semibold">
              <span aria-hidden="true">⚠</span>
              <span>{t('common.no_registrations_yet')}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span aria-hidden="true">⏱️</span>
            <span className="font-medium tabular-nums">
              {Math.floor((schedule.music?.duration || 0) / 60)}min
            </span>
          </div>
        </div>

        {/* Expandable musician list with animation */}
        {schedule.registrations && schedule.registrations.length > 0 && (
          <div
            id={`musician-list-${schedule.id}`}
            className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
              isExpanded ? 'max-h-96 opacity-100 mb-3' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex flex-wrap gap-2">
              {schedule.registrations.map((reg: RegistrationResponseDto) => (
                <div
                  key={reg.id}
                  className="inline-flex items-center gap-1.5 bg-base-200/50 px-2 py-1 rounded text-xs"
                >
                  <span aria-hidden="true">{getInstrumentIcon(reg.instrument)}</span>
                  <span className="font-medium">
                    {reg.musician?.id === user?.id ? t('common.you') : reg.musician?.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instruments still needed */}
        {!isCompleted && !isInProgress && (
          <InstrumentsSummary instrumentOptions={instrumentOptions} />
        )}

        {/* Register Button / Stage Call-to-Action */}
        {!isCompleted && (
          <>
            {/* IN_PROGRESS: Only show if user is registered */}
            {isInProgress ? (
              userRegistered ? (
                <div
                  className="alert alert-info text-sm font-semibold"
                  role="status"
                  aria-live="polite"
                >
                  <span className="text-base" aria-hidden="true">🎤</span>
                  {t('jams.go_to_stage')}
                </div>
              ) : null
            ) : (
              /* OTHER STATUSES: Show register button (always enabled for multi-instrument registration) */
              <button
                onClick={handleRegisterClick}
                className={`btn btn-sm w-full ${
                  userRegistered
                    ? 'btn-ghost border border-base-300'
                    : isSuggested
                    ? 'btn-info'
                    : 'btn-primary btn-outline'
                }`}
                type="button"
              >
                <span className="text-base" aria-hidden="true">+</span>
                {userRegistered ? t('schedule.register_another') : t('jams.register')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
