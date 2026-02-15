/**
 * Navbar Component
 * Role-aware navigation component that displays different menu items based on user role
 */

import { useAuth } from '../hooks'
import { useState, useRef } from 'react'
import { FeedbackButton } from './FeedbackButton'
import { useTranslation } from 'react-i18next'
import { DesktopUserMenu } from './DesktopUserMenu'
import { MobileDrawer } from './MobileDrawer'

function Navbar() {
  const { t } = useTranslation()
  const { isAuthenticated, user, isViewer } = useAuth()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  return (
    <nav className="navbar bg-base-100 shadow-lg px-2 sm:px-4 py-2 sm:py-3 gap-1 sm:gap-2 md:gap-3">
      {/* Navbar Start - Logo */}
      <div className="navbar-start">
        <a href="/" className="btn btn-ghost text-base sm:text-lg md:text-xl">
          <img
            src="/web/icons8-concert-color-96.png"
            alt="App logo"
            className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
          />
          {t('common.app_name')}
        </a>
      </div>

      {/* Navbar Center - Desktop Menu */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><a href="/">{t('nav.home')}</a></li>
          <li><a href="/jams">{t('nav.jams')}</a></li>
          {isAuthenticated && user?.isHost && (
            <li><a href="/musicians">{t('nav.musicians')}</a></li>
          )}
          {isAuthenticated && !isViewer() && (
            <li><a href="/music">{t('nav.music')}</a></li>
          )}
          {isAuthenticated && user?.isHost && (
            <li><a href="/host/dashboard">{t('nav.host_dashboard')}</a></li>
          )}
        </ul>
      </div>

      {/* Navbar End - Actions */}
      <div className="navbar-end gap-1 sm:gap-2 md:gap-3 flex-wrap md:flex-nowrap justify-end">
        {/* Feedback Button - Desktop only */}
        <FeedbackButton className="hidden lg:flex" />

        {/* Desktop User Menu */}
        <DesktopUserMenu className="hidden lg:inline-flex" />

        {/* Create Jam Button - Host Only */}
        {isAuthenticated && user?.isHost && (
          <a href="/host/create-jam" className="btn btn-primary btn-sm whitespace-nowrap">
            {t('nav.create_jam')}
          </a>
        )}

        {/* Register Button - Viewer/Anonymous Only */}
        {isViewer() && !isAuthenticated && (
          <a href="/register" className="btn btn-primary btn-sm whitespace-nowrap">
            {t('nav.join')}
          </a>
        )}

        {/* Mobile Hamburger */}
        <button
          ref={hamburgerRef}
          className="btn btn-ghost lg:hidden"
          onClick={() => setIsDrawerOpen(true)}
          aria-label={t('nav.toggle_menu')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h8m-8 6h16"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        hamburgerRef={hamburgerRef}
      />
    </nav>
  )
}

export default Navbar
