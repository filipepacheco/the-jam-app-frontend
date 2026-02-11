import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '../hooks'
import ThemeSwitcher from './ThemeSwitcher'
import LanguageSwitcher from './LanguageSwitcher'

interface DesktopUserMenuProps {
  className?: string
}

export function DesktopUserMenu({ className = '' }: DesktopUserMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
        <span className="max-w-[120px] truncate" title={displayName}>{firstName}</span>
        <ChevronDown className="size-4" aria-hidden="true" />
        <span className="sr-only">, {t('nav.user_menu')}</span>
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-60"
      >
        <li>
          <a
            href="/profile"
            onClick={(e) => {
              e.preventDefault()
              closeDropdown()
              navigate('/profile')
            }}
          >
            {t('nav.my_profile')}
          </a>
        </li>

        <li role="separator" className="border-t border-base-300 my-1"></li>

        <li className="w-full">
          <label className="flex items-center gap-2 w-full">
            <span className="text-sm" aria-hidden="true">🌐</span>
            <LanguageSwitcher className="flex-1" />
          </label>
        </li>
        <li className="w-full">
          <label className="flex items-center gap-2 w-full">
            <ThemeSwitcher className="flex-1" />
          </label>
        </li>

        <li role="separator" className="border-t border-base-300 my-1"></li>

        <li>
          <button
            type="button"
            onClick={() => {
              closeDropdown()
              handleLogout().catch(console.error)
            }}
            className={`text-error ${isLoggingOut ? 'opacity-50 pointer-events-none' : ''}`}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {t('auth.logging_out')}
              </>
            ) : (
              t('nav.logout')
            )}
          </button>
        </li>
      </ul>
    </div>
  )
}
