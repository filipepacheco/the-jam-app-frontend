import {useEffect, useMemo} from 'react'
import {motion} from 'framer-motion'
import {useReducedMotion} from '../../hooks'
import {LanguageSelector} from './LanguageSelector'
import {useTranslation} from 'react-i18next'
import {Action, IconAction} from '../Action'
import {Field} from '../Field'
import {NavigationLink} from '../Navigation'
import type {DashboardLayout} from '../../hooks'

interface DashboardControlsPanelProps {
  visible: boolean
  jamId?: string
  jamSlug?: string | null
  onClose: () => void
  currentLang: string
  onChangeLanguage: (lang: string) => void
  pollingMs?: number
  onPollingChange?: (ms: number) => void
  layout?: DashboardLayout
  onLayoutChange?: (layout: DashboardLayout) => void
  carouselIntervalMs?: number
  onCarouselIntervalChange?: (ms: number) => void
}

// This panel is host-facing, not part of the venue-projected
// content: it is opened up close by whoever runs the display, so it can
// carry the standard 44px canonical controls without affecting the
// distance-legible screen behind it.
export default function DashboardControlsPanel({ visible, jamId, jamSlug, onClose, currentLang, onChangeLanguage, pollingMs = 5000, onPollingChange, layout, onLayoutChange, carouselIntervalMs, onCarouselIntervalChange }: DashboardControlsPanelProps) {
  const { t } = useTranslation()
  const { transition } = useReducedMotion()

  const panelTransition = useMemo(() => ({
    opacity: transition.duration === 0 ? 0.1 : 0,
    y: -20
  }), [transition])

  useEffect(() => {
    if (!visible) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose, visible])

  if (!visible) return null

  const handleBackdropClick = () => {
    onClose()
  }

  const closePanelLabel = t('publicDashboard.closeControls', 'Close dashboard controls')
  const layoutLabel = t('publicDashboard.layoutLabel', 'Layout')

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-30"
        style={{ background: 'var(--ds-surface-overlay)' }}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      <motion.div
        id="public-dashboard-controls-panel"
        initial={panelTransition}
        animate={{ opacity: 1, y: 0 }}
        exit={panelTransition}
        transition={transition}
        className="fixed top-16 left-0 right-0 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto bg-base-200 border-b border-base-300 p-4"
        role="region"
        aria-label={t('publicDashboard.dashboardControls', 'Dashboard controls')}
      >
        <div className="flex flex-wrap items-center gap-4 max-w-6xl mx-auto">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <NavigationLink href="/" onClick={onClose}>
              {t('publicDashboard.backToHome', '← Back to Home')}
            </NavigationLink>
            <NavigationLink href={`/jams/${jamSlug || jamId}`} onClick={onClose}>
              {t('publicDashboard.viewDetails', 'View Full Details →')}
            </NavigationLink>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LanguageSelector currentLang={currentLang} onChange={onChangeLanguage} onSelectClose={onClose} />

            {onLayoutChange && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-base-content">{layoutLabel}:</span>
                <div className="flex items-center gap-2" role="group" aria-label={layoutLabel}>
                  <Action
                    variant={layout === 'classic' ? 'primary' : 'secondary'}
                    className="ds-control--host"
                    aria-pressed={layout === 'classic'}
                    onClick={() => onLayoutChange('classic')}
                  >
                    <Action.Label>{t('publicDashboard.layoutClassic', 'Classic')}</Action.Label>
                  </Action>
                  <Action
                    variant={layout === 'carousel' ? 'primary' : 'secondary'}
                    className="ds-control--host"
                    aria-pressed={layout === 'carousel'}
                    onClick={() => onLayoutChange('carousel')}
                  >
                    <Action.Label>{t('publicDashboard.layoutCarousel', 'Carousel')}</Action.Label>
                  </Action>
                </div>
              </div>
            )}

            {layout === 'carousel' && onCarouselIntervalChange && (
              <Field
                id="carousel-slide-duration"
                label={t('publicDashboard.slideDuration', 'Slide Duration')}
              >
                <Field.Select
                  value={carouselIntervalMs}
                  onChange={(e) => onCarouselIntervalChange(Number(e.target.value))}
                >
                  <option value={5000}>5s</option>
                  <option value={8000}>8s</option>
                  <option value={10000}>10s</option>
                  <option value={15000}>15s</option>
                  <option value={20000}>20s</option>
                </Field.Select>
              </Field>
            )}

            {onPollingChange && (
              <Field
                id="dashboard-polling-interval"
                label={t('publicDashboard.autoRefresh', 'Auto-refresh')}
              >
                <Field.Select
                  value={pollingMs}
                  onChange={(e) => onPollingChange(Number(e.target.value))}
                >
                  <option value={0}>{t('publicDashboard.off', 'Off')}</option>
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                  <option value={30000}>30s</option>
                  <option value={60000}>1m</option>
                </Field.Select>
              </Field>
            )}
          </div>

          <IconAction
            variant="quiet"
            onClick={onClose}
            title={closePanelLabel}
            label={closePanelLabel}
            className="shrink-0"
          >
            ✕
          </IconAction>
        </div>
      </motion.div>
    </>
  )
}
