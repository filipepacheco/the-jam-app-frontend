/**
 * Schedule Details Card Component
 * Displays schedule/song information: title, artist, duration
 * Reusable across modals
 */

import { useTranslation } from 'react-i18next'
import type { ScheduleResponseDto } from '../../types/api.types'

interface ScheduleDetailsCardProps {
  schedule: ScheduleResponseDto
}

export function ScheduleDetailsCard({ schedule }: ScheduleDetailsCardProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-base-200 rounded p-3 mb-4">
      <p className="font-semibold text-sm truncate">
        {schedule.music?.title || t('schedule.song_tba')}
      </p>
      <p className="text-xs text-base-content/70 truncate">
        {t('common.by')} {schedule.music?.artist || t('schedule.artist_tba')}
      </p>
      {schedule.music?.duration && (
        <p className="text-xs text-base-content/60 mt-1">
          ⏱️ {Math.floor(schedule.music.duration / 60)}:
          {String(schedule.music.duration % 60).padStart(2, '0')}
        </p>
      )}
    </div>
  )
}
