import React from 'react'
import {motion} from 'framer-motion'
import {LanguageSelector} from './LanguageSelector'

interface Props {
  visible: boolean
  jamId?: string
  onClose: () => void
  currentLang: string
  onChangeLanguage: (lang: string) => void
  pollingMs?: number
  onPollingChange?: (ms: number) => void
}

export default function Navbar({ visible, jamId, onClose, currentLang, onChangeLanguage, pollingMs = 5000, onPollingChange }: Props) {
  if (!visible) return null
  return (
    <motion.div
      id="public-dashboard-navbar"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-16 left-0 right-0 z-40 bg-base-200 border-b border-base-300 p-4"
      role="navigation"
    >
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-1">
          <div className="flex items-center gap-4">
            <a href="/" onClick={onClose} className="link link-hover">← Back to Home</a>
            <a href={`/jams/${jamId}`} onClick={onClose} className="link link-hover">View Full Details →</a>
          </div>

              <LanguageSelector currentLang={currentLang} onChange={onChangeLanguage} onSelectClose={onClose} />

        {onPollingChange && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-base-content">🔄</span>
            <select
              value={pollingMs}
              onChange={(e) => onPollingChange(Number(e.target.value))}
              className="select select-sm bg-slate-800 text-white"
            >
              <option value={0}>Off</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
            </select>
          </div>
        )}

        <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost text-base-content"
            title="Close navbar"
            aria-label="Close navbar"
        >
          ✕
        </button>
        </div>

      </div>
    </motion.div>
  )
}

