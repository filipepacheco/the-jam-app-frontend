/**
 * Instruments Summary Component
 * Displays available/needed instruments as badges
 * Reusable across modals
 */

import { useTranslation } from 'react-i18next'
import type { InstrumentOption } from '../../utils/scheduleUtils'

interface InstrumentsSummaryProps {
  instrumentOptions: InstrumentOption[]
}

export function InstrumentsSummary({ instrumentOptions }: InstrumentsSummaryProps) {
  const { t } = useTranslation()

  return (
    <div className="text-sm text-base-content/70 mb-4 p-3 bg-base-200 rounded">
      <p className="font-semibold mb-2 text-xs">{t('schedule.instruments_needed')}</p>
      <div className="flex flex-wrap gap-2">
        {instrumentOptions.map((option) => {
          const remaining = option.needed - option.registered
          return (
            <span
              key={option.key}
              className={`badge badge-sm ${remaining > 0 ? 'badge-warning' : 'badge-error'}`}
            >
              {option.emoji} {option.label}:{' '}
              {remaining > 0 ? t('schedule.left_count', { count: remaining }) : t('schedule.full')}
            </span>
          )
        })}
      </div>
    </div>
  )
}
