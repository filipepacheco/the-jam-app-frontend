import {AnimatePresence, motion} from 'framer-motion'
import {useReducedMotion} from '../../hooks'
import {useTranslation} from 'react-i18next'

// Display-specific wrapper, documented in
// docs/design-system/public-dashboard-migration.md: this stays a fixed,
// high-contrast warning banner instead of adopting the canonical `Status`
// section or `StatusIndicator` dot. Status/StatusIndicator use the
// data-display content tokens, not the bg-warning/text-warning-content
// pairing this banner needs to stay legible from across a venue; the
// component already meets the Status contract otherwise (`role="status"`,
// `aria-live="polite"`, plain-language text alongside the icon).
export default function OfflineBanner({ visible, message }: { visible: boolean; message?: string }) {
  const { t } = useTranslation()
  const { prefersReducedMotion } = useReducedMotion()

  // Drops from the top edge it is attached to; leaves faster than it arrives,
  // so a recovered connection clears the screen without ceremony.
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="offline-banner"
          initial={prefersReducedMotion ? false : {opacity: 0, y: '-100%'}}
          animate={{opacity: 1, y: 0, transition: {duration: prefersReducedMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1]}}}
          exit={{opacity: 0, y: prefersReducedMotion ? 0 : '-60%', transition: {duration: prefersReducedMotion ? 0 : 0.16, ease: [0.5, 0, 0.75, 0]}}}
          className="fixed top-0 left-1/2 transform -translate-x-1/2 z-40 max-w-[calc(100vw-2rem)] bg-warning text-warning-content px-4 py-2 rounded-b-lg ds-wrap-user-content"
          role="status"
          aria-live="polite"
        >
          {message || t('publicDashboard.offlineIndicator')}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
