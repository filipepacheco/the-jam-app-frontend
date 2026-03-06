import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const MOCK_MUSICIANS_MOBILE = [
  { emoji: '🎤', name: 'Alex' },
  { emoji: '🎸', name: 'Maria' },
  { emoji: '🥁', name: 'James' },
]

const MOCK_MUSICIANS_DESKTOP = [
  ...MOCK_MUSICIANS_MOBILE,
  { emoji: '🎸', name: 'Sophie' },
]

const WAVEFORM_HEIGHTS = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.55, 0.75, 0.45, 0.8, 0.65]

export function HeroDashboardMockup() {
  const { t } = useTranslation()

  return (
    <motion.div
      className="w-full lg:perspective-[1200px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
    >
      <div className="lg:rotate-y-[-2deg] lg:transition-transform lg:duration-700 lg:hover:rotate-y-0">
        {/* Now Playing Card */}
        <div className="bg-linear-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-5 sm:p-6 lg:p-8 shadow-2xl shadow-purple-900/20">
          {/* Header: LIVE indicator + jam name */}
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-green-400">
                {t('homepage.hero.live_label')}
              </span>
            </div>
            <span className="text-xs text-purple-300/60 hidden sm:inline">
              {t('homepage.hero.mock_jam_name')}
            </span>
          </div>

          {/* Now Playing label */}
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-purple-200/80 mb-2">
            {t('publicDashboard.nowPlaying')}
          </p>

          {/* Song title */}
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white animate-text-glow mb-1">
            Don't Stop Believin'
          </h3>

          {/* Artist */}
          <p className="text-sm sm:text-base text-purple-100/90 mb-5 sm:mb-6">
            {t('publicDashboard.by')} Journey
          </p>

          {/* Waveform bars */}
          <div className="flex items-end justify-center gap-[3px] sm:gap-1 h-10 sm:h-12 mb-5 sm:mb-6" aria-hidden="true">
            {WAVEFORM_HEIGHTS.map((height, i) => (
              <div
                key={i}
                className={`w-1.5 sm:w-2 rounded-full bg-linear-to-t from-purple-500 to-blue-400 animate-wave-pulse ${i >= 8 ? 'hidden sm:block' : ''} ${i >= 10 ? 'hidden lg:block' : ''}`}
                style={{
                  height: `${height * 100}%`,
                  animationDelay: `${i * 0.12}s`,
                }}
              />
            ))}
          </div>

          {/* Musician chips */}
          <div className="flex flex-wrap gap-2">
            {MOCK_MUSICIANS_DESKTOP.map((m, i) => (
              <span
                key={m.name}
                className={`inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 border border-purple-400/20 px-3 py-1 text-xs sm:text-sm text-purple-100 ${i === 3 ? 'hidden lg:inline-flex' : ''}`}
              >
                <span aria-hidden="true">{m.emoji}</span>
                {m.name}
              </span>
            ))}
          </div>
        </div>

        {/* Up Next Card (desktop only) */}
        <div className="hidden lg:block mt-3">
          <div className="bg-linear-to-br from-purple-900/25 to-blue-900/25 backdrop-blur-lg border border-purple-500/20 rounded-xl p-4 shadow-lg shadow-purple-900/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-300/60 mb-1">
                  {t('promoVideo.dashboard.upNext')}
                </p>
                <p className="text-lg font-semibold text-white/90">Bohemian Rhapsody</p>
                <p className="text-xs text-purple-200/60">{t('publicDashboard.by')} Queen</p>
              </div>
              <div className="flex -space-x-2">
                {MOCK_MUSICIANS_MOBILE.slice(0, 3).map((m) => (
                  <span
                    key={m.name}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-purple-500/30 border border-purple-400/20 text-xs"
                    title={m.name}
                  >
                    {m.emoji}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
