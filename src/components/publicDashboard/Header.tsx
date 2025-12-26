import React from 'react'

interface HeaderProps {
  title: string
  showNavbar: boolean
  setShowNavbar: (v: boolean) => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  currentLang: string
  onChangeLanguage: (lang: string) => void
  ariaToggleLabel?: string
}

export default function Header({
  title,
  showNavbar,
  setShowNavbar,
  isFullscreen,
  onToggleFullscreen,
  ariaToggleLabel,
}: HeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 pointer-events-none">
      <button
        type="button"
        onClick={() => setShowNavbar(!showNavbar)}
        className="btn btn-sm btn-ghost text-white pointer-events-auto"
        title={ariaToggleLabel || 'Toggle navbar'}
        aria-expanded={showNavbar}
        aria-controls="public-dashboard-navbar"
        aria-label={ariaToggleLabel || 'Toggle navbar'}
      >
        ☰
      </button>

      <h1 className="absolute left-1/2 transform -translate-x-1/2 text-2xl md:text-3xl font-bold pointer-events-none">
        🎤 <span className="pointer-events-none">{title}</span>
      </h1>

      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onToggleFullscreen}
          className="btn btn-sm btn-ghost text-white pointer-events-auto"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-pressed={isFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? '⛶' : '️⛶'}
        </button>
      </div>
    </div>
  )
}


