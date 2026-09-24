import type { ReactNode } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { getJamShareUrl, getJamShortUrl } from '../../../utils/jamUrl'
import {NavigationLink} from '../../Navigation'
import '../venue-display.css'

interface QRCodePanelProps {
  jamId?: string
  slug?: string | null
  shortCode?: string | null
  variant?: 'slide' | 'invitation'
  finished?: boolean
  /** An announcement that rises over the steps, under the QR code. */
  children?: ReactNode
}

export function QRCodePanel({ jamId, slug, shortCode, variant = 'slide', finished = false, children }: QRCodePanelProps) {
  const { t } = useTranslation()

  const jam = {id: jamId || '', slug, shortCode}
  const url = slug ? getJamShareUrl(jam) : getJamShortUrl(jam)
  // Display-friendly URL: strip protocol, show domain/slug
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '')

  if (variant === 'invitation') {
    return (
      <aside className="venue-invitation" aria-label={t('publicDashboard.joinTheJam')}>
        <div>
          <h2 className="venue-invitation-title">{t(finished ? 'publicDashboard.viewThisJam' : 'publicDashboard.takeTheStage')}</h2>
          <p className="venue-support">{t(finished ? 'publicDashboard.viewThisJamHelp' : 'publicDashboard.joinInvitation')}</p>
        </div>
        <QRCodeSVG
          value={url}
          size={320}
          marginSize={4}
          fgColor="#000000"
          bgColor="#ffffff"
          className="venue-qr"
          role="img"
          aria-label={t('publicDashboard.qrCodeAlt')}
        />
        <div className="venue-invitation-foot">
          {!finished && (
            <ol className="venue-steps" role="list">
              <li><span className="venue-step-number" aria-hidden="true">1</span>{t('publicDashboard.scanPhone')}</li>
              <li><span className="venue-step-number" aria-hidden="true">2</span>{t('publicDashboard.chooseMusic')}</li>
              <li><span className="venue-step-number" aria-hidden="true">3</span>{t('publicDashboard.registerToPlay')}</li>
            </ol>
          )}
          <NavigationLink href={url} className="venue-join-link ds-wrap-user-content ds-control--shared-display">
            {displayUrl}
          </NavigationLink>
          {children}
        </div>
      </aside>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8">
      <div className="bg-base-100 p-8 rounded-2xl mb-8">
        <QRCodeSVG
          value={url}
          size={400}
          fgColor="#000000"
          bgColor="#ffffff"
          aria-label={t('publicDashboard.qrCodeAlt')}
        />
      </div>

      <p className="text-2xl md:text-3xl font-semibold tracking-wide mb-4 font-mono ds-wrap-user-content">
        {displayUrl}
      </p>

      <p className="text-2xl md:text-3xl text-base-content/70">
        {t('publicDashboard.scanToJoin')}
      </p>
    </div>
  )
}
