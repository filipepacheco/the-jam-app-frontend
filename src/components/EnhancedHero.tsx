import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { useTranslation } from 'react-i18next'
import { type MouseEvent } from 'react'
import { HeroDashboardMockup } from './hero/HeroDashboardMockup'
import { NavigationLink } from './Navigation'

export function EnhancedHero() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const { isAuthenticated, role } = useAuth()

  const ctaTo = isAuthenticated
    ? role === 'host' ? '/host/dashboard' : '/jams'
    : '/register'

  const ctaLabel = isAuthenticated
    ? role === 'host' ? t('nav.dashboard') : t('nav.jams')
    : t('homepage.hero.cta_button')

  const handleNavigate = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    void navigate(path)
  }

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-base-300 text-primary-content">
      <div className="absolute inset-0 animate-gradient-shift" aria-hidden="true" />
      <div className="radial-glow" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 flex flex-col lg:flex-row items-center gap-10 lg:gap-12 min-h-screen justify-center">
        {/* Text content */}
        <div className="lg:w-5/12 text-left">
          <motion.p
            className="text-sm sm:text-base font-semibold mb-3 text-primary-content/80 ds-type-ui"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t('homepage.hero.subtitle')}
          </motion.p>

          <motion.h1
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-primary-content text-wrap-balance tracking-tight"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {t('homepage.hero.title')}
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed text-primary-content/80 whitespace-pre-line ds-type-body"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {t('homepage.hero.description')}
          </motion.p>

          <motion.div
            className="flex gap-4 justify-start flex-wrap"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <NavigationLink
              href={ctaTo}
              variant="primary"
              onClick={handleNavigate(ctaTo)}
            >
              {ctaLabel}
            </NavigationLink>
            <NavigationLink
              href="/jams"
              variant="secondary"
              onClick={handleNavigate('/jams')}
            >
              {t('homepage.hero.cta_secondary')}
            </NavigationLink>
          </motion.div>
        </div>

        {/* Dashboard mockup */}
        <div className="w-full lg:w-7/12">
          <HeroDashboardMockup />
        </div>
      </div>

      <div className="hero-bottom-fade absolute inset-x-0 bottom-0 z-0 h-48 sm:h-64 lg:h-72" aria-hidden="true" />
    </section>
  )
}
