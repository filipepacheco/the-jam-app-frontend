interface HeaderProps {
  title: string
  showNavbar: boolean
  setShowNavbar: (v: boolean) => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  ariaToggleLabel?: string
  tickerText?: string | null
}

export default function Header({
  title,
  showNavbar,
  setShowNavbar,
  isFullscreen,
  onToggleFullscreen,
  ariaToggleLabel,
  tickerText,
}: HeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 pointer-events-none">
      <button
        type="button"
        onClick={() => setShowNavbar(!showNavbar)}
        className="btn btn-sm btn-ghost text-base-content pointer-events-auto min-h-[44px] min-w-[44px] shrink-0 z-10"
        title={ariaToggleLabel || 'Toggle navbar'}
        aria-expanded={showNavbar}
        aria-controls="public-dashboard-navbar"
        aria-label={ariaToggleLabel || 'Toggle navbar'}
      >
        ☰
      </button>

      {tickerText ? (
        <div className="absolute inset-x-14 top-0 bottom-0 overflow-hidden flex items-center pointer-events-none">
          <div className="whitespace-nowrap text-lg sm:text-2xl md:text-3xl font-bold animate-ticker">
            {`${tickerText}     ·     `.repeat(6)}
          </div>
        </div>
      ) : (
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-lg sm:text-2xl md:text-3xl font-bold pointer-events-none max-w-[60%] truncate">
          🎤 <span className="pointer-events-none">{title}</span>
        </h1>
      )}

      <div className="flex items-center gap-2 pointer-events-auto shrink-0 z-10">
        <button
          onClick={onToggleFullscreen}
          className="btn btn-sm btn-ghost text-base-content pointer-events-auto min-h-[44px] min-w-[44px]"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-pressed={isFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? '✕' : '⛶'}
        </button>
      </div>
    </div>
  )
}
