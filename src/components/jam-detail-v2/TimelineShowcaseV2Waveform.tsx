import type {JamResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {useTranslation} from 'react-i18next'
import {useReducedMotion} from '../../hooks'
import {hasCoreBand, getInstrumentOptions} from '../../utils/scheduleUtils'
import {getInstrumentEmoji} from '../../lib/schedule/instrumentHelpers'
import {TimelineItemV2Waveform} from './TimelineItemV2Waveform'
import {useState} from 'react'
import {Music, Users, Flag, ClipboardList} from 'lucide-react'
import {formatJamDuration} from '../../lib/formatters'

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
  const [hintDismissed, setHintDismissed] = useState(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem('jam_hint_dismissed') === '1'
  )

  // Helper to get dot style based on status
  const getDotStyle = (schedule: ScheduleResponseDto) => {
    if (schedule.status === 'COMPLETED') return 'bg-success border-success/30'
    if (schedule.status === 'IN_PROGRESS') return `bg-primary border-primary/30 ${prefersReducedMotion ? '' : 'animate-pulse'}`
    if (schedule.status === 'SUGGESTED') return 'bg-info border-info/30'
    // Ready to play (band complete) gets a success dot
    if (hasCoreBand(schedule)) return 'bg-success/70 border-success/30'
    return 'bg-base-300 border-base-300/50'
  }

  // Compute stats for schedule header
  const uniqueMusicians = new Set(
    schedules.flatMap(s => s.registrations || []).map(r => r.musician?.id || r.musician?.contact)
  ).size
  const totalDuration = schedules.reduce((sum, s) => sum + (s.music?.duration || 0), 0)

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
    if (!hintDismissed) {
      setHintDismissed(true)
      try { localStorage.setItem('jam_hint_dismissed', '1') } catch { /* localStorage may be unavailable */ }
    }
  }

  if (schedules.length === 0) {
    return <EmptyTimelineState />
  }

  return (
    <div className="space-y-6">
      {/* Timeline Header with stats */}
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 className="text-2xl sm:text-3xl font-extrabold scroll-mt-20">{t('jams.performance_schedule_title')}</h2>
        <div className="flex items-center gap-3 text-xs text-base-content/50 tabular-nums">
          <span className="inline-flex items-center gap-1">
            <Music className="size-3" />
            {schedules.length}
          </span>
          {uniqueMusicians > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" />
              {uniqueMusicians}
            </span>
          )}
          {totalDuration > 0 && (
            <span>{formatJamDuration(totalDuration)}</span>
          )}
        </div>
      </div>

      {/* Instrument filter pills + help toggle */}
      {availableFilters.length > 1 && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => { setInstrumentFilter(null); setMineFilter(false) }}
              className={`btn btn-xs rounded-full gap-1 min-h-[44px] min-w-[44px] shrink-0 ${instrumentFilter === null && !mineFilter ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
            >
              {t('common.all')}
            </button>
            {user && (
              <button
                type="button"
                onClick={() => { setMineFilter(prev => !prev); setInstrumentFilter(null) }}
                className={`btn btn-xs rounded-full gap-1 min-h-[44px] min-w-[44px] shrink-0 ${mineFilter ? 'btn-secondary' : 'btn-ghost border border-base-300'}`}
              >
                {t('jams.my_registrations_short', 'Minhas')}
              </button>
            )}
            {availableFilters.map(inst => (
              <button
                key={inst}
                type="button"
                onClick={() => { setInstrumentFilter(prev => prev === inst ? null : inst); setMineFilter(false) }}
                className={`btn btn-xs rounded-full gap-1 min-h-[44px] min-w-[44px] shrink-0 ${instrumentFilter === inst ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
              >
                <span>{getInstrumentEmoji(inst)}</span>
                <span>{t(`schedule.instruments.${inst}`)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* First-visit hint */}
      {!hintDismissed && schedules.length > 0 && (
        <p className="text-xs text-base-content/60 -mt-3 mb-1">{t('jams.hint_tap_song')}</p>
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
              <div className="relative flex flex-col items-center shrink-0">
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
    <div className="card bg-base-200">
      <div className="card-body text-center py-12">
        <ClipboardList className="size-10 text-base-content/30 mx-auto mb-3" />
        <h3 className="font-bold text-lg mb-2 text-balance">
          {t('jams.no_performance_schedule_title')}
        </h3>
        <p className="text-sm text-base-content/70 text-pretty">
          {t('jams.no_performance_schedule_desc')}
        </p>
      </div>
    </div>
  )
}
