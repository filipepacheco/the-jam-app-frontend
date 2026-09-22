import type {RegistrationResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {useTranslation} from 'react-i18next'
import {useReducedMotion} from '../../hooks'
import {getInstrumentEmoji} from '../../lib/schedule/instrumentHelpers'
import {translationKey} from '../../lib/i18n/translationKeys'
import {hasCoreBand, getInstrumentOptions} from '../../utils/scheduleUtils'
import {activeRegistrations as getActiveRegistrations, isActiveRegistration} from '../../utils/musicianUtils'
import {SpotifyPlayButton} from '../SpotifyPreview'
import {FileText, Mic, ChevronDown, Clock3} from 'lucide-react'
import {Action, IconAction} from '../Action'
import {useCallback, useMemo} from 'react'
import type {MouseEvent} from 'react'
import {formatDuration} from '../../lib/formatters'

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
        (reg: RegistrationResponseDto) => isActiveRegistration(reg)
          && (reg.musicianId === user.id || reg.musician?.id === user.id)
      )
    : false

  const handleRegisterClick = useCallback((e: MouseEvent) => {
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
      bg = 'bg-success/10'
      border = 'border border-success/30'
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
  // Completed and ready-to-play performances share the same success role as
  // the timeline's "Jam started" marker. This keeps readiness legible without
  // introducing a second green treatment.
  const finalBg = isReadyToPlay ? 'bg-success/10' : bgClasses
  const finalBorder = isReadyToPlay ? 'border border-success/30' : borderClasses
  const isCompactCompleted = isCompleted && !isExpanded

  // Get instrument options for showing available slots
  const instrumentOptions = useMemo(
    () => getInstrumentOptions(schedule, (key) => t(translationKey('schedule.instruments', key))),
    [schedule, t]
  )
  const activeRegistrations = useMemo(
    () => getActiveRegistrations(schedule.registrations),
    [schedule.registrations]
  )
  const hasNoRequirements = instrumentOptions.length > 0
    && instrumentOptions.every((option) => option.needed === -1)
  const availableOptions = instrumentOptions.filter(
    (option) => option.needed === -1 || option.registered < option.needed
  )

  // Memoize status object
  const status = useMemo(() => {
    if (isCompleted) return { icon: '✓', text: t('schedule.statuses.completed'), color: 'text-success', hint: '' }
    if (isInProgress) return { icon: '▶', text: t('schedule.statuses.in_progress'), color: 'text-primary', hint: '' }
    if (isSuggested) return { icon: '✨', text: t('common.statuses.suggested'), color: 'text-info', hint: '' }
    if (isReadyToPlay) return { icon: '✓', text: t('schedule.statuses.ready_to_play'), color: 'text-success', hint: t('schedule.statuses.ready_to_play_hint') }
    return null
  }, [isCompleted, isInProgress, isSuggested, isReadyToPlay, t])

  return (
    <div
      className={`card w-full overflow-hidden rounded-box ${finalBg} ${finalBorder} transition-shadow duration-300 text-left ${isInProgress && !prefersReducedMotion ? 'animate-breathe-glow' : ''}`}
    >
      <div className={`card-body overflow-hidden ${isCompactCompleted ? 'p-2 sm:p-2.5' : 'p-3'}`}>

        {/* A song title is the primary decision input, so it wraps before the
            status moves beneath it at phone widths. */}
        <div className={isCompactCompleted
          ? 'flex min-w-0 items-center gap-2'
          : `grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 ${isCompleted && !isExpanded ? '' : 'mb-1'}`}
        >
          {position !== undefined ? (
            <span className="text-[11px] font-semibold text-base-content/40 tabular-nums shrink-0 mt-0.5 w-5 text-center">
              {position}
            </span>
          ) : <div />}
          <div className={isCompactCompleted ? 'flex min-w-0 flex-1 items-center gap-1.5' : 'min-w-0'}>
            <h3 className={isCompactCompleted
              ? 'min-w-0 truncate text-sm font-bold text-base-content'
              : 'ds-type-ui ds-wrap-user-content mb-0.5 font-bold text-base-content'}
            >
              {schedule.music?.title}
            </h3>
            {isCompactCompleted && <span className="shrink-0 text-xs text-base-content/50" aria-hidden="true">·</span>}
            <div className={isCompactCompleted
              ? 'flex min-w-0 flex-1 items-center gap-1.5'
              : 'flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'}
            >
              <p className={`ds-truncate-single min-w-0 flex-1 ${isCompactCompleted ? 'text-xs' : 'text-sm'} text-base-content/70`}>
                {schedule.music?.artist}
                <span className="ml-1.5 inline-flex align-middle">
                  <SpotifyPlayButton link={schedule.music?.link} title={schedule.music?.title} />
                </span>
              </p>
              {typeof schedule.music?.duration === 'number' && schedule.music.duration > 0 && (
                <span className="inline-flex items-center gap-1 text-xs tabular-nums text-base-content/55">
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  {formatDuration(schedule.music.duration)}
                </span>
              )}
            </div>
          </div>
          {/* Status + meta - right column */}
          <div className={isCompactCompleted
            ? 'flex shrink-0 items-center justify-end gap-1 text-right'
            : 'col-start-2 flex items-center justify-between gap-2 text-left sm:col-start-auto sm:justify-end sm:text-right'}
          >
            {status ? (
              <div className={`text-xs sm:text-sm font-semibold ${status.color}`} title={status.hint || undefined}>
                <span className={`${isInProgress && userRegistered && !prefersReducedMotion ? 'animate-pulse will-change-transform' : ''}`} aria-hidden="true">{status.icon}</span>
                <span className="whitespace-nowrap"> {status.text}</span>
              </div>
            ) : null}
            {isExpandable && (
              <IconAction
                variant="quiet"
                className="shrink-0 rounded-full"
                label={`${schedule.music?.title}: ${isExpanded ? t('common.collapse') : t('common.expand')}`}
                aria-expanded={isExpanded}
                onClick={onToggleExpanded}
              >
                <ChevronDown className={`size-4 text-base-content/60 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
              </IconAction>
            )}
          </div>
        </div>

        {/* Additional song information stays with the identity block. */}
        {schedule.music?.info && !isCompactCompleted && (
          <div className="flex items-start gap-1.5 border-t border-base-content/10 pt-1">
            <FileText className="size-3 shrink-0 text-base-content/40 mt-0.5" />
            <p className="ds-wrap-user-content whitespace-pre-line text-sm text-base-content/50">{schedule.music.info}</p>
          </div>
        )}

        {/* Song description appears before participant availability. */}
        {schedule.music?.description && !isCompactCompleted && (
          <div className="flex items-start gap-1.5 border-t border-base-content/10 pt-1">
            <FileText className="size-3 shrink-0 text-base-content/40 mt-0.5" />
            <p className="ds-wrap-user-content text-sm text-base-content/50">{schedule.music.description}</p>
          </div>
        )}

        {/* Participants and availability form one lineup instead of separate
            registration and vacancy cards. Completed items keep it tucked
            behind the lean disclosure control. */}
        <div
          className={isCompleted
            ? `overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${isExpanded ? 'max-h-[32rem] opacity-100 mb-3' : 'max-h-0 opacity-0'}`
            : 'mb-3'
          }
        >
          <div
            className="space-y-2 rounded-lg bg-base-200/50 px-2.5 py-2"
            role="group"
            aria-label={t('schedule.performance_lineup')}
          >
            <p className="text-xs font-semibold text-base-content/60">{t('schedule.performance_lineup')}</p>

            {activeRegistrations.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {activeRegistrations.map((reg: RegistrationResponseDto) => (
                <div
                  key={reg.id}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-base-100/70 px-2 py-1 text-xs"
                >
                  <span aria-hidden="true" className="shrink-0" title={reg.instrument || undefined}>{getInstrumentEmoji(reg.instrument)}</span>
                  <span className="ds-wrap-user-content font-medium">
                    {reg.musician?.id === user?.id ? t('common.you') : (reg.musician?.name?.split(' ')[0] ?? reg.musician?.name)}
                  </span>
                </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-base-content/50">{t('common.no_registrations_yet')}</p>
            )}

            {!isCompleted && !isInProgress && (hasNoRequirements || availableOptions.length > 0) && (
              <div className="border-t border-base-content/10 pt-2">
                {hasNoRequirements ? (
                  <p className="text-xs text-base-content/60">{t('schedule.any_instrument_welcome')}</p>
                ) : (
                  <>
                    <p className="mb-1.5 text-xs text-base-content/50">{t('schedule.instruments_needed')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableOptions.map((option) => (
                        <span
                          key={option.key}
                          className="badge badge-sm badge-warning gap-1"
                          title={option.label}
                        >
                          <span aria-hidden="true">{option.emoji}</span>
                          {option.needed - option.registered}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

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
