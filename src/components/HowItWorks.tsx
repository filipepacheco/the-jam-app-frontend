import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ClipboardList, UserPlus, Play } from 'lucide-react'

export function HowItWorks() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const steps = [
    {
      id: 'create',
      number: '1',
      icon: <ClipboardList className="size-6" />,
      title: t('homepage.how_it_works.step1_title'),
      description: t('homepage.how_it_works.step1_desc'),
    },
    {
      id: 'register',
      number: '2',
      icon: <UserPlus className="size-6" />,
      title: t('homepage.how_it_works.step2_title'),
      description: t('homepage.how_it_works.step2_desc'),
    },
    {
      id: 'perform',
      number: '3',
      icon: <Play className="size-6" />,
      title: t('homepage.how_it_works.step3_title'),
      description: t('homepage.how_it_works.step3_desc'),
    },
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-base-100" aria-labelledby="how-it-works-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 id="how-it-works-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 text-base-content text-wrap-balance">
            {t('homepage.how_it_works.title')}
          </h2>
          <p className="text-base sm:text-lg text-base-content/60">
            {t('homepage.how_it_works.subtitle')}
          </p>
        </div>

        <motion.div
          ref={ref}
          className="relative grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={{
            visible: {
              transition: { staggerChildren: 0.2 },
            },
          }}
        >
          {/* Connecting line - desktop only */}
          <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-px bg-base-300" aria-hidden="true" />

          {steps.map((step) => (
            <motion.div
              key={step.id}
              className="relative flex flex-col items-center text-center"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5 }}
            >
              {/* Step number circle */}
              <div className="relative z-10 w-14 h-14 rounded-full bg-primary text-primary-content flex items-center justify-center mb-5 shadow-md">
                <span className="text-xl font-bold leading-none">{step.number}</span>
              </div>

              {/* Card */}
              <div className="card bg-base-200 w-full">
                <div className="card-body p-5 sm:p-6 items-center">
                  <div className="text-primary mb-2">
                    {step.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-base-content mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-base-content/60 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
