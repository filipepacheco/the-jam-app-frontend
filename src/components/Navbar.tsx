/**
 * Navbar Component
 * Role-aware navigation component that displays different menu items based on user role
 */

import { useAuth } from '../hooks'
import { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FeedbackButton } from './FeedbackButton'
import { useTranslation } from 'react-i18next'
import { DesktopUserMenu } from './DesktopUserMenu'
import { MobileDrawer } from './MobileDrawer'
import { Home, Search, Users, Music, LayoutDashboard } from 'lucide-react'

function NavLink({ href, icon, label, isActive, onClick }: {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <li>
      <a
        href={href}
        onClick={onClick}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
        }`}
      >
        {icon}
        {label}
      </a>
    </li>
  )
}

function Navbar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, user, isViewer, isLoading } = useAuth()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const handleNavClick = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    navigate(path)
  }

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
      <div className="navbar-center hidden xl:flex">
        <ul className="flex items-center gap-1">
          <NavLink href="/" icon={<Home className="size-4" />} label={t('nav.home')} isActive={isActive('/')} onClick={handleNavClick('/')} />
          <NavLink href="/jams" icon={<Search className="size-4" />} label={t('nav.jams')} isActive={isActive('/jams')} onClick={handleNavClick('/jams')} />
          {isAuthenticated && user?.isHost && (
            <NavLink href="/musicians" icon={<Users className="size-4" />} label={t('nav.musicians')} isActive={isActive('/musicians')} onClick={handleNavClick('/musicians')} />
          )}
          {isAuthenticated && !isViewer() && (
            <NavLink href="/music" icon={<Music className="size-4" />} label={t('nav.music')} isActive={isActive('/music')} onClick={handleNavClick('/music')} />
          )}
          {isAuthenticated && user?.isHost && (
            <NavLink href="/host/dashboard" icon={<LayoutDashboard className="size-4" />} label={t('nav.host_dashboard')} isActive={isActive('/host/dashboard')} onClick={handleNavClick('/host/dashboard')} />
          )}
        </ul>
      </div>

      {/* Navbar End - Actions */}
      <div className="navbar-end gap-1 sm:gap-2 md:gap-3 flex-wrap md:flex-nowrap justify-end">
        {/* Feedback Button - Desktop only */}
        <FeedbackButton className="hidden xl:flex" />

        {/* Desktop User Menu */}
        <DesktopUserMenu className="hidden xl:inline-flex" />

        {/* Create Jam Button - Host Only */}
        {isAuthenticated && user?.isHost && (
          <a href="/host/create-jam" className="btn btn-primary btn-sm whitespace-nowrap">
            {t('nav.create_jam')}
          </a>
        )}

        {/* Register Button - Viewer/Anonymous Only */}
        {!isLoading && isViewer() && !isAuthenticated && (
          <a href="/register" className="btn btn-primary btn-sm whitespace-nowrap">
            {t('nav.join')}
          </a>
        )}

        {/* Mobile Hamburger */}
        <button
          ref={hamburgerRef}
          className="btn btn-ghost xl:hidden"
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
