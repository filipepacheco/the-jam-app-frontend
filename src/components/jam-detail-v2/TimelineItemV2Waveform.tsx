import type {RegistrationResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {useTranslation} from 'react-i18next'
import {useReducedMotion} from '../../hooks'
import {getInstrumentEmoji} from '../../lib/schedule/instrumentHelpers'
import {hasCoreBand, getInstrumentOptions} from '../../utils/scheduleUtils'
import {InstrumentsSummary} from '../schedule/InstrumentsSummary'
import {SpotifyPlayButton} from '../SpotifyPreview'
import {FileText, Mic, ChevronDown} from 'lucide-react'
import {Action} from '../Action'
import React, {useCallback, useMemo} from "react"

interface TimelineUser {
  id: string
  name?: string | null
  instrument?: string | null
}

interface TimelineItemV2Props {
  schedule: ScheduleResponseDto
  user: TimelineUser | null
  onRegisterClick: () => void
  position?: number
  isExpanded?: boolean
  onToggleExpanded?: () => void
  jamFinished?: boolean
}

export function TimelineItemV2Waveform({
  schedule,
  user,
  onRegisterClick,
  position,
  isExpanded = false,
  onToggleExpanded,
  jamFinished = false,
}: TimelineItemV2Props) {
  const { t } = useTranslation()
  const { prefersReducedMotion } = useReducedMotion()

  const userRegistered = user?.id
    ? schedule.registrations?.some(
        (reg: RegistrationResponseDto) => reg.musicianId === user.id || reg.musician?.id === user.id
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

  // Memoize status-based styling
  const { bgClasses, borderClasses, isCompleted, isInProgress, isSuggested } = useMemo(() => {
    const completed = schedule.status === 'COMPLETED'
    const inProgress = schedule.status === 'IN_PROGRESS'
    const suggested = schedule.status === 'SUGGESTED'

    let bg = 'bg-base-100'
    let border = 'border border-base-300'

    if (completed) {
      bg = 'bg-success/5'
      border = 'border border-success/20'
    } else if (inProgress) {
      bg = 'bg-primary/10'
      border = 'border-2 border-primary shadow-lg shadow-primary/20'
    } else if (suggested) {
      bg = 'bg-info/5'
      border = 'border border-info/20'
    }

    return { bgClasses: bg, borderClasses: border, isCompleted: completed, isInProgress: inProgress, isSuggested: suggested }
  }, [schedule.status])

  // Check if schedule is ready to play (all musician slots filled)
  const isReadyToPlay = !isCompleted && !isInProgress && !isSuggested && hasCoreBand(schedule)
  const isExpandable = isCompleted

  // Override card styling for ready-to-play songs
  const finalBg = isReadyToPlay ? 'bg-success/8' : bgClasses
  const finalBorder = isReadyToPlay ? 'border border-success/25' : borderClasses

  // Get instrument options for showing available slots
  const instrumentOptions = useMemo(
    () => getInstrumentOptions(schedule, (key) => t(`schedule.instruments.${key}`)),
    [schedule, t]
  )

  // Memoize status object
  const status = useMemo(() => {
    if (isCompleted) return { icon: '✓', text: t('schedule.statuses.completed'), color: 'text-success', hint: '' }
    if (isInProgress) return { icon: '▶', text: t('schedule.statuses.in_progress'), color: 'text-primary', hint: '' }
    if (isSuggested) return { icon: '✨', text: t('common.statuses.suggested'), color: 'text-info', hint: '' }
    if (isReadyToPlay) return { icon: '✓', text: t('schedule.statuses.ready_to_play'), color: 'text-success', hint: t('schedule.statuses.ready_to_play_hint') }
    return { icon: '○', text: t('schedule.statuses.awaiting_registrations'), color: 'text-base-content/50', hint: '' }
  }, [isCompleted, isInProgress, isSuggested, isReadyToPlay, t])

  return (
    /* Only completed Performances collapse. Other cards must not advertise an
       expand action when every detail is already visible. */
    <div
      role={isExpandable ? 'button' : undefined}
      tabIndex={isExpandable ? 0 : undefined}
      className={`card w-full ${finalBg} ${finalBorder} transition-shadow duration-300 outline-none text-left ${isExpandable ? 'cursor-pointer hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2' : ''} ${isInProgress && !prefersReducedMotion ? 'animate-breathe-glow' : ''}`}
      onClick={isExpandable ? handleCardClick : undefined}
      onKeyDown={isExpandable ? handleCardKeyDown : undefined}
      aria-expanded={isExpandable ? isExpanded : undefined}
      aria-label={isExpandable ? `${schedule.music?.title} by ${schedule.music?.artist}. ${status.text}` : undefined}
    >
      <div className="card-body p-3 overflow-hidden">

        {/* A song title is the primary decision input, so it wraps before the
            status moves beneath it at phone widths. */}
        <div className={`grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 ${isCompleted && !isExpanded ? '' : 'mb-1'}`}>
          {position !== undefined ? (
            <span className="text-[11px] font-semibold text-base-content/40 tabular-nums shrink-0 mt-0.5 w-5 text-center">
              {position}
            </span>
          ) : <div />}
          <div className="min-w-0">
            <h3 className="ds-type-ui ds-wrap-user-content font-bold text-base-content mb-0.5">
              {schedule.music?.title}
            </h3>
            <p className="ds-wrap-user-content flex items-center gap-1 text-sm text-base-content/70">
              {schedule.music?.artist}
              {isExpandable && (
                <ChevronDown className={`size-3 text-base-content/60 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
              )}
            </p>
          </div>
          {/* Status + meta - right column */}
          <div className="col-start-2 text-left sm:col-start-auto sm:text-right">
            <div className={`text-xs sm:text-sm font-semibold mb-0.5 ${status.color}`} title={status.hint || undefined}>
                <span className={`${isInProgress && userRegistered && !prefersReducedMotion ? 'animate-pulse will-change-transform' : ''}`} aria-hidden="true">{status.icon}</span>
                <span className="whitespace-nowrap"> {status.text}</span>
            </div>
              <div className="flex items-center justify-end">
            <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                <SpotifyPlayButton link={schedule.music?.link} title={schedule.music?.title} />
            </span>
              </div>
          </div>
        </div>

        {/* No registrations hint */}
        {!isCompleted && (!schedule.registrations || schedule.registrations.length === 0) && (
          <p className="text-xs text-base-content/40 mb-1.5">
            {t('common.no_registrations_yet')}
          </p>
        )}

        {/* Musicians list - collapsible for completed, always visible otherwise */}
        {schedule.registrations && schedule.registrations.length > 0 && (
          <div
            className={isCompleted
              ? `overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 mb-3' : 'max-h-0 opacity-0'}`
              : 'mb-3'
            }
          >
            <div className="flex flex-wrap gap-2">
              {schedule.registrations.map((reg: RegistrationResponseDto) => (
                <div
                  key={reg.id}
                  className="inline-flex items-center gap-1.5 bg-base-200/60 px-2 py-1 rounded-md text-xs max-w-full"
                >
                  <span aria-hidden="true" className="shrink-0" title={reg.instrument || undefined}>{getInstrumentEmoji(reg.instrument)}</span>
                  <span className="ds-wrap-user-content font-medium">
                    {reg.musician?.id === user?.id ? t('common.you') : (reg.musician?.name?.split(' ')[0] ?? reg.musician?.name)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description row - only shown when description exists */}
        {schedule.music?.description && (
          <div className="flex items-start gap-1.5 border-t border-base-content/10 pt-1">
            <FileText className="size-3 shrink-0 text-base-content/40 mt-0.5" />
            <p className="ds-wrap-user-content text-sm text-base-content/50">{schedule.music.description}</p>
          </div>
        )}

        {/* Info row - only shown when info exists */}
        {schedule.music?.info && (
          <div className="flex items-start gap-1.5 border-t border-base-content/10 pt-1">
            <FileText className="size-3 shrink-0 text-base-content/40 mt-0.5" />
            <p className="ds-wrap-user-content whitespace-pre-line text-sm text-base-content/50">{schedule.music.info}</p>
          </div>
        )}

        {/* Instruments still needed */}
        {!isCompleted && !isInProgress && (
          <InstrumentsSummary instrumentOptions={instrumentOptions} highlightInstrument={user?.instrument} />
        )}

        {/* Register Button / Stage Call-to-Action - hide when jam is finished */}
        {!isCompleted && !jamFinished && (
          <>
            {isInProgress ? (
              userRegistered ? (
                <div
                  className="bg-primary/15 border border-primary/30 rounded-lg px-3 py-2.5 text-sm font-bold text-primary flex items-center gap-2"
                  role="status"
                  aria-live="polite"
                >
                  <Mic className="size-4 shrink-0" />
                  {t('jams.go_to_stage')}
                </div>
              ) : null
            ) : isReadyToPlay ? (
              instrumentOptions.some(opt => opt.needed > 0 && opt.registered < opt.needed) ? (
                <Action
                  onClick={handleRegisterClick}
                  variant={userRegistered ? 'quiet' : 'secondary'}
                  className="w-full"
                >
                  {userRegistered ? t('schedule.register_another') : t('jams.register')}
                </Action>
              ) : userRegistered ? (
                <Action onClick={handleRegisterClick} variant="quiet" className="w-full">
                  {t('schedule.register_another')}
                </Action>
              ) : null
            ) : (
              <Action
                onClick={handleRegisterClick}
                variant={userRegistered ? 'quiet' : isSuggested ? 'primary' : 'secondary'}
                className="w-full"
              >
                {!userRegistered && <span className="text-base" aria-hidden="true">+</span>}
                {userRegistered ? t('schedule.register_another') : t('jams.register')}
              </Action>
            )}
          </>
        )}
      </div>
    </div>
  )
}
