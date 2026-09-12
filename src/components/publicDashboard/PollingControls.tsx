/**
 * Polling Controls Component
 * Select control for adjusting dashboard polling interval
 */

import {useTranslation} from 'react-i18next'
import {Field} from '../Field'

interface PollingControlsProps {
  value: number
  onChange: (value: number) => void
}

// No page currently renders PollingControls (Navbar's own auto-refresh
// Field.Select covers that behavior); it is kept canonical-primitive-clean
// for whichever consumer reintroduces it, per the catalogue's "uncertain
// lifecycle" note.
export function PollingControls({ value, onChange }: PollingControlsProps) {
  const { t } = useTranslation()

  return (
    <div className="px-4 md:px-8 mt-4 max-w-6xl mx-auto">
      <Field id="polling-interval" label={t('publicDashboard.autoRefresh', 'Auto-refresh')}>
        <Field.Select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          <option value={0}>{t('publicDashboard.off', 'Off')}</option>
          <option value={5000}>5s</option>
          <option value={10000}>10s</option>
          <option value={30000}>30s</option>
          <option value={60000}>1m</option>
        </Field.Select>
      </Field>
    </div>
  )
}

