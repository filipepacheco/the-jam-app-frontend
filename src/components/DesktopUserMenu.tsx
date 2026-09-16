import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, UserCircle, LogOut, Globe, Palette } from 'lucide-react'
import { useAppLanguage, useAuth, useTheme } from '../hooks'
import { LANGUAGES, THEMES } from '../lib/uiConstants'
import { Action } from './Action'

// The language and theme selects below stay native <select> elements
// instead of Field + Field.Select. Field always renders a visible label
// above the control (see docs/design-system/form-fields.md), but these
// rows use a leading icon plus an aria-label instead of a visible label to
// stay compact. Adding a visible label would grow this menu, which is a
// visual redesign this ticket does not authorize.

interface DesktopUserMenuProps {
  className?: string
}

export function DesktopUserMenu({ className = '' }: DesktopUserMenuProps) {
  const { t } = useTranslation()
  const {currentLang, changeLanguage} = useAppLanguage()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout, isLoading } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [currentTheme, setTheme] = useTheme()


  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const closeDropdown = () => {
    const el = document.activeElement as HTMLElement | null
    el?.blur()
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-7 h-7 rounded-full bg-base-300 animate-pulse" />
        <div className="w-16 h-4 rounded bg-base-300 animate-pulse" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className={`dropdown dropdown-end ${className}`}>
        <Action
          variant="quiet"
          tabIndex={0}
          className="gap-1"
          aria-label={t('nav.settings')}
        >
          <Globe className="size-4" />
          <ChevronDown className="size-4" aria-hidden="true" />
        </Action>
        <div
          tabIndex={0}
          className="dropdown-content z-50 shadow-lg bg-base-100 rounded-box w-64 border border-base-300"
        >
          {/* Settings */}
          <div className="px-4 py-3 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-base-content/50 shrink-0" />
              <select
                onChange={(e) => changeLanguage(e.target.value)}
                value={currentLang}
                className="select select-bordered select-sm flex-1"
                aria-label={t('common.select_language')}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>{t(lang.nameKey)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Palette className="size-4 text-base-content/50 shrink-0" />
              <select
                onChange={(e) => setTheme(e.target.value)}
                value={currentTheme}
                className="select select-bordered select-sm flex-1"
                aria-label={t('common.select_theme')}
              >
                {THEMES.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Login. This stays a real anchor (not Action, which only renders a
              <button>) so right-click and middle-click "open in new tab" keep
              working, matching its previous behavior. */}
          <div className="border-t border-base-300 p-2">
            <a
              href="/login"
              className="ds-menu__item"
            >
              {t('nav.login')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  const displayName = user.name || t('auth.complete_profile')
  const firstName = displayName.split(' ')[0]

  return (
    <div className={`dropdown dropdown-end ${className}`}>
      <Action
        variant="quiet"
        tabIndex={0}
        className="gap-1"
      >
        <div className="w-7 h-7 rounded-full bg-primary text-primary-content flex items-center justify-center">
          <span className="text-xs font-bold leading-none">{firstName.charAt(0).toUpperCase()}</span>
        </div>
        <span className="max-w-[120px] truncate" title={displayName}>{firstName}</span>
        <ChevronDown className="size-4" aria-hidden="true" />
        <span className="sr-only">, {t('nav.user_menu')}</span>
      </Action>
      <div
        tabIndex={0}
        className="dropdown-content z-50 shadow-lg bg-base-100 rounded-box w-64 border border-base-300"
      >
        {/* User header */}
        <div className="px-4 py-3 border-b border-base-300">
          <p className="text-sm font-semibold text-base-content truncate">{displayName}</p>
          <p className="text-xs text-base-content/50">{user.isHost ? t('roles.host') : t('roles.user')}</p>
        </div>

        {/* Menu items. This item already navigates through the router
            (preventDefault + navigate), so it moves onto Action without any
            behavior change; it never relied on real-anchor semantics. */}
        <div className="p-2">
          <Action
            variant="quiet"
            className="w-full justify-start gap-2"
            onClick={() => {
              closeDropdown()
              navigate('/profile')
            }}
          >
            <UserCircle className="size-4" />
            <Action.Label>{t('nav.my_profile')}</Action.Label>
          </Action>
        </div>

        {/* Settings */}
        <div className="border-t border-base-300 px-4 py-3 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-base-content/50 shrink-0" />
            <select
              onChange={(e) => changeLanguage(e.target.value)}
              value={currentLang}
              className="select select-bordered select-sm flex-1"
              aria-label={t('common.select_language')}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{t(lang.nameKey)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Palette className="size-4 text-base-content/50 shrink-0" />
            <select
              onChange={(e) => setTheme(e.target.value)}
              value={currentTheme}
              className="select select-bordered select-sm flex-1"
              aria-label={t('common.select_theme')}
            >
              {THEMES.map((theme) => (
                <option key={theme} value={theme}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-base-300 p-2">
          {isLoggingOut ? (
            <Action
              variant="quiet"
              state="loading"
              loadingLabel={t('auth.logging_out')}
              className="w-full justify-start gap-2 text-error"
            >
              <Action.Label>{t('auth.logging_out')}</Action.Label>
            </Action>
          ) : (
            <Action
              variant="quiet"
              className="w-full justify-start gap-2 text-error"
              onClick={() => {
                closeDropdown()
                handleLogout().catch(console.error)
              }}
            >
              <LogOut className="size-4" />
              <Action.Label>{t('nav.logout')}</Action.Label>
            </Action>
          )}
        </div>
      </div>
    </div>
  )
}
