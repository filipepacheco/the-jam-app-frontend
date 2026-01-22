import type {ScheduleResponseDto} from '../../types/api.types'
import type {AuthUser} from '../../types/auth.types'
import {useTranslation} from 'react-i18next'
import {TimelineItem} from './TimelineItem'

interface TimelineShowcaseProps {
  schedules: ScheduleResponseDto[]
  user: AuthUser | null
  onRegisterClick: (schedule: ScheduleResponseDto) => void
}

export function TimelineShowcase({
  schedules,
  user,
  onRegisterClick,
}: TimelineShowcaseProps) {
  const { t } = useTranslation()

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

      {/* Timeline Container - Adaptive (horizontal on mobile, vertical on desktop) */}
      <div className="relative">
        {/* Horizontal timeline on mobile/tablet (scrollable) */}
        <div className="lg:hidden">
          <HorizontalTimeline
            schedules={schedules}
            user={user}
            onRegisterClick={onRegisterClick}
          />
        </div>

        {/* Vertical timeline on desktop */}
        <div className="hidden lg:block">
          <VerticalTimeline
            schedules={schedules}
            user={user}
            onRegisterClick={onRegisterClick}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// VERTICAL TIMELINE (Desktop)
// ============================================================================

function VerticalTimeline({
  schedules,
  user,
  onRegisterClick,
}: {
  schedules: ScheduleResponseDto[]
  user: AuthUser | null
  onRegisterClick: (schedule: ScheduleResponseDto) => void
}) {
  return (
    <div className="relative pl-10">
      {/* Vertical line on left - more prominent */}
      <div className="absolute left-3.5 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary via-primary to-primary/30" />

      {/* Timeline items stacked vertically */}
      <div className="space-y-8">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="relative">
            {/* Timeline dot - positioned on the line */}
            <div className="absolute -left-5 top-4 w-6 h-6 bg-primary rounded-full border-4 border-base-100 z-20 shadow-lg" />

            {/* Vertical connector line from dot to card */}
            <div className="absolute -left-4 top-10 bottom-0 w-0.5 bg-primary/20" />

            <TimelineItem
              schedule={schedule}
              user={user}
              onRegisterClick={() => onRegisterClick(schedule)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// HORIZONTAL TIMELINE (Mobile/Tablet)
// ============================================================================

function HorizontalTimeline({
  schedules,
  user,
  onRegisterClick,
}: {
  schedules: ScheduleResponseDto[]
  user: AuthUser | null
  onRegisterClick: (schedule: ScheduleResponseDto) => void
}) {
  return (
    <div className="relative">
      {/* Top connecting line */}
      <div className="absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/30 z-0" />

      {/* Horizontal scroll container */}
      <div className="overflow-x-auto pb-6 -mx-2 px-2 snap-x snap-mandatory">
        <div className="flex gap-4 sm:gap-6 min-w-min pl-2">
          {/* Timeline items in a row */}
          {schedules.map((schedule) => (
            <div key={schedule.id} className="flex-shrink-0 w-[280px] sm:w-80 snap-start">
              {/* Timeline dot */}
              <div className="relative mb-6">
                <div className="absolute -top-[3.5rem] left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-4 border-base-100 z-10" />
              </div>
              <TimelineItem
                schedule={schedule}
                user={user}
                onRegisterClick={() => onRegisterClick(schedule)}
              />
            </div>
          ))}
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
    <div className="card bg-gradient-to-br from-base-200 to-base-300">
      <div className="card-body text-center py-12">
        <div className="text-5xl mb-4" aria-hidden="true">📋</div>
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
