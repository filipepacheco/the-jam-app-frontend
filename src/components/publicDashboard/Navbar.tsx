import React, { useMemo } from 'react'
import {motion} from 'framer-motion'
import {useReducedMotion} from '../../hooks'
import {LanguageSelector} from './LanguageSelector'
import {useTranslation} from 'react-i18next'
import {Action, IconAction} from '../Action'
import {Field} from '../Field'
import type {DashboardLayout} from '../../hooks'

interface Props {
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

// The navbar is a host-facing settings drawer, not the venue-projected
// content: it is opened up close by whoever runs the display, so it can
// carry the standard 44px canonical controls without affecting the
// distance-legible screen behind it.
export default function Navbar({ visible, jamId, jamSlug, onClose, currentLang, onChangeLanguage, pollingMs = 5000, onPollingChange, layout, onLayoutChange, carouselIntervalMs, onCarouselIntervalChange }: Props) {
  const { t } = useTranslation()
  const { transition } = useReducedMotion()

  const navbarTransition = useMemo(() => ({
    opacity: transition.duration === 0 ? 0.1 : 0,
    y: -20
  }), [transition])

  if (!visible) return null

  const handleBackdropClick = () => {
    onClose()
  }

  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const closeNavbarLabel = t('publicDashboard.closeNavbar', 'Close navbar')
  const layoutLabel = t('publicDashboard.layoutLabel', 'Layout')

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-30 bg-black/50"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      <motion.div
        id="public-dashboard-navbar"
        initial={navbarTransition}
        animate={{ opacity: 1, y: 0 }}
        exit={navbarTransition}
        transition={transition}
        className="fixed top-16 left-0 right-0 z-40 bg-base-200 border-b border-base-300 p-4"
        role="navigation"
        onKeyDown={handleEscapeKey}
      >
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-1">
          <div className="flex items-center gap-4">
            <a href="/" onClick={onClose} className="link link-hover">← Back to Home</a>
            <a href={`/jams/${jamSlug || jamId}`} onClick={onClose} className="link link-hover">View Full Details →</a>
          </div>

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
            id="navbar-polling-interval"
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

        <IconAction
            variant="quiet"
            onClick={onClose}
            title={closeNavbarLabel}
            label={closeNavbarLabel}
        >
          ✕
        </IconAction>
        </div>

      </div>
      </motion.div>
    </>
  )
}
