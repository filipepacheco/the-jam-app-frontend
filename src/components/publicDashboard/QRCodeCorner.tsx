import { useCallback, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Action } from '../Action'
import { getJamShortUrl } from '../../utils/jamUrl'

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface QRCodeCornerProps {
  jamId?: string
  shortCode?: string | null
  position?: Position
}

export default function QRCodeCorner({ jamId, shortCode, position = 'bottom-left' }: QRCodeCornerProps) {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
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
      {/*
        Display-specific wrapper, documented in
        docs/design-system/public-dashboard-migration.md: this trigger is
        not an icon-only control, so `IconAction` (a single 44px glyph
        button) was evaluated and not applied. It renders a full QR code
        plus a caption inside a touch surface deliberately larger than
        44px for cross-room visibility and thumb reach.
      */}
      <motion.button
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.3 }}
        onClick={() => setIsExpanded(true)}
        className={`${positionClasses[position]} bg-neutral text-neutral-content hover:bg-neutral/90 border border-neutral-content/20 rounded-lg p-5 z-40 transition-colors cursor-pointer hidden md:block`}
        type="button"
        aria-label={t('publicDashboard.expandQrCode', 'Expand QR code')}
      >
        {/* The semantic foreground/surface pair preserves scanner and text contrast across themes. */}
        <QRCodeSVG value={url} size={150} fgColor="currentColor" bgColor="transparent" aria-label={t('publicDashboard.qrCodeAlt', 'QR code to join jam session')} />
        <p className="text-xs text-center mt-2 text-neutral-content">{t('publicDashboard.scanToJoin', 'Scan to join')}</p>
      </motion.button>

      {/* Expanded QR Code Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'var(--ds-surface-overlay)' }}
            role="dialog"
            aria-modal="true"
            aria-label={t('publicDashboard.joinTheJam', 'Join the Jam')}
          >
            <motion.div
              initial={prefersReducedMotion ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { scale: 0.8, opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-base-100 rounded-2xl p-8 max-w-md w-full flex flex-col items-center justify-center"
            >
              <h2 className="text-2xl font-bold mb-6 text-base-content">{t('publicDashboard.joinTheJam', 'Join the Jam')}</h2>

              <div className="bg-base-100 p-6 rounded-lg mb-4">
                {/* Explicit black/white colors preserve scanner contrast in the modal. */}
                <QRCodeSVG value={url} size={280} fgColor="#000000" bgColor="#ffffff" aria-label={t('publicDashboard.qrCodeAlt', 'QR code to join jam session')} />
              </div>

              {shortCode && (
                <p className="text-center text-base-content font-mono text-2xl font-bold tracking-widest mb-2">
                  {shortCode}
                </p>
              )}
              <p className="text-center text-base-content mb-2 ds-type-body ds-wrap-user-content">
                {shortCode ? t('publicDashboard.scanOrTypeCode', 'Scan the QR code or type the code above') : t('publicDashboard.scanWithPhone', 'Scan the QR code with your phone')}
              </p>
              <p className="text-sm text-base-content/70 text-center ds-wrap-user-content">{url}</p>

              <Action
                variant="primary"
                onClick={() => setIsExpanded(false)}
                className="mt-6 w-full"
              >
                <Action.Label>{t('common.close', 'Close')}</Action.Label>
              </Action>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
