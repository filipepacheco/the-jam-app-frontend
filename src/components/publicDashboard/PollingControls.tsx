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
    <div className="px-4 md:px-8 mt-4 max-w-6xl mx-auto">
      <label htmlFor="polling-interval" className="mr-2 text-sm text-slate-300">
        {t('publicDashboard.autoRefresh', 'Auto-refresh')}
      </label>
      <select
        id="polling-interval"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="select select-sm bg-slate-800 text-white"
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

