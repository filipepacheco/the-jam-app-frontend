/**
 * Instruments Summary Component
 * Displays available/needed instruments as badges
 * Reusable across modals
 */

import { useTranslation } from 'react-i18next'
import type { InstrumentOption } from '../../utils/scheduleUtils'
import { getInstrumentIcon } from '../../lib/schedule/instrumentHelpers'
import { normalizeInstrument } from '../../utils/musicianUtils'

interface InstrumentsSummaryProps {
  instrumentOptions: InstrumentOption[]
  highlightInstrument?: string | null
}

export function InstrumentsSummary({ instrumentOptions, highlightInstrument }: InstrumentsSummaryProps) {
  const { t } = useTranslation()

  // Check if this is an "open" song with no requirements defined (-1 means unlimited)
  const hasNoRequirements = instrumentOptions.length > 0 && instrumentOptions.every((opt) => opt.needed === -1)

  // Filter out instruments that are already full (but keep unlimited ones)
  const availableOptions = instrumentOptions.filter(
    (option) => option.needed === -1 || option.needed - option.registered > 0
  )

  // Don't render if no instruments need musicians
  if (availableOptions.length === 0) return null

  // For songs with no requirements, show a different message
  if (hasNoRequirements) {
    return (
      <div className="text-sm text-base-content/70 mb-2 px-2.5 py-1.5 bg-base-200/50 rounded">
        <p className="text-xs text-base-content/60">{t('schedule.any_instrument_welcome')}</p>
      </div>
    )
  }

  const normalizedHighlight = highlightInstrument ? normalizeInstrument(highlightInstrument) : null

  return (
    <div className="text-sm text-base-content/70 mb-2 px-2.5 py-1.5 bg-base-200/50 rounded">
      <p className="font-medium mb-1 text-xs text-base-content/50">{t('schedule.instruments_needed')}</p>
      <div className="flex flex-wrap gap-1.5">
        {availableOptions.map((option) => {
          const remaining = option.needed - option.registered
          const isHighlighted = normalizedHighlight === option.key
          return (
            <span
              key={option.key}
              className={`badge badge-sm gap-1 ${
                isHighlighted
                  ? 'badge-primary animate-pulse ring-2 ring-primary/50'
                  : 'badge-warning'
              }`}
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
