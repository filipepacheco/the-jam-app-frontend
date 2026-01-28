/**
 * Navbar Component
 * Role-aware navigation component that displays different menu items based on user role
 */

import {useAuth} from '../hooks'
import {getRoleLabel} from '../lib/auth'
import {useNavigate} from 'react-router-dom'
import {useState} from 'react'
import ThemeSwitcher from './ThemeSwitcher'
import LanguageSwitcher from './LanguageSwitcher'
import {FeedbackButton} from './FeedbackButton'
import {useTranslation} from 'react-i18next'

function Navbar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, user, role, logout, isViewer } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      // Redirect to home after logout
      navigate('/')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="navbar bg-base-100 shadow-lg px-2 sm:px-4 py-2 sm:py-3 gap-1 sm:gap-2 md:gap-3">
      {/* Navbar Start - Logo and Mobile Menu */}
      <div className="navbar-start">
        <div className="dropdown">
          <button tabIndex={0} className="btn btn-ghost lg:hidden" aria-label={t('nav.toggle_menu')}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </button>
          <ul
            tabIndex={0}
            className="menu dropdown-content bg-base-100 rounded-box z-50 mt-3 w-56 sm:w-60 p-2 shadow text-sm">
            {/* Mobile Menu Items */}
            <li><a href="/">{t('nav.home')}</a></li>
            <li><a href="/jams">{t('nav.browse_jams')}</a></li>
            {/* Mobile auth short link */}
            {!isAuthenticated && (
              <li><a href="/register">{t('nav.login_register')}</a></li>
            )}
            {user?.isHost && (
              <li><a href="/musicians">{t('nav.musicians')}</a></li>
            )}
            {!isViewer() && (
              <li><a href="/music">{t('nav.music_library')}</a></li>
            )}
            {user?.isHost && (
              <>
                <li><a href="/host/dashboard">{t('nav.host_dashboard')}</a></li>
                <li><a href="/host/create-jam">{t('nav.create_jam')}</a></li>
              </>
            )}
            <li><FeedbackButton iconOnly className="w-full justify-start" /></li>
          </ul>
        </div>
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
          {user?.isHost && (
            <li><a href="/musicians">{t('nav.musicians')}</a></li>
          )}
          {!isViewer() && (
            <li><a href="/music">{t('nav.music')}</a></li>
          )}
          {user?.isHost && (
            <li><a href="/host/dashboard">{t('nav.host_dashboard')}</a></li>
          )}
          {/* LanguageSwitcher removed from main nav; appears in auth dropdown list */}
        </ul>
      </div>

      {/* Navbar End - Auth Actions */}
      <div className="navbar-end gap-1 sm:gap-2 md:gap-3 flex-wrap md:flex-nowrap justify-end">
        {/* Feedback Button - Desktop */}
        <FeedbackButton className="hidden sm:flex" />

        {/* Role Badge */}
        <div className="badge badge-outline hidden sm:inline-flex text-xs sm:text-sm">
          {getRoleLabel(role, t)}
        </div>

        {/* Auth Dropdown */}
        <div className="dropdown dropdown-end">
          <button
            tabIndex={0}
            className="btn btn-ghost btn-circle avatar placeholder w-10"
            aria-label={t('nav.user_menu')}>
            <div className="bg-primary text-primary-content rounded-full w-10 flex items-center justify-center text-sm">
              {isAuthenticated && user ? (user.name || 'U').charAt(0).toUpperCase() : 'G'}
            </div>
          </button>
          <ul
            tabIndex={0}
            className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-56 sm:w-60 text-sm">
            {isAuthenticated && user && (
              <>
                <li className="menu-title">
                  <span className="text-xs sm:text-sm">{user.name || t('auth.complete_profile')}</span>
                </li>
                <li><a href="/profile">{t('nav.my_profile')}</a></li>
                {user?.isHost && (
                  <>
                    <li><a href="/host/dashboard">{t('nav.dashboard')}</a></li>
                    <li><a href="/host/create-jam">{t('nav.create_jam')}</a></li>
                  </>
                )}
                <li>
                  <a
                    onClick={handleLogout}
                    className={isLoggingOut ? 'opacity-50 pointer-events-none' : ''}
                  >
                    {isLoggingOut ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        {t('auth.logging_out')}
                      </>
                    ) : (
                      t('nav.logout')
                    )}
                  </a>
                </li>
              </>
            )}
            {!isAuthenticated && (
              <>
                <li className="disabled"><p>{t('auth.welcome_guest')}</p></li>
                <li><a href="/register">{t('nav.login_register')}</a></li>
              </>
            )}

            <li className="w-full menu-item">
              <div className="flex items-center w-full" role="group" aria-label="Language setting">
                <span className="text-sm" aria-hidden>🌐</span>
                <div className="w-full">
                  <LanguageSwitcher className="w-full" />
                </div>
              </div>
            </li>
            <li className="w-full menu-item">
              <div className="flex items-center w-full" role="group" aria-label="Theme setting">
                <div className="w-full">
                  <ThemeSwitcher className="w-full" />
                </div>
              </div>
            </li>
          </ul>
        </div>

        {/* Create Jam Button - Host Only */}
        {user?.isHost && (
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
      </div>
    </div>
  )
}

export default Navbar
