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

// Waveform bar base heights and per-bar animation durations (seconds)
// Varying durations create an organic, out-of-phase feel like real audio
const WAVEFORM_BARS = [
  { h: 0.3, d: 2.1 },  { h: 0.5, d: 2.6 },  { h: 0.7, d: 1.8 },
  { h: 0.9, d: 2.4 },  { h: 1, d: 1.6 },    { h: 0.85, d: 2.0 },
  { h: 0.6, d: 2.8 },  { h: 0.95, d: 1.7 }, { h: 0.75, d: 2.3 },
  { h: 0.5, d: 2.6 },  { h: 0.8, d: 1.9 },  { h: 0.65, d: 2.5 },
  { h: 0.9, d: 2.1 },  { h: 0.55, d: 2.7 }, { h: 0.7, d: 1.8 },
  { h: 0.4, d: 2.4 },  { h: 0.85, d: 2.0 }, { h: 0.6, d: 2.2 },
  { h: 0.75, d: 1.9 }, { h: 0.45, d: 2.5 },
]

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
        <div className="bg-base-200/90 border border-base-content/10 rounded-2xl p-5 sm:p-6 lg:p-8 shadow-2xl shadow-black/30">
          {/* Header: LIVE indicator + jam name */}
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-success">
                {t('homepage.hero.live_label')}
              </span>
            </div>
            <span className="text-xs text-base-content/40 hidden sm:inline">
              {t('homepage.hero.mock_jam_name')}
            </span>
          </div>

          {/* Now Playing label */}
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-base-content/50 mb-2">
            {t('publicDashboard.nowPlaying')}
          </p>

          {/* Song title - intentionally hardcoded: real, well-known song title */}
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-base-content animate-text-glow mb-1">
            Don't Stop Believin'
          </h3>

          {/* Artist - intentionally hardcoded: real artist name */}
          <p className="text-sm sm:text-base text-base-content/70 mb-5 sm:mb-6">
            {t('publicDashboard.by')} Journey
          </p>

          {/* Waveform bars - animated with varying durations for organic feel */}
          <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-10 sm:h-12 mb-5 sm:mb-6" aria-hidden="true">
            {WAVEFORM_BARS.map((bar, i) => (
              <div
                key={i}
                className={`w-1.5 sm:w-2 rounded-full bg-primary/50 animate-wave-pulse origin-bottom ${i >= 12 ? 'hidden sm:block' : ''} ${i >= 16 ? 'hidden lg:block' : ''}`}
                style={{
                  height: `${bar.h * 100}%`,
                  animationDuration: `${bar.d}s`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>

          {/* Musician chips */}
          <div className="flex flex-wrap gap-2">
            {MOCK_MUSICIANS_DESKTOP.map((m, i) => (
              <span
                key={m.name}
                className={`inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs sm:text-sm text-base-content/80 ${i === 3 ? 'hidden lg:inline-flex' : ''}`}
              >
                <span aria-hidden="true">{m.emoji}</span>
                {m.name}
              </span>
            ))}
          </div>
        </div>

        {/* Up Next Card - visible on all sizes */}
        <div className="mt-3">
          <div className="bg-base-200/60 border border-base-content/8 rounded-xl p-3 sm:p-4 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-base-content/40 mb-1">
                  {t('promoVideo.dashboard.upNext')}
                </p>
                {/* Song/artist names intentionally hardcoded: real, well-known titles */}
                <p className="text-base sm:text-lg font-semibold text-base-content/90">Bohemian Rhapsody</p>
                <p className="text-xs text-base-content/50">{t('publicDashboard.by')} Queen</p>
              </div>
              <div className="flex -space-x-2">
                {MOCK_MUSICIANS_MOBILE.slice(0, 3).map((m) => (
                  <span
                    key={m.name}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/15 border border-primary/20 text-xs"
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
