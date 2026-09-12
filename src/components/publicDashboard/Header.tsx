import { useTranslation } from 'react-i18next'
import { IconAction } from '../Action'

interface HeaderProps {
  title: string
  showNavbar: boolean
  setShowNavbar: (v: boolean) => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  ariaToggleLabel?: string
  tickerText?: string | null
}

// The Public Dashboard header is projected on a venue screen: its icon
// controls stay on a transparent overlay so they never cover the ticker or
// title. IconAction's `quiet` variant already renders transparent, so only
// layout and stacking classes are added here; no visual redesign.
export default function Header({
  title,
  showNavbar,
  setShowNavbar,
  isFullscreen,
  onToggleFullscreen,
  ariaToggleLabel,
  tickerText,
}: HeaderProps) {
  const { t } = useTranslation()
  const toggleNavbarLabel = ariaToggleLabel || t('publicDashboard.toggleNavbar', 'Toggle navbar')
  const fullscreenLabel = isFullscreen
    ? t('publicDashboard.exitFullscreen', 'Exit fullscreen')
    : t('publicDashboard.enterFullscreen', 'Enter fullscreen')

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 pointer-events-none">
      <IconAction
        variant="quiet"
        onClick={() => setShowNavbar(!showNavbar)}
        className="pointer-events-auto text-base-content shrink-0 z-10"
        title={toggleNavbarLabel}
        aria-expanded={showNavbar}
        aria-controls="public-dashboard-navbar"
        label={toggleNavbarLabel}
      >
        ☰
      </IconAction>

      {tickerText ? (
        <div className="absolute inset-x-14 top-0 bottom-0 overflow-hidden flex items-center pointer-events-none">
          <div className="whitespace-nowrap text-lg sm:text-2xl md:text-3xl font-bold animate-ticker">
            {`${tickerText}     ·     `.repeat(6)}
          </div>
        </div>
      ) : (
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-lg sm:text-2xl md:text-3xl font-bold pointer-events-none max-w-[60%] text-center ds-wrap-user-content">
          <span aria-hidden="true">🎤</span> <span className="pointer-events-none">{title}</span>
        </h1>
      )}

      <div className="flex items-center gap-2 pointer-events-auto shrink-0 z-10">
        <IconAction
          variant="quiet"
          onClick={onToggleFullscreen}
          className="text-base-content"
          title={fullscreenLabel}
          aria-pressed={isFullscreen}
          label={fullscreenLabel}
        >
          {isFullscreen ? '✕' : '⛶'}
        </IconAction>
      </div>
    </div>
  )
}
