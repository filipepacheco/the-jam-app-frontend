/**
 * Polling Controls Component
 * Select control for adjusting dashboard polling interval
 */

import {useTranslation} from 'react-i18next'

interface PollingControlsProps {
  value: number
  onChange: (value: number) => void
}

export function PollingControls({ value, onChange }: PollingControlsProps) {
  const { t } = useTranslation()

  return (
    <div className="form-control px-4 md:px-8 mt-4 max-w-6xl mx-auto">
      <label htmlFor="polling-interval" className="label">
        <span className="label-text text-slate-100">
          {t('publicDashboard.autoRefresh', 'Auto-refresh')}
        </span>
      </label>
      <select
        id="polling-interval"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="select select-sm bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value={0}>{t('publicDashboard.off', 'Off')}</option>
        <option value={5000}>5s</option>
        <option value={10000}>10s</option>
        <option value={30000}>30s</option>
        <option value={60000}>1m</option>
      </select>
    </div>
  )
}

