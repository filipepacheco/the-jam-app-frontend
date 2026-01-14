import { motion } from 'framer-motion'
import { useRef } from 'react'
import { useInView } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Avatar } from './Avatar'

export function Testimonials() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const testimonials = [
    {
      quote: t('homepage.testimonials.host_quote'),
      name: t('homepage.testimonials.host_name'),
      role: t('homepage.testimonials.host_role'),
      initials: 'SM'
    },
    {
      quote: t('homepage.testimonials.musician_quote'),
      name: t('homepage.testimonials.musician_name'),
      role: t('homepage.testimonials.musician_role'),
      initials: 'MD'
    },
    {
      quote: t('homepage.testimonials.venue_quote'),
      name: t('homepage.testimonials.venue_name'),
      role: t('homepage.testimonials.venue_role'),
      initials: 'AK'
    }
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-base-200" aria-labelledby="testimonials-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 id="testimonials-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-base-content">
            {t('homepage.testimonials.title')}
          </h2>
          <p className="text-lg text-base-content/70">
            {t('homepage.testimonials.subtitle')}
          </p>
        </div>

        <motion.div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15
              }
            }
          }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { opacity: 1, scale: 1 }
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="card bg-base-100 shadow-lg h-full">
                <div className="card-body">
                  <p className="text-base-content/80 italic mb-4">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3 mt-auto">
                    <Avatar name={testimonial.name} size="md" />
                    <div>
                      <p className="font-semibold text-base-content">{testimonial.name}</p>
                      <p className="text-sm text-base-content/60">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Testimonials
