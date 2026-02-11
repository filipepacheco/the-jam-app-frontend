/**
 * Instrument Badges Component
 * Renders inline badge row showing instrument emoji + count for each needed instrument
 */

import { memo } from 'react'
import { getInstrumentEmoji } from '../../lib/schedule/instrumentHelpers'
import { formatDuration } from '../../lib/formatters'

interface InstrumentBadgesProps {
  neededDrums?: number
  neededGuitars?: number
  neededVocals?: number
  neededBass?: number
  neededKeys?: number
  duration?: number
  badgeSize?: 'badge-sm' | 'badge-md'
}

export const InstrumentBadges = memo(function InstrumentBadges({
  neededDrums = 0,
  neededGuitars = 0,
  neededVocals = 0,
  neededBass = 0,
  neededKeys = 0,
  duration,
  badgeSize = 'badge-sm',
}: InstrumentBadgesProps) {
  const badges = [
    { key: 'drums', count: neededDrums },
    { key: 'guitars', count: neededGuitars },
    { key: 'vocals', count: neededVocals },
    { key: 'bass', count: neededBass },
    { key: 'keys', count: neededKeys },
  ]

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {duration != null && duration > 0 && (
        <span className={`badge ${badgeSize} badge-neutral font-semibold`}>
          ⏱️ {formatDuration(duration)}
        </span>
      )}
      {badges.map(
        ({ key, count }) =>
          count > 0 && (
            <span key={key} className={`badge ${badgeSize} badge-ghost`}>
              {getInstrumentEmoji(key)} {count}
            </span>
          ),
      )}
    </div>
  )
})
