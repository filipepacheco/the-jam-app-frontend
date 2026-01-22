import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { useTranslation } from 'react-i18next'

export function EnhancedHero() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAuth()

  const handleCTAClick = () => {
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
    <section className="hero min-h-screen bg-gradient-to-r from-purple-900 via-purple-800 to-rose-900 relative overflow-hidden">
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="hero-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 flex-col lg:flex-row-reverse gap-8 lg:gap-12 relative z-10">
        {/* Hero Image */}
        <motion.div
          className="w-full sm:w-4/5 md:w-3/5 lg:w-2/5 relative z-20 max-h-64 sm:max-h-80 md:max-h-96 lg:max-h-full"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <img
            src="/97130f59c0f23afb65fbd430832420f1.jpg"
            alt="Musicians performing at a rooftop jam session"
            width={600}
            height={400}
            loading="lazy"
            className="rounded-lg shadow-2xl w-full object-cover"
          />
        </motion.div>

        {/* Hero Content */}
        <motion.div
          className="lg:w-3/5 text-center lg:text-left relative z-20 bg-black/50 lg:bg-transparent px-4 py-6 lg:p-0 rounded-lg lg:rounded-none"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <p className="text-sm sm:text-base font-semibold uppercase tracking-wider mb-3 text-white/80">
              {t('homepage.hero.subtitle')}
            </p>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white text-wrap-balance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {t('homepage.hero.title')}
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed text-white/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {t('homepage.hero.description')}
          </motion.p>

          <motion.div
            className="flex gap-4 justify-center lg:justify-start flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <button
              className="btn btn-lg bg-base-100 text-primary hover:bg-base-200 border-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              onClick={handleCTAClick}
            >
              {t('homepage.hero.cta_button')}
            </button>
            <button
              className="btn btn-lg btn-outline text-white border-white hover:bg-white hover:text-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
              onClick={() => navigate('/jams')}
            >
              {t('homepage.hero.cta_secondary')}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}


