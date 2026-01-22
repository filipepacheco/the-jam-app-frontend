import type {JamResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {useTranslation} from 'react-i18next'
import {useReducedMotion} from '../../hooks'
import {TimelineItemV2Waveform} from './TimelineItemV2Waveform'
import {useMemo, useState} from 'react'

interface TimelineUser {
  id: string
  name?: string | null
}

interface TimelineShowcaseV2Props {
  schedules: ScheduleResponseDto[]
  user: TimelineUser | null
  onRegisterClick: (schedule: ScheduleResponseDto) => void
  jam?: JamResponseDto
}

export function TimelineShowcaseV2Waveform({
  schedules,
  user,
  onRegisterClick,
}: TimelineShowcaseV2Props) {
  const { t } = useTranslation()
  const { prefersReducedMotion } = useReducedMotion()
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null)

  // Helper to get dot style based on status (must be defined before early return)
  const getDotStyle = useMemo(() => (status: string) => {
    if (status === 'COMPLETED') return 'bg-success border-success/30'
    if (status === 'IN_PROGRESS') return `bg-primary border-primary/30 ${prefersReducedMotion ? '' : 'animate-pulse'}`
    if (status === 'SUGGESTED') return 'bg-info border-info/30'
    return 'bg-base-300 border-base-300/50'
  }, [prefersReducedMotion])

  const toggleExpanded = (scheduleId: string) => {
    setExpandedScheduleId(prev => prev === scheduleId ? null : scheduleId)
  }

  if (schedules.length === 0) {
    return <EmptyTimelineState />
  }

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold scroll-mt-20">{t('jams.performance_schedule_title')}</h2>
        <div className="text-sm text-base-content/60 tabular-nums">
          {schedules.length} {t('jams.info.performances')}
        </div>
      </div>

      {/* Unified Timeline - Responsive sizing */}
      <div className="relative">
        {/* Continuous vertical line */}
        <div className="absolute left-[5px] lg:left-1.5 top-0 bottom-0 w-px bg-primary/30" />

        <div className="space-y-4 lg:space-y-5">
          {/* START Marker */}
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

          {/* Timeline Items */}
          {schedules.map((schedule, idx) => (
            <div key={schedule.id} className="flex items-start gap-3">
              {/* Timeline Indicator Column */}
              <div className="relative flex flex-col items-center shrink-0">
                <div className={`w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full border-2 border-base-100 relative z-10 ${getDotStyle(schedule.status)}`} />
              </div>

              {/* Card Container */}
              <div className="flex-1 -mt-1">
                <TimelineItemV2Waveform
                  schedule={schedule}
                  user={user}
                  onRegisterClick={() => onRegisterClick(schedule)}
                  position={idx + 1}
                  isExpanded={expandedScheduleId === schedule.id}
                  onToggleExpanded={() => toggleExpanded(schedule.id)}
                />
              </div>
            </div>
          ))}

          {/* FINISH Marker */}
          <div className="flex items-start gap-3">
            <div className="relative flex flex-col items-center shrink-0">
              <div className="w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full bg-base-300 border-2 border-base-100 relative z-10 shadow-md" />
            </div>
            <div className="flex-1">
              <div className="bg-base-200 border border-base-300 rounded-lg py-2 px-3">
                <span className="text-xs font-semibold text-base-content/60 flex items-center gap-1.5">
                  <span aria-hidden="true">🏁</span>
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
    <div className="card bg-linear-to-br from-base-200 to-base-300">
      <div className="card-body text-center py-12">
        <div className="text-5xl mb-4" aria-label={t('jams.no_performance_schedule_title')}>📋</div>
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
