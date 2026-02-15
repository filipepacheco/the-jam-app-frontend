import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useAuth } from '../hooks'
import ThemeSwitcher from './ThemeSwitcher'
import LanguageSwitcher from './LanguageSwitcher'
import { FeedbackButton } from './FeedbackButton'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  hamburgerRef: React.RefObject<HTMLButtonElement | null>
}

export function MobileDrawer({ isOpen, onClose, hamburgerRef }: MobileDrawerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout, isViewer } = useAuth()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const hasBeenOpened = useRef(false)
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )

  const handleLogout = async () => {
    onClose()
    await logout()
    navigate('/')
  }

  const handleNavClick = useCallback((path: string) => {
    onClose()
    navigate(path)
  }, [onClose, navigate])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Focus management - only restore focus after drawer has been opened at least once
  useEffect(() => {
    if (isOpen) {
      hasBeenOpened.current = true
      const timeout = setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 50)
      return () => clearTimeout(timeout)
    } else if (hasBeenOpened.current) {
      hamburgerRef.current?.focus()
    }
  }, [isOpen, hamburgerRef])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const durationClass = prefersReducedMotion.current ? 'duration-0' : 'duration-300'

  return createPortal(
    <div
      className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.mobile_menu')}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${durationClass} ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <nav
        className={`fixed top-0 right-0 h-dvh w-72 bg-base-100 shadow-xl transition-transform ${durationClass} ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close button */}
        <div className="flex justify-end p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label={t('nav.close_menu')}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-1 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain h-[calc(100%-64px)]">
          {/* Greeting / Login */}
          {isAuthenticated && user ? (
            <p className="text-base-content font-medium px-2 pb-2 truncate">
              {t('nav.greeting', { name: user.name?.split(' ')[0] || '' })}
            </p>
          ) : (
            <a
              href="/register"
              onClick={(e) => {
                e.preventDefault()
                handleNavClick('/register')
              }}
              className="btn btn-primary btn-sm mb-2"
            >
              {t('nav.login_register')}
            </a>
          )}

          <div className="divider my-0"></div>

          {/* Navigation links */}
          <ul className="menu menu-sm p-0 gap-0.5">
            <li>
              <a
                href="/"
                onClick={(e) => { e.preventDefault(); handleNavClick('/') }}
              >
                {t('nav.home')}
              </a>
            </li>
            <li>
              <a
                href="/jams"
                onClick={(e) => { e.preventDefault(); handleNavClick('/jams') }}
              >
                {t('nav.browse_jams')}
              </a>
            </li>
            {isAuthenticated && user?.isHost && (
              <li>
                <a
                  href="/musicians"
                  onClick={(e) => { e.preventDefault(); handleNavClick('/musicians') }}
                >
                  {t('nav.musicians')}
                </a>
              </li>
            )}
            {isAuthenticated && !isViewer() && (
              <li>
                <a
                  href="/music"
                  onClick={(e) => { e.preventDefault(); handleNavClick('/music') }}
                >
                  {t('nav.music_library')}
                </a>
              </li>
            )}
            {isAuthenticated && user?.isHost && (
              <li>
                <a
                  href="/host/dashboard"
                  onClick={(e) => { e.preventDefault(); handleNavClick('/host/dashboard') }}
                >
                  {t('nav.host_dashboard')}
                </a>
              </li>
            )}
          </ul>

          <div className="divider my-0"></div>

          {/* Profile */}
          <ul className="menu menu-sm p-0 gap-0.5">
            {isAuthenticated && user && (
              <li>
                <a
                  href="/profile"
                  onClick={(e) => { e.preventDefault(); handleNavClick('/profile') }}
                >
                  {t('nav.my_profile')}
                </a>
              </li>
            )}
          </ul>

          {/* Feedback - standalone to avoid nested interactive elements */}
          <FeedbackButton className="justify-start" />

          <div className="divider my-0"></div>

          {/* Settings */}
          <div className="flex flex-col gap-2 px-2">
            <div className="flex items-center gap-2" role="group" aria-label={t('common.select_language')}>
              <span className="text-sm" aria-hidden="true">🌐</span>
              <LanguageSwitcher className="flex-1" />
            </div>
            <div role="group" aria-label={t('common.select_theme')}>
              <ThemeSwitcher className="w-full" />
            </div>
          </div>

          {/* Logout */}
          {isAuthenticated && (
            <>
              <div className="divider my-0"></div>
              <ul className="menu menu-sm p-0">
                <li>
                  <button
                    type="button"
                    onClick={() => { handleLogout().catch(console.error) }}
                    className="text-error"
                  >
                    {t('nav.logout')}
                  </button>
                </li>
              </ul>
            </>
          )}
        </div>
      </nav>
    </div>,
    document.body
  )
}
