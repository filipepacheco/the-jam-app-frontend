import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  X,
  Home,
  Search,
  Users,
  Music,
  LayoutDashboard,
  UserCircle,
  MessageSquareHeart,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../hooks'
import { FeedbackModal } from './FeedbackModal'
import { useState } from 'react'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  hamburgerRef: React.RefObject<HTMLButtonElement | null>
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espanol' },
  { code: 'pt', label: 'Portugues' },
]

const themes = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate',
  'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden',
  'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black',
  'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade',
  'night', 'coffee', 'winter',
]

export function MobileDrawer({ isOpen, onClose, hamburgerRef }: MobileDrawerProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout, isViewer } = useAuth()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const hasBeenOpened = useRef(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
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

  const changeLanguage = (lng: string) => {
    void i18n.changeLanguage(lng)
    try {
      localStorage.setItem('i18nextLng', lng)
    } catch {
      // ignore
    }
  }

  const setTheme = (theme: string) => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // ignore
    }
  }

  const currentLang = (i18n.language || i18n.resolvedLanguage || 'pt').split('-')[0]
  const currentTheme = (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) || 'dark'

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Focus management
  useEffect(() => {
    if (isOpen) {
      hasBeenOpened.current = true
      const timeout = setTimeout(() => { closeButtonRef.current?.focus() }, 50)
      return () => clearTimeout(timeout)
    } else if (hasBeenOpened.current) {
      hamburgerRef.current?.focus()
    }
  }, [isOpen, hamburgerRef])

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const durationClass = prefersReducedMotion.current ? 'duration-0' : 'duration-300'

  // Build nav items based on auth state
  const navItems: { label: string; path: string; icon: React.ReactNode }[] = [
    { label: t('nav.home'), path: '/', icon: <Home className="size-5" /> },
    { label: t('nav.browse_jams'), path: '/jams', icon: <Search className="size-5" /> },
  ]

  if (isAuthenticated && user?.isHost) {
    navItems.push({ label: t('nav.musicians'), path: '/musicians', icon: <Users className="size-5" /> })
  }
  if (isAuthenticated && !isViewer()) {
    navItems.push({ label: t('nav.music_library'), path: '/music', icon: <Music className="size-5" /> })
  }
  if (isAuthenticated && user?.isHost) {
    navItems.push({ label: t('nav.host_dashboard'), path: '/host/dashboard', icon: <LayoutDashboard className="size-5" /> })
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.mobile_menu')}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${durationClass} ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <nav
        className={`fixed top-0 right-0 h-dvh w-80 bg-base-100 shadow-xl flex flex-col transition-transform ${durationClass} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center shrink-0">
                <span className="text-lg font-bold leading-none">{user.name?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-base-content truncate">
                  {user.name || ''}
                </p>
                <p className="text-xs text-base-content/50 truncate">
                  {user.isHost ? t('roles.host') : t('roles.user')}
                </p>
              </div>
            </div>
          ) : (
            <span className="text-base font-semibold text-base-content">{t('common.app_name')}</span>
          )}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label={t('nav.close_menu')}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="divider my-0 px-5"></div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {/* Login CTA for unauthenticated */}
          {!isAuthenticated && (
            <div className="px-2 pb-3">
              <a
                href="/register"
                onClick={(e) => { e.preventDefault(); handleNavClick('/register') }}
                className="btn btn-primary w-full"
              >
                {t('nav.login_register')}
              </a>
            </div>
          )}

          {/* Navigation */}
          <ul className="menu gap-0.5 p-0">
            {navItems.map((item) => (
              <li key={item.path}>
                <a
                  href={item.path}
                  onClick={(e) => { e.preventDefault(); handleNavClick(item.path) }}
                  className="flex items-center gap-3 py-3 text-base"
                >
                  {item.icon}
                  {item.label}
                </a>
              </li>
            ))}

            {/* Profile */}
            {isAuthenticated && user && (
              <li>
                <a
                  href="/profile"
                  onClick={(e) => { e.preventDefault(); handleNavClick('/profile') }}
                  className="flex items-center gap-3 py-3 text-base"
                >
                  <UserCircle className="size-5" />
                  {t('nav.my_profile')}
                </a>
              </li>
            )}

            {/* Feedback */}
            <li>
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                className="flex items-center gap-3 py-3 text-base"
              >
                <MessageSquareHeart className="size-5" />
                {t('feedback.button_text')}
              </button>
            </li>
          </ul>

          {/* Settings */}
          <div className="divider my-2 px-2"></div>

          <div className="flex flex-col gap-3 px-2">
            <div role="group" aria-label={t('common.select_language')}>
              <label className="text-xs font-medium text-base-content/50 uppercase tracking-wide mb-1 block">
                {t('common.select_language')}
              </label>
              <select
                onChange={(e) => changeLanguage(e.target.value)}
                value={currentLang}
                className="select select-bordered w-full"
                aria-label={t('common.select_language')}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>

            <div role="group" aria-label={t('common.select_theme')}>
              <label className="text-xs font-medium text-base-content/50 uppercase tracking-wide mb-1 block">
                {t('common.select_theme')}
              </label>
              <select
                onChange={(e) => setTheme(e.target.value)}
                defaultValue={currentTheme}
                className="select select-bordered w-full"
                aria-label={t('common.select_theme')}
              >
                {themes.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Logout - pinned to bottom */}
        {isAuthenticated && (
          <div className="border-t border-base-300 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => { handleLogout().catch(console.error) }}
              className="btn btn-ghost btn-block justify-start gap-3 text-error text-base"
            >
              <LogOut className="size-5" />
              {t('nav.logout')}
            </button>
          </div>
        )}
      </nav>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>,
    document.body
  )
}
