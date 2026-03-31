import { useTranslation } from 'react-i18next'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'
import { ClipboardList, Music, Video } from 'lucide-react'

function Features() {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const cards = [
    {
      id: 'hosts',
      color: 'primary' as const,
      icon: <ClipboardList className="size-8 sm:size-9" strokeWidth={1.5} aria-hidden="true" />,
      title: t('jams.features.hosts_title'),
      description: t('jams.features.hosts_desc'),
    },
    {
      id: 'musicians',
      color: 'secondary' as const,
      icon: <Music className="size-8 sm:size-9" strokeWidth={1.5} aria-hidden="true" />,
      title: t('jams.features.musicians_title'),
      description: t('jams.features.musicians_desc'),
    },
    {
      id: 'audience',
      color: 'accent' as const,
      icon: <Video className="size-8 sm:size-9" strokeWidth={1.5} aria-hidden="true" />,
      title: t('jams.features.audience_title'),
      description: t('jams.features.audience_desc'),
    },
  ]

  const colorStyles = {
    primary: {
      border: 'border-t-primary',
      iconColor: 'text-primary',
      hoverShadow: 'hover:shadow-xl hover:shadow-primary/10',
    },
    secondary: {
      border: 'border-t-secondary',
      iconColor: 'text-secondary',
      hoverShadow: 'hover:shadow-xl hover:shadow-secondary/10',
    },
    accent: {
      border: 'border-t-accent',
      iconColor: 'text-accent',
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
          initial={prefersReducedMotion ? 'visible' : 'hidden'}
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
              >
                <div className="card-body p-5 sm:p-8 items-center lg:items-start">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={styles.iconColor}>
                      {card.icon}
                    </span>
                    <h3 className="card-title text-lg sm:text-xl font-bold">
                      {card.title}
                    </h3>
                  </div>
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
