import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Quote } from 'lucide-react'

export function Testimonials() {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      dotInactive: 'bg-primary/30',
    },
    secondary: {
      border: 'border-l-secondary',
      quoteMark: 'text-secondary/20',
      dot: 'bg-secondary',
      dotInactive: 'bg-secondary/30',
    },
    accent: {
      border: 'border-l-accent',
      quoteMark: 'text-accent/20',
      dot: 'bg-accent',
      dotInactive: 'bg-accent/30',
    },
  }

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  // Auto-rotate every 6 seconds, pause on hover
  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, 6000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPaused, testimonials.length])

  const activeTestimonial = testimonials[activeIndex]
  const styles = colorStyles[activeTestimonial.color]

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

        <div
          className="max-w-2xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Testimonial card with AnimatePresence */}
          <div className="relative min-h-[220px] sm:min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial.id}
                className={`card bg-base-100 shadow-lg border-l-4 ${styles.border}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
              >
                <div className="card-body p-6 sm:p-8">
                  <Quote className={`size-10 ${styles.quoteMark} mb-3 shrink-0`} aria-hidden="true" />

                  <blockquote className="text-base sm:text-lg text-base-content/80 leading-relaxed mb-6">
                    {activeTestimonial.quote}
                  </blockquote>

                  <div className="flex items-center gap-3 pt-4 border-t border-base-200">
                    <div className={`w-3 h-3 rounded-full ${styles.dot} shrink-0`} aria-hidden="true" />
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-base-content">{activeTestimonial.name}</p>
                      <p className="text-xs sm:text-sm text-base-content/50">{activeTestimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center gap-3 mt-6" role="tablist" aria-label="Testimonial navigation">
            {testimonials.map((testimonial, index) => {
              const dotStyles = colorStyles[testimonial.color]
              return (
                <button
                  key={testimonial.id}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  aria-label={`${testimonial.name}`}
                  className="flex items-center justify-center w-10 h-10"
                  onClick={() => goToSlide(index)}
                >
                  <span className={`block w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? `${dotStyles.dot} scale-125`
                      : `${dotStyles.dotInactive} hover:scale-110`
                  }`} />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
