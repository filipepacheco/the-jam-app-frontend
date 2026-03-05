import React, { useCallback, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { getJamShortUrl } from '../../utils/jamUrl'

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface QRCodeCornerProps {
  jamId?: string
  shortCode?: string | null
  position?: Position
}

export default function QRCodeCorner({ jamId, shortCode, position = 'bottom-left' }: QRCodeCornerProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  const url = getJamShortUrl({ id: jamId || '', shortCode })

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsExpanded(false)
  }, [])

  useEffect(() => {
    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isExpanded, handleKeyDown])

  const positionClasses: Record<Position, string> = {
    'top-left': 'fixed top-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'bottom-right': 'fixed bottom-6 right-6',
  }

  return (
    <>
      {/* QR Code in Corner */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        onClick={() => setIsExpanded(true)}
        className={`${positionClasses[position]} bg-base-content/10 hover:bg-base-content/20 backdrop-blur border border-base-content/20 rounded-lg p-5 z-40 transition-colors cursor-pointer hidden md:block`}
        type="button"
        aria-label={t('publicDashboard.expandQrCode', 'Expand QR code')}
      >
        <QRCodeSVG value={url} size={150} fgColor="#ffffff" bgColor="transparent" aria-label={t('publicDashboard.qrCodeAlt', 'QR code to join jam session')} />
        <p className="text-xs text-center mt-2 text-base-content/60">{t('publicDashboard.scanToJoin', 'Scan to join')}</p>
      </motion.button>

      {/* Expanded QR Code Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 bg-neutral/70 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={t('publicDashboard.joinTheJam', 'Join the Jam')}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-base-100 rounded-2xl p-8 max-w-md w-full flex flex-col items-center justify-center"
            >
              <h2 className="text-2xl font-bold mb-6 text-base-content">{t('publicDashboard.joinTheJam', 'Join the Jam')}</h2>

              <div className="bg-white p-6 rounded-lg mb-4">
                <QRCodeSVG value={url} size={280} fgColor="#000000" bgColor="#ffffff" aria-label={t('publicDashboard.qrCodeAlt', 'QR code to join jam session')} />
              </div>

              {shortCode && (
                <p className="text-center text-base-content font-mono text-2xl font-bold tracking-widest mb-2">
                  {shortCode}
                </p>
              )}
              <p className="text-center text-base-content mb-2">
                {shortCode ? t('publicDashboard.scanOrTypeCode', 'Scan the QR code or type the code above') : t('publicDashboard.scanWithPhone', 'Scan the QR code with your phone')}
              </p>
              <p className="text-sm text-base-content/70 text-center">{url}</p>

              <button
                onClick={() => setIsExpanded(false)}
                className="btn btn-primary mt-6 w-full"
                type="button"
              >
                {t('common.close', 'Close')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
