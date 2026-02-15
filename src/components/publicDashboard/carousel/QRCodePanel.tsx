import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'

interface QRCodePanelProps {
  jamId?: string
  shortCode?: string | null
}

export function QRCodePanel({ jamId, shortCode }: QRCodePanelProps) {
  const { t } = useTranslation()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const url = shortCode
    ? `${origin}/j/${shortCode}`
    : `${origin}/jams/${jamId || ''}`

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8">
      <div className="bg-white p-8 rounded-2xl mb-8">
        <QRCodeSVG value={url} size={400} fgColor="#000000" bgColor="#ffffff" />
      </div>

      {shortCode && (
        <p className="text-5xl md:text-7xl font-mono font-bold tracking-[0.5em] mb-4">
          {shortCode}
        </p>
      )}

      <p className="text-2xl md:text-3xl text-slate-300">
        {t('publicDashboard.scanToJoin', 'Scan to join')}
      </p>

      {shortCode && (
        <p className="text-lg md:text-xl text-slate-400 mt-2">
          {t('publicDashboard.enterCode', 'or enter code')}
        </p>
      )}
    </div>
  )
}
