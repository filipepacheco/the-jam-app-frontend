import { useTranslation } from 'react-i18next'

export function Testimonials() {
  const { t } = useTranslation()

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
      bg: 'bg-base-100',
      dot: 'bg-primary',
    },
    secondary: {
      bg: 'bg-base-100',
      dot: 'bg-secondary',
    },
    accent: {
      bg: 'bg-base-100',
      dot: 'bg-accent',
    },
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-base-200" aria-labelledby="testimonials-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-left mb-10 sm:mb-14">
          <h2 id="testimonials-title" className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 text-base-content text-wrap-balance tracking-tight">
            {t('homepage.testimonials.title')}
          </h2>
          <p className="text-base sm:text-lg text-base-content/60">
            {t('homepage.testimonials.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial) => {
            const styles = colorStyles[testimonial.color]
            return (
              <div key={testimonial.id} className={`${styles.bg} rounded-xl p-6`}>
                <blockquote className="text-sm sm:text-base text-base-content/80 leading-relaxed mb-4">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
                  <div>
                    <p className="text-sm font-semibold text-base-content">{testimonial.name}</p>
                    <p className="text-xs text-base-content/60">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
