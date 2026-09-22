import React, { useEffect, useRef, useCallback } from 'react'
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
import { useAppLanguage, useAuth, useTheme } from '../hooks'
import { resolveThemeName } from '../design-system/foundations'
import { FeedbackModal } from './FeedbackModal'
import { useState } from 'react'
import { LANGUAGES, THEMES } from '../lib/uiConstants'
import { Action, IconAction } from './Action'
import { NavigationLink } from './Navigation'
import { SearchableSelect } from './forms/SearchableSelect'
import './MobileDrawer.css'

const THEME_OPTIONS = THEMES.map((theme) => ({
  id: theme,
  label: theme
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' '),
}))

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  hamburgerRef: React.RefObject<HTMLButtonElement | null>
}

export function MobileDrawer({ isOpen, onClose, hamburgerRef }: MobileDrawerProps) {
  const { t } = useTranslation()
  const {currentLang, changeLanguage} = useAppLanguage()
  const languageOptions = LANGUAGES.map((language) => ({
    id: language.code,
    label: t(language.nameKey),
  }))
  const navigate = useNavigate()
  const { isAuthenticated, user, logout, isViewer, isLoading } = useAuth()
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

  const [currentTheme, setTheme] = useTheme()

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
        className={`fixed top-0 right-0 flex h-dvh w-[calc(100vw-1rem)] max-w-sm flex-col bg-base-100 shadow-xl transition-transform ${durationClass} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          {isLoading ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-base-300 animate-pulse shrink-0" />
              <div className="min-w-0 flex flex-col gap-1.5">
                <div className="w-24 h-4 rounded bg-base-300 animate-pulse" />
                <div className="w-16 h-3 rounded bg-base-300 animate-pulse" />
              </div>
            </div>
          ) : isAuthenticated && user ? (
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
          <IconAction
            ref={closeButtonRef}
            onClick={onClose}
            variant="quiet"
            label={t('nav.close_menu')}
          >
            <X className="size-5" />
          </IconAction>
        </div>

        <div className="divider my-0 px-5"></div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {/* Login CTA for unauthenticated */}
          {!isAuthenticated && !isLoading && (
            <div className="px-2 pb-3">
              <Action
                variant="primary"
                className="w-full"
                onClick={() => handleNavClick('/register')}
              >
                <Action.Label>{t('nav.login_register')}</Action.Label>
              </Action>
            </div>
          )}

          {/* Navigation */}
          <ul className="flex flex-col gap-1 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavigationLink
                  href={item.path}
                  onClick={(e) => { e.preventDefault(); handleNavClick(item.path) }}
                  icon={item.icon}
                  className="mobile-drawer__nav-item text-base"
                >
                  {item.label}
                </NavigationLink>
              </li>
            ))}

            {/* Profile */}
            {isAuthenticated && user && (
              <li>
                <NavigationLink
                  href="/profile"
                  onClick={(e) => { e.preventDefault(); handleNavClick('/profile') }}
                  icon={<UserCircle className="size-5" />}
                  className="mobile-drawer__nav-item text-base"
                >
                  {t('nav.my_profile')}
                </NavigationLink>
              </li>
            )}

            {/* Feedback */}
            <li>
              <Action
                variant="quiet"
                className="mobile-drawer__nav-item text-base"
                onClick={() => setFeedbackOpen(true)}
              >
                <MessageSquareHeart className="size-5" />
                <Action.Label>{t('feedback.button_text')}</Action.Label>
              </Action>
            </li>
          </ul>

          {/* Settings */}
          <div className="divider my-2 px-2"></div>

          <div className="flex flex-col gap-3 px-2">
            <div className="ds-field">
              <label className="ds-field__label ds-type-ui" htmlFor="mobile-drawer-language">
                <span className="ds-field__label-text">{t('common.select_language')}</span>
              </label>
              <SearchableSelect
                id="mobile-drawer-language"
                items={languageOptions}
                value={currentLang}
                onChange={changeLanguage}
                getItemLabel={(language) => language.label}
                ariaLabel={t('common.select_language')}
                searchable={false}
              />
            </div>

            <div className="ds-field">
              <label className="ds-field__label ds-type-ui" htmlFor="mobile-drawer-theme">
                <span className="ds-field__label-text">{t('common.select_theme')}</span>
              </label>
              <SearchableSelect
                id="mobile-drawer-theme"
                items={THEME_OPTIONS}
                value={currentTheme}
                onChange={(theme) => setTheme(resolveThemeName(theme))}
                getItemLabel={(theme) => theme.label}
                ariaLabel={t('common.select_theme')}
                searchable={false}
              />
            </div>
          </div>
        </div>

        {/* Logout - pinned to bottom */}
        {isAuthenticated && (
          <div className="border-t border-base-300 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Action
              variant="quiet"
              onClick={() => { handleLogout().catch(console.error) }}
              className="w-full justify-start gap-3 text-error text-base"
            >
              <LogOut className="size-5" />
              <Action.Label>{t('nav.logout')}</Action.Label>
            </Action>
          </div>
        )}
      </nav>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>,
    document.body
  )
}
