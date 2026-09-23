import {memo} from 'react'
import {useTranslation} from 'react-i18next'
import {getInstrumentEmoji} from '../../utils/instrumentEmojis'
import {normalizeInstrument} from '../../utils/musicianUtils'
import type {DashboardMusicianDto} from '../../types/api.types'
import './venue-display.css'

interface InstrumentGroupProps {
  instrument: string
  musicians: DashboardMusicianDto[]
  size?: 'sm' | 'md' | 'lg'
}

export const InstrumentGroup = memo(function InstrumentGroup({instrument, musicians, size = 'md'}: InstrumentGroupProps) {
  const {t} = useTranslation()
  const labels: Record<string, string> = {
    vocals: t('schedule.instruments.vocals'),
    guitars: t('schedule.instruments.guitars'),
    bass: t('schedule.instruments.bass'),
    drums: t('schedule.instruments.drums'),
    keys: t('schedule.instruments.keys'),
  }

  return (
    <div className={`venue-instrument venue-instrument--${size}`} data-venue-instrument={normalizeInstrument(instrument)}>
      <span className="venue-musician-wash" aria-hidden="true" />
      <p className="venue-instrument-label ds-wrap-user-content">
        <span aria-hidden="true">{getInstrumentEmoji(instrument)}</span>
        {' '}{labels[normalizeInstrument(instrument)] ?? (instrument || t('common.unknown'))}
      </p>
      {musicians.map((musician) => (
        <p key={musician.id} className="venue-musician-name ds-wrap-user-content" data-venue-musician={musician.id}>
          {musician.name || t('common.unknown')}
        </p>
      ))}
    </div>
  )
})
