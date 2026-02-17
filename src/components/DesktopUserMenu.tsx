import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, UserCircle, LogOut, Globe, Palette } from 'lucide-react'
import { useAuth } from '../hooks'
import { LANGUAGES, THEMES } from '../lib/uiConstants'

interface DesktopUserMenuProps {
  className?: string
}

export function DesktopUserMenu({ className = '' }: DesktopUserMenuProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout, isLoading } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const currentLang = (i18n.language || i18n.resolvedLanguage || 'pt').split('-')[0]
  const currentTheme = (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) || 'dark'

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
      <a href="/register" className={`btn btn-ghost btn-sm ${className}`}>
        {t('nav.login')}
      </a>
    )
  }

  const displayName = user.name || t('auth.complete_profile')
  const firstName = displayName.split(' ')[0]

  return (
    <div className={`dropdown dropdown-end ${className}`}>
      <button
        tabIndex={0}
        className="btn btn-ghost gap-1"
      >
        <div className="w-7 h-7 rounded-full bg-primary text-primary-content flex items-center justify-center">
          <span className="text-xs font-bold leading-none">{firstName.charAt(0).toUpperCase()}</span>
        </div>
        <span className="max-w-[120px] truncate" title={displayName}>{firstName}</span>
        <ChevronDown className="size-4" aria-hidden="true" />
        <span className="sr-only">, {t('nav.user_menu')}</span>
      </button>
      <div
        tabIndex={0}
        className="dropdown-content z-50 shadow-lg bg-base-100 rounded-box w-64 border border-base-300"
      >
        {/* User header */}
        <div className="px-4 py-3 border-b border-base-300">
          <p className="text-sm font-semibold text-base-content truncate">{displayName}</p>
          <p className="text-xs text-base-content/50">{user.isHost ? t('roles.host') : t('roles.user')}</p>
        </div>

        {/* Menu items */}
        <div className="p-2">
          <a
            href="/profile"
            onClick={(e) => {
              e.preventDefault()
              closeDropdown()
              navigate('/profile')
            }}
            className="btn btn-ghost btn-sm btn-block justify-start gap-2"
          >
            <UserCircle className="size-4" />
            {t('nav.my_profile')}
          </a>
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
                <option key={lang.code} value={lang.code}>{lang.label}</option>
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
          <button
            type="button"
            onClick={() => {
              closeDropdown()
              handleLogout().catch(console.error)
            }}
            className={`btn btn-ghost btn-sm btn-block justify-start gap-2 text-error ${isLoggingOut ? 'opacity-50 pointer-events-none' : ''}`}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {t('auth.logging_out')}
              </>
            ) : (
              <>
                <LogOut className="size-4" />
                {t('nav.logout')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
