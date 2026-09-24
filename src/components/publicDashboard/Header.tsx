import { useTranslation } from 'react-i18next'
import { IconAction } from '../Action'

interface HeaderProps {
  title: string
  showControlsPanel: boolean
  setShowControlsPanel: (visible: boolean) => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  ariaToggleLabel?: string
  tickerText?: string | null
}

// Keep host controls compact and separate from the audience's stage content.
export default function Header({
  title,
  showControlsPanel,
  setShowControlsPanel,
  isFullscreen,
  onToggleFullscreen,
  ariaToggleLabel,
  tickerText,
}: HeaderProps) {
  const { t } = useTranslation()
  const toggleControlsLabel = ariaToggleLabel || t('publicDashboard.toggleControls')
  const fullscreenLabel = isFullscreen
    ? t('publicDashboard.exitFullscreen')
    : t('publicDashboard.enterFullscreen')

  return (
    <header className={`${tickerText ? 'absolute top-0 inset-x-0' : 'relative'} z-30 flex min-h-24 items-center gap-4 px-4 py-3 md:px-10`}>
      {!tickerText && <h1 className="min-w-0 flex-1 text-lg font-bold md:text-2xl ds-wrap-user-content">{title}</h1>}
      {tickerText && (
        <div className="min-w-0 flex-1 overflow-hidden">
          <h1 className="sr-only">{title}</h1>
          <div aria-hidden="true" className="whitespace-nowrap text-lg sm:text-2xl md:text-3xl font-bold animate-ticker">
            {`${tickerText}     ·     `.repeat(6)}
          </div>
        </div>
      )}
      <IconAction
        variant="quiet"
        onClick={() => setShowControlsPanel(!showControlsPanel)}
        className="text-base-content shrink-0 ds-control--shared-display"
        title={toggleControlsLabel}
        aria-expanded={showControlsPanel}
        aria-controls="public-dashboard-controls-panel"
        label={toggleControlsLabel}
      >
        ☰
      </IconAction>

      <div className="flex items-center gap-2 pointer-events-auto shrink-0 z-10">
        <IconAction
          variant="quiet"
          onClick={onToggleFullscreen}
          className="text-base-content ds-control--shared-display"
          title={fullscreenLabel}
          aria-pressed={isFullscreen}
          label={fullscreenLabel}
        >
          {isFullscreen ? '✕' : '⛶'}
        </IconAction>
      </div>
    </header>
  )
}
