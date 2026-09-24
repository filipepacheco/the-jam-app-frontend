import {useTranslation} from 'react-i18next'
import {normalizeInstrument} from '../../utils/musicianUtils'

/** The localized name of an instrument group, as the venue lineup shows it. */
export function useInstrumentLabel() {
  const {t} = useTranslation()
  const labels: Record<string, string> = {
    vocals: t('schedule.instruments.vocals'),
    guitars: t('schedule.instruments.guitars'),
    bass: t('schedule.instruments.bass'),
    drums: t('schedule.instruments.drums'),
    keys: t('schedule.instruments.keys'),
  }
  return (instrument: string) => labels[normalizeInstrument(instrument)] ?? (instrument || t('common.unknown'))
}
