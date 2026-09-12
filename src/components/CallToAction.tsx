import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef, type MouseEvent } from 'react'
import { Zap, Search } from 'lucide-react'
import { NavigationLink } from './Navigation'

function CallToAction() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  const handleNavigate = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    void navigate(path)
  }

  return (
    <section className="relative bg-base-300" aria-labelledby="cta-title">

      <motion.div
        ref={ref}
        className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-3xl mx-auto text-left">
          <h2 id="cta-title" className="font-display text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 text-base-content text-wrap-balance tracking-tight">
            {t('homepage.call_to_action.title')}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl mb-8 sm:mb-10 text-base-content/80 leading-relaxed max-w-xl">
            {t('homepage.call_to_action.description')}
          </p>
          <div className="flex gap-4 justify-start flex-wrap">
            <NavigationLink
              href="/register"
              variant="primary"
              onClick={handleNavigate('/register')}
              icon={<Zap className="size-5" />}
            >
              {t('homepage.call_to_action.cta_button')}
            </NavigationLink>
            <NavigationLink
              href="/jams"
              variant="secondary"
              onClick={handleNavigate('/jams')}
              icon={<Search className="size-5" />}
            >
              {t('homepage.call_to_action.browse_jams')}
            </NavigationLink>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default CallToAction
