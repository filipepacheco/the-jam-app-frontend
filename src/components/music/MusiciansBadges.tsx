import {memo} from 'react'
import {useTranslation} from 'react-i18next'

import {getInstrumentCounts, getInstrumentIcon} from '../../lib/schedule/instrumentHelpers'
import type {MusicResponseDto} from '../../types/api.types'

interface MusiciansBadgesProps {
  music: MusicResponseDto
}

// Dense inline badge row sized for a table cell; kept hand-rolled rather than the canonical
// Badge because several badges must fit one table row (see jam-music-migration.md, matching
// the precedent set for InstrumentBadges in the Schedule migration).
export const MusiciansBadges = memo(function MusiciansBadges({music}: MusiciansBadgesProps) {
  const {t} = useTranslation()
  const instrumentCounts = getInstrumentCounts(music, t)
  const hasInstruments = instrumentCounts.some((instrument) => instrument.count > 0)

  return (
    <div className="flex flex-wrap gap-1">
      {instrumentCounts.map((instrument) =>
        instrument.count > 0 ? (
          <span key={instrument.key} className="badge badge-sm gap-0.5" title={instrument.label}>
            {getInstrumentIcon(instrument.key)} {instrument.count}
          </span>
        ) : null
      )}
      {!hasInstruments && <span className="text-xs text-base-content/40">-</span>}
    </div>
  )
})
