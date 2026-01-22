import type {RegistrationResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {useTranslation} from 'react-i18next'
import {useReducedMotion} from '../../hooks'
import {getInstrumentIcon} from '../../lib/schedule/instrumentHelpers'
import React from "react";

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

  const handleCardClick = () => {
    onToggleExpanded?.()
  }

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggleExpanded?.()
    }
  }

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRegisterClick()
  }

  // Determine card styling based on status
  const isCompleted = schedule.status === 'COMPLETED'
  const isInProgress = schedule.status === 'IN_PROGRESS'
  const isSuggested = schedule.status === 'SUGGESTED'

  // Background classes based on status with gradients
  let bgClasses = 'bg-linear-to-br from-base-100 to-base-200'
  let borderClasses = 'border border-base-300'

  if (isCompleted) {
    bgClasses = 'bg-linear-to-br from-success/10 to-success/5'
    borderClasses = 'border border-success/30'
  } else if (isInProgress) {
    bgClasses = 'bg-linear-to-br from-primary/15 to-primary/5'
    borderClasses = 'border-2 border-primary shadow-lg shadow-primary/20'
  } else if (isSuggested) {
    bgClasses = 'bg-linear-to-br from-info/10 to-info/5'
    borderClasses = 'border border-info/30'
  }

  // Status text and icon
  const getStatusDisplay = () => {
    if (isCompleted) return { icon: '✓', text: t('schedule.statuses.completed'), color: 'text-success' }
    if (isInProgress) return { icon: '▶', text: t('schedule.statuses.in_progress'), color: 'text-primary' }
    if (isSuggested) return { icon: '✨', text: t('schedule.statuses.suggested'), color: 'text-info' }
    return { icon: '○', text: t('schedule.statuses.scheduled'), color: 'text-base-content/60' }
  }

  const status = getStatusDisplay()

  return (
    <button
      className={`card ${bgClasses} ${borderClasses} transition-all duration-300 cursor-pointer hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none text-left ${isInProgress && userRegistered && !prefersReducedMotion ? 'animate-pulse' : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      aria-expanded={isExpanded}
      aria-label={`${schedule.music?.title} by ${schedule.music?.artist}. ${status.text}`}
      type="button"
    >
      <div className="card-body p-4">

        {/* Header with position and status */}
        <div className="flex items-start justify-between gap-3 mb-2">
          {position !== undefined && (
            <div className="badge badge-neutral badge-sm font-bold">
              #{position}
            </div>
          )}
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${status.color} ml-auto`}>
            <span className="text-base" aria-hidden="true">{status.icon}</span>
            <span>{status.text}</span>
          </div>
        </div>

        {/* Song Info */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-base-content mb-0.5">
            {schedule.music?.title}
          </h3>
          <p className="text-sm text-base-content/70">
            {schedule.music?.artist}
          </p>
        </div>

        {/* Registered Musicians - Expandable */}
        {schedule.registrations && schedule.registrations.length > 0 && (
          <div className="mb-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpanded?.()
              }}
              className="w-full text-left text-xs text-base-content/60 font-semibold flex items-center justify-between gap-1.5 hover:text-base-content/80 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded outline-none"
              type="button"
              aria-expanded={isExpanded}
              aria-controls={`musician-list-${schedule.id}`}
            >
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true">🎵</span>
                {schedule.registrations.length} {schedule.registrations.length === 1 ? t('jams.info.musician') : t('jams.info.musicians')}
              </span>
              <span className="text-xs" aria-hidden="true">{isExpanded ? '▲' : '▼'}</span>
            </button>

            {/* Expandable musician list with animation */}
            <div
              id={`musician-list-${schedule.id}`}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
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
          </div>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-4 text-xs text-base-content/60 mb-3">
          <div className="flex items-center gap-1">
            <span aria-hidden="true">⏱️</span>
            <span className="font-medium tabular-nums">
              {Math.floor((schedule.music?.duration || 0) / 60)}min
            </span>
          </div>
          {!schedule.registrations?.length && (
            <div className="flex items-center gap-1 text-warning">
              <span aria-hidden="true">⚠</span>
              <span className="font-medium">{t('jams.no_registrations_yet')}</span>
            </div>
          )}
        </div>

        {/* Register Button / Stage Call-to-Action */}
        {!isCompleted && (
          <>
            {/* IN_PROGRESS: Only show if user is registered */}
            {isInProgress ? (
              userRegistered && (
                <div
                  className="alert alert-info text-sm font-semibold"
                  role="status"
                  aria-live="polite"
                >
                  <span className="text-base" aria-hidden="true">🎤</span>
                  {t('jams.go_to_stage')}
                </div>
              )
            ) : (
              /* OTHER STATUSES: Show register button */
              <button
                onClick={handleRegisterClick}
                disabled={userRegistered}
                className={`btn btn-sm w-full ${
                  userRegistered
                    ? 'btn-outline btn-disabled'
                    : isSuggested
                    ? 'btn-info'
                    : 'btn-primary btn-outline'
                }`}
                type="button"
              >
                {userRegistered ? (
                  t('schedule.already_enrolled')
                ) : (
                  <>
                    <span className="text-base" aria-hidden="true">+</span>
                    {t('jams.register')}
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </button>
  )
}
