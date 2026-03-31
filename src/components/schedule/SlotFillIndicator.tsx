import type { MusicResponseDto, RegistrationResponseDto } from '../../types/api.types'
import { countActiveRegistrationsByInstrument, CORE_BAND } from '../../utils/scheduleUtils'
import { useTranslation } from 'react-i18next'

interface SlotFillIndicatorProps {
  registrations?: RegistrationResponseDto[]
  music?: MusicResponseDto
}

export function SlotFillIndicator({ registrations, music }: SlotFillIndicatorProps) {
  const { t } = useTranslation()
  const totalNeeded = (music?.neededDrums || 0) + (music?.neededGuitars || 0)
    + (music?.neededBass || 0) + (music?.neededVocals || 0) + (music?.neededKeys || 0)

  if (totalNeeded === 0) return null

  const { counts, activeCount } = countActiveRegistrationsByInstrument(registrations)
  const bandComplete = CORE_BAND.every(inst => (counts[inst] || 0) >= 1)

  const badgeClass = bandComplete
    ? 'badge-success'
    : activeCount === 0
      ? 'badge-ghost text-base-content/40'
      : 'badge-warning'

  return (
    <span
      className={`badge badge-xs font-mono font-semibold shrink-0 ${badgeClass}`}
      title={bandComplete
        ? t('schedule.band_complete', 'Band complete')
        : t('schedule.musicians_registered_count', { defaultValue: '{{active}} of {{total}} musicians registered', active: activeCount, total: totalNeeded })}
    >
      {activeCount}/{totalNeeded}
    </span>
  )
}
