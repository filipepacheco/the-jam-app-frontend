import type {JamResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {useTranslation} from 'react-i18next'
import {useReducedMotion} from '../../hooks'
import {hasCoreBand, getInstrumentOptions} from '../../utils/scheduleUtils'
import {getInstrumentEmoji} from '../../lib/schedule/instrumentHelpers'
import {translationKey} from '../../lib/i18n/translationKeys'
import {TimelineItemV2Waveform} from './TimelineItemV2Waveform'
import {useState} from 'react'
import {Flag, ClipboardList} from 'lucide-react'
import {Action} from '../Action'
import {CanonicalEmptyState} from '../FeedbackStates'

interface TimelineUser {
  id: string
  name?: string | null
  instrument?: string | null
}

interface TimelineShowcaseV2Props {
  schedules: ScheduleResponseDto[]
  user: TimelineUser | null
  onRegisterClick: (schedule: ScheduleResponseDto) => void
  jam?: JamResponseDto
  jamStatus?: string
}

export function TimelineShowcaseV2Waveform({
  schedules,
  user,
  onRegisterClick,
  jamStatus,
}: TimelineShowcaseV2Props) {
  const { t } = useTranslation()
  const { prefersReducedMotion } = useReducedMotion()
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null)
  const [instrumentFilter, setInstrumentFilter] = useState<string | null>(null)
  const [mineFilter, setMineFilter] = useState(false)

  // Helper to get dot style based on status
  const getDotStyle = (schedule: ScheduleResponseDto) => {
    if (schedule.status === 'COMPLETED') return 'bg-success border-success/30'
    if (schedule.status === 'IN_PROGRESS') return `bg-primary border-primary/30 ${prefersReducedMotion ? '' : 'animate-pulse'}`
    if (schedule.status === 'SUGGESTED') return 'bg-info border-info/30'
    // Ready to play (band complete) gets a success dot
    if (hasCoreBand(schedule)) return 'bg-success border-success'
    return 'bg-base-300 border-base-300/50'
  }

  // Check if a schedule is relevant for a given instrument filter:
  // - Has explicit requirement for that instrument (needed > 0), OR
  // - Has a registration for that instrument already
  // Songs with no requirements at all (needed = -1) are always relevant.
  const scheduleMatchesInstrument = (schedule: ScheduleResponseDto, instrument: string): boolean => {
    const options = getInstrumentOptions(schedule, () => '')
    // If no requirements defined, all instruments are relevant
    if (options.length > 0 && options.every(opt => opt.needed === -1)) return true
    // Check if this instrument has an available (unfilled) slot
    return options.some(opt => opt.key === instrument && opt.needed > 0 && opt.registered < opt.needed)
  }

  // Check if a schedule has a registration from the current user
  const scheduleMatchesMine = (schedule: ScheduleResponseDto): boolean => {
    if (!user?.id) return false
    return (schedule.registrations || []).some(
      r => r.musician?.id === user.id || r.musicianId === user.id
    )
  }

  // Get instruments that appear in at least one schedule (either as requirement or registration)
  const availableFilters = ['drums', 'guitars', 'vocals', 'bass', 'keys'].filter(inst =>
    schedules.some(s => {
      const options = getInstrumentOptions(s, () => '')
      // Only count schedules with explicit requirements
      const hasRequirements = options.some(opt => opt.needed > 0)
      if (!hasRequirements) return false
      return options.some(opt => opt.key === inst && opt.needed > 0)
    })
  )

  const toggleExpanded = (scheduleId: string) => {
    setExpandedScheduleId(prev => prev === scheduleId ? null : scheduleId)
  }

  if (schedules.length === 0) {
    return <EmptyTimelineState />
  }

  return (
    <div className="space-y-6">
      <h2 className="scroll-mt-20 text-2xl font-extrabold sm:text-3xl">{t('jams.performance_schedule_title')}</h2>

      {/* Instrument filter controls retain 44px targets. On a phone, the
          instrument names collapse visually while their accessible names stay. */}
      {availableFilters.length > 1 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-base-content/60">{t('jams.filter_by_instrument')}</p>
          <div className="flex gap-1.5 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <Action
              onClick={() => { setInstrumentFilter(null); setMineFilter(false) }}
              variant={instrumentFilter === null && !mineFilter ? 'primary' : 'quiet'}
              aria-pressed={instrumentFilter === null && !mineFilter}
              className="min-h-9 gap-1 shrink-0 px-3 text-xs"
            >
              {t('common.all')}
            </Action>
            {user && (
              <Action
                onClick={() => { setMineFilter(prev => !prev); setInstrumentFilter(null) }}
                variant={mineFilter ? 'secondary' : 'quiet'}
                aria-pressed={mineFilter}
                className="min-h-9 gap-1 shrink-0 px-3 text-xs"
              >
                {t('jams.my_registrations_short')}
              </Action>
            )}
            {availableFilters.map(inst => (
              <Action
                key={inst}
                onClick={() => { setInstrumentFilter(prev => prev === inst ? null : inst); setMineFilter(false) }}
                variant={instrumentFilter === inst ? 'primary' : 'quiet'}
                aria-pressed={instrumentFilter === inst}
                className="min-h-9 gap-1 shrink-0 px-3 text-xs"
                aria-label={t(translationKey('schedule.instruments', inst))}
              >
                <span aria-hidden="true">{getInstrumentEmoji(inst)}</span>
                <span className="hidden sm:inline">{t(translationKey('schedule.instruments', inst))}</span>
              </Action>
            ))}
          </div>
        </div>
      )}

      {/* Unified Timeline - Responsive sizing */}
      <div className="relative">
        {/* Continuous vertical line */}
        <div className="absolute left-[5px] lg:left-1.5 top-0 bottom-0 w-px bg-primary/30" />

        <div className="space-y-4 lg:space-y-5">
          {/* START Marker - Only show when jam is LIVE */}
          {jamStatus === 'LIVE' && (
            <div className="flex items-start gap-3">
              <div className="relative flex flex-col items-center shrink-0">
                <div className="w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full bg-success border-2 border-base-100 relative z-10 shadow-md" />
              </div>
              <div className="flex-1">
                <div className="bg-success/10 border border-success/30 rounded-lg py-2 px-3">
                  <span className="text-xs font-semibold text-success flex items-center gap-1.5">
                    <span aria-hidden="true">▶</span>
                    {t('timeline.jam_started_at')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Items */}
          {schedules.filter(schedule => {
            if (instrumentFilter !== null && !scheduleMatchesInstrument(schedule, instrumentFilter)) return false
            return !(mineFilter && !scheduleMatchesMine(schedule));

          }).map((schedule, idx) => {
            return (
            <div
              key={schedule.id}
              className={`flex items-start gap-3 ${!prefersReducedMotion && idx < 8 ? 'animate-timeline-enter' : ''}`}
              style={!prefersReducedMotion && idx < 8 ? { animationDelay: `${idx * 60}ms` } : undefined}
            >
              {/* Timeline Indicator Column */}
              <div className="relative mt-2 flex shrink-0 flex-col items-center">
                <div className={`w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full border-2 border-base-100 relative z-10 ${getDotStyle(schedule)}`} />
              </div>

              {/* Card Container */}
              <div className="flex-1 -mt-1" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 180px' }}>
                <TimelineItemV2Waveform
                  schedule={schedule}
                  user={user}
                  onRegisterClick={() => onRegisterClick(schedule)}
                  position={idx + 1}
                  isExpanded={expandedScheduleId === schedule.id}
                  onToggleExpanded={() => toggleExpanded(schedule.id)}
                  jamFinished={jamStatus === 'FINISHED'}
                />
              </div>
            </div>
            )
          })}

          {/* FINISH Marker */}
          <div className="flex items-start gap-3">
            <div className="relative flex flex-col items-center shrink-0">
              <div className="w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full bg-base-300 border-2 border-base-100 relative z-10 shadow-md" />
            </div>
            <div className="flex-1">
              <div className="bg-base-200 border border-base-300 rounded-lg py-2 px-3">
                <span className="text-xs font-semibold text-base-content/60 flex items-center gap-1.5">
                  <Flag className="size-3" />
                  {t('timeline.finish')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyTimelineState() {
  const { t } = useTranslation()

  return (
    <CanonicalEmptyState
      kind="content"
      icon={<ClipboardList className="size-10 text-base-content/30" />}
      title={t('jams.no_performance_schedule_title')}
      description={t('jams.no_performance_schedule_desc')}
    />
  )
}
