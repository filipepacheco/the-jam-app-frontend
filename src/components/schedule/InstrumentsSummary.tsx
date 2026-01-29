/**
 * Instruments Summary Component
 * Displays available/needed instruments as badges
 * Reusable across modals
 */

import { useTranslation } from 'react-i18next'
import type { InstrumentOption } from '../../utils/scheduleUtils'
import { getInstrumentIcon } from '../../lib/schedule/instrumentHelpers'

interface InstrumentsSummaryProps {
  instrumentOptions: InstrumentOption[]
}

export function InstrumentsSummary({ instrumentOptions }: InstrumentsSummaryProps) {
  const { t } = useTranslation()

  // Filter out instruments that are already full
  const availableOptions = instrumentOptions.filter((option) => option.needed - option.registered > 0)

  // Don't render if no instruments need musicians
  if (availableOptions.length === 0) return null

  return (
    <div className="text-sm text-base-content/70 mb-4 p-3 bg-base-200 rounded">
      <p className="font-semibold mb-2 text-xs">{t('schedule.instruments_needed')}</p>
      <div className="flex flex-wrap gap-2">
        {availableOptions.map((option) => {
          const remaining = option.needed - option.registered
          return (
            <span
              key={option.key}
              className="badge badge-sm badge-warning"
              title={option.label}
            >
              {getInstrumentIcon(option.key)} {t('schedule.left_count', { count: remaining })}
            </span>
          )
        })}
      </div>
    </div>
  )
}
