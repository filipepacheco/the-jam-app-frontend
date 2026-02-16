import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Quote } from 'lucide-react'

export function Testimonials() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const testimonials = [
    {
      id: 'host-1',
      quote: t('homepage.testimonials.host_quote'),
      name: t('homepage.testimonials.host_name'),
      role: t('homepage.testimonials.host_role'),
      color: 'primary' as const,
    },
    {
      id: 'musician-1',
      quote: t('homepage.testimonials.musician_quote'),
      name: t('homepage.testimonials.musician_name'),
      role: t('homepage.testimonials.musician_role'),
      color: 'secondary' as const,
    },
    {
      id: 'venue-1',
      quote: t('homepage.testimonials.venue_quote'),
      name: t('homepage.testimonials.venue_name'),
      role: t('homepage.testimonials.venue_role'),
      color: 'accent' as const,
    },
  ]

  const colorStyles = {
    primary: {
      border: 'border-l-primary',
      quoteMark: 'text-primary/20',
      dot: 'bg-primary',
    },
    secondary: {
      border: 'border-l-secondary',
      quoteMark: 'text-secondary/20',
      dot: 'bg-secondary',
    },
    accent: {
      border: 'border-l-accent',
      quoteMark: 'text-accent/20',
      dot: 'bg-accent',
    },
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-base-200" aria-labelledby="testimonials-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 id="testimonials-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 text-base-content text-wrap-balance">
            {t('homepage.testimonials.title')}
          </h2>
          <p className="text-base sm:text-lg text-base-content/60">
            {t('homepage.testimonials.subtitle')}
          </p>
        </div>

        <motion.div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{
            visible: {
              transition: { staggerChildren: 0.15 },
            },
          }}
        >
          {testimonials.map((testimonial) => {
            const styles = colorStyles[testimonial.color]
            return (
              <motion.div
                key={testimonial.id}
                className={`card bg-base-100 shadow-lg border-l-4 ${styles.border}`}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -4 }}
              >
                <div className="card-body p-5 sm:p-6">
                  <Quote className={`size-8 ${styles.quoteMark} mb-2 shrink-0`} aria-hidden="true" />

                  <blockquote className="text-sm sm:text-base text-base-content/80 leading-relaxed mb-4">
                    {testimonial.quote}
                  </blockquote>

                  <div className="flex items-center gap-3 mt-auto pt-3 border-t border-base-200">
                    <div className={`w-2.5 h-2.5 rounded-full ${styles.dot} shrink-0`} aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-base-content">{testimonial.name}</p>
                      <p className="text-xs text-base-content/50">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
