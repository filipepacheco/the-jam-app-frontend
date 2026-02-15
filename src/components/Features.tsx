import { useTranslation } from 'react-i18next'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

function Features() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const cards = [
    {
      id: 'hosts',
      color: 'primary' as const,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 sm:h-9 sm:w-9"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      title: t('jams.features.hosts_title'),
      description: t('jams.features.hosts_desc'),
    },
    {
      id: 'musicians',
      color: 'secondary' as const,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 sm:h-9 sm:w-9"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      title: t('jams.features.musicians_title'),
      description: t('jams.features.musicians_desc'),
    },
    {
      id: 'audience',
      color: 'accent' as const,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 sm:h-9 sm:w-9"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: t('jams.features.audience_title'),
      description: t('jams.features.audience_desc'),
    },
  ]

  const colorStyles = {
    primary: {
      border: 'border-t-primary',
      iconBg: 'bg-primary/10 text-primary',
      hoverShadow: 'hover:shadow-xl hover:shadow-primary/10',
    },
    secondary: {
      border: 'border-t-secondary',
      iconBg: 'bg-secondary/10 text-secondary',
      hoverShadow: 'hover:shadow-xl hover:shadow-secondary/10',
    },
    accent: {
      border: 'border-t-accent',
      iconBg: 'bg-accent/10 text-accent',
      hoverShadow: 'hover:shadow-xl hover:shadow-accent/10',
    },
  }

  return (
    <section className="py-8 sm:py-12 lg:py-16 px-2 sm:px-4 lg:px-8 bg-base-100" aria-labelledby="features-title">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            {t('jams.features.description')}
          </p>
          <h2 id="features-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-base-content text-wrap-balance">
            {t('jams.features.title')}
          </h2>
        </div>

        <motion.div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
        >
          {cards.map((card) => {
            const styles = colorStyles[card.color]
            return (
              <motion.div
                key={card.id}
                className={`card bg-base-200 border-t-4 ${styles.border} shadow-lg ${styles.hoverShadow} transition-shadow duration-300`}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -6 }}
              >
                <div className="card-body p-5 sm:p-8 items-center lg:items-start">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${styles.iconBg} flex items-center justify-center mb-3 sm:mb-4`}>
                    {card.icon}
                  </div>
                  <h3 className="card-title text-lg sm:text-xl font-bold text-center lg:text-left">
                    {card.title}
                  </h3>
                  <p className="text-sm sm:text-base text-base-content/70 text-center lg:text-left">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

export default Features
