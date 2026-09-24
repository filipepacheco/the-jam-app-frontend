import {memo} from 'react'
import {useTranslation} from 'react-i18next'
import {getInstrumentEmoji} from '../../utils/instrumentEmojis'
import {normalizeInstrument} from '../../utils/musicianUtils'
import type {DashboardMusicianDto} from '../../types/api.types'
import {useInstrumentLabel} from './instrumentLabel'
import {joinKey} from './useJoinSpotlight'
import './venue-display.css'

interface InstrumentGroupProps {
  instrument: string
  musicians: DashboardMusicianDto[]
  size?: 'sm' | 'md' | 'lg'
  songId?: string
  /** Sign-ups the join spotlight will fly in; their slots wait, hidden. */
  awaiting?: ReadonlySet<string>
}

export const InstrumentGroup = memo(function InstrumentGroup({instrument, musicians, size = 'md', songId, awaiting}: InstrumentGroupProps) {
  const {t} = useTranslation()
  const label = useInstrumentLabel()

  return (
    <div className={`venue-instrument venue-instrument--${size}`} data-venue-instrument={normalizeInstrument(instrument)}>
      <span className="venue-musician-wash" aria-hidden="true" />
      <p className="venue-instrument-label ds-wrap-user-content">
        <span aria-hidden="true">{getInstrumentEmoji(instrument)}</span>
        {' '}{label(instrument)}
      </p>
      {musicians.map((musician) => (
        <p
          key={musician.id}
          className="venue-musician-name ds-wrap-user-content"
          data-venue-musician={musician.id}
          data-venue-awaiting={songId && awaiting?.has(joinKey(songId, musician.id)) ? '' : undefined}
        >
          {musician.name || t('common.unknown')}
        </p>
      ))}
    </div>
  )
})
