import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'
import { Zap, Search } from 'lucide-react'

function CallToAction() {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section className="relative bg-base-300" aria-labelledby="cta-title">

      <motion.div
        ref={ref}
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 id="cta-title" className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 text-base-content text-wrap-balance">
            {t('homepage.call_to_action.title')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl mb-8 sm:mb-10 text-base-content/80 leading-relaxed">
            {t('homepage.call_to_action.description')}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/register"
              className="btn btn-lg btn-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              <Zap className="size-5" aria-hidden="true" />
              {t('homepage.call_to_action.cta_button')}
            </Link>
            <Link
              to="/jams"
              className="btn btn-lg btn-outline btn-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              <Search className="size-5" aria-hidden="true" />
              {t('homepage.call_to_action.browse_jams')}
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default CallToAction
