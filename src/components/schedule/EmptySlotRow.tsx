/**
 * EmptySlotRow - Ghosted row indicating unfilled instrument slots
 * Shows instrument emoji + "Open slot" or "N open slots"
 */

import { getInstrumentIcon } from '../../lib/schedule/instrumentHelpers'
import { useTranslation } from 'react-i18next'

interface EmptySlotRowProps {
  instrument: string
  count: number
}

export function EmptySlotRow({ instrument, count }: EmptySlotRowProps) {
  const { t } = useTranslation()

  if (count <= 0) return null

  const label =
    count === 1
      ? t('schedule.empty_slot')
      : t('schedule.empty_slots_count', { count })

  return (
    <div className="flex items-center gap-1.5 py-1 text-xs min-h-[36px] text-base-content/30 italic">
      <span className="flex-shrink-0 w-4 text-center text-sm leading-none opacity-40">
        {getInstrumentIcon(instrument)}
      </span>
      <span className="truncate">{label}</span>
    </div>
  )
}
