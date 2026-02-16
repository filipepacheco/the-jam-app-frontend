import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Zap, Search } from 'lucide-react'

function CallToAction() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section className="relative overflow-hidden" data-theme="dark">
      {/* Gradient background matching hero */}
      <div className="absolute inset-0 animate-gradient-shift" />

      <motion.div
        ref={ref}
        className="relative z-10 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-white text-wrap-balance">
            {t('homepage.call_to_action.title')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl mb-8 sm:mb-10 text-white/80 leading-relaxed">
            {t('homepage.call_to_action.description')}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              className="btn btn-lg bg-base-100 text-primary hover:bg-base-200 border-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              onClick={() => navigate('/register')}
            >
              <Zap className="size-5" aria-hidden="true" />
              {t('homepage.call_to_action.cta_button')}
            </button>
            <button
              className="btn btn-lg btn-outline text-white border-white hover:bg-white hover:text-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
              onClick={() => navigate('/jams')}
            >
              <Search className="size-5" aria-hidden="true" />
              {t('homepage.call_to_action.browse_jams')}
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default CallToAction
