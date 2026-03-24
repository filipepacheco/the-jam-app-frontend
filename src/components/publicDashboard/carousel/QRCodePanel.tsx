import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { getJamShareUrl } from '../../../utils/jamUrl'

interface QRCodePanelProps {
  jamId?: string
  slug?: string | null
}

export function QRCodePanel({ jamId, slug }: QRCodePanelProps) {
  const { t } = useTranslation()

  const url = getJamShareUrl({ id: jamId || '', slug })
  // Display-friendly URL: strip protocol, show domain/slug
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '')

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8">
      <div className="bg-white p-8 rounded-2xl mb-8">
        <QRCodeSVG value={url} size={400} fgColor="#000000" bgColor="#ffffff" />
      </div>

      <p className="text-2xl md:text-3xl font-semibold tracking-wide mb-4 font-mono">
        {displayUrl}
      </p>

      <p className="text-2xl md:text-3xl text-base-content/60">
        {t('publicDashboard.scanToJoin', 'Scan to join')}
      </p>
    </div>
  )
}
