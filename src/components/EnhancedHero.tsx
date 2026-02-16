import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { useTranslation } from 'react-i18next'
import { HeroDashboardMockup } from './hero/HeroDashboardMockup'

export function EnhancedHero() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAuth()

  const handleCTAClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isAuthenticated) {
      if (role === 'host') {
        navigate('/host/dashboard')
      } else {
        navigate('/jams')
      }
    } else {
      navigate('/register')
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden" data-theme="dark">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animate-gradient-shift" />
      {/* Radial glow spotlight */}
      <div className="radial-glow" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 flex flex-col lg:flex-row items-center gap-10 lg:gap-12 min-h-screen justify-center">
        {/* Text content */}
        <div className="lg:w-5/12 text-center lg:text-left">
          <motion.p
            className="text-sm sm:text-base font-semibold uppercase tracking-wider mb-3 text-white/80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t('homepage.hero.subtitle')}
          </motion.p>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white text-wrap-balance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {t('homepage.hero.title')}
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed text-white/90 whitespace-pre-line"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {t('homepage.hero.description')}
          </motion.p>

          <motion.div
            className="flex gap-4 justify-center lg:justify-start flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Link
              to="/register"
              className="btn btn-lg bg-base-100 text-primary hover:bg-base-200 border-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              onClick={handleCTAClick}
            >
              {t('homepage.hero.cta_button')}
            </Link>
            <Link
              to="/jams"
              className="btn btn-lg btn-outline text-white border-white hover:bg-white hover:text-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
            >
              {t('homepage.hero.cta_secondary')}
            </Link>
          </motion.div>
        </div>

        {/* Dashboard mockup */}
        <div className="w-full lg:w-7/12">
          <HeroDashboardMockup />
        </div>
      </div>

      {/* Bottom gradient transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-b from-transparent to-base-100 z-10" />
    </section>
  )
}
