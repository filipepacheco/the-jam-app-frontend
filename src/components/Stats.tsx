import { motion } from 'framer-motion'
import { useRef } from 'react'
import { useInView } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export function Stats() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  const stats = [
    { id: 'jams', value: "500+", label: t('homepage.stats.sessions') },
    { id: 'musicians', value: "2,000+", label: t('homepage.stats.musicians') },
    { id: 'songs', value: "10,000+", label: t('homepage.stats.songs') }
  ]

  return (
    <section className="py-12 sm:py-16 bg-base-200" aria-labelledby="stats-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="stats-title" className="text-2xl sm:text-3xl font-bold text-center mb-8 text-base-content">
          {t('homepage.stats.title')}
        </h2>
        <motion.div
          ref={ref}
          className="stats stats-vertical sm:stats-horizontal shadow w-full"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6 }}
        >
          {stats.map((stat) => (
            <div key={stat.id} className="stat place-items-center">
              <div className="stat-value text-primary">{stat.value}</div>
              <div className="stat-desc text-base-content/70">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Stats
