/**
 * Navbar Component
 * Role-aware navigation component that displays different menu items based on user role
 */

import { useAuth } from '../hooks'
import React, { useState, useRef, memo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FeedbackButton } from './FeedbackButton'
import { useTranslation } from 'react-i18next'
import { DesktopUserMenu } from './DesktopUserMenu'
import { MobileDrawer } from './MobileDrawer'
import { NavigationAction, NavigationLink } from './Navigation'
import { Home, Search, Users, Music, LayoutDashboard } from 'lucide-react'

const NavLink = memo(function NavLink({ href, icon, label, isActive, onClick }: {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <li>
      <NavigationLink
        href={href}
        onClick={onClick}
        current={isActive}
        icon={icon}
        className={isActive ? 'text-primary' : ''}
      >
        {label}
      </NavigationLink>
    </li>
  )
})

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
    void navigate(path)
  }

  return (
    <nav aria-label={t('nav.main_navigation')} className="bg-base-100 shadow-lg">
      <div className="navbar mx-auto w-full max-w-7xl px-2 py-2 sm:px-4 sm:py-3 lg:px-6 xl:px-8 gap-1 sm:gap-2 md:gap-3">
      {/* Navbar Start - Logo. Stays a plain anchor: it is a brand mark, not
          a product action or a NavigationLink destination in the tab set
          above, and its enlarged logo-plus-wordmark styling does not match
          either Action or NavigationLink's control sizing. */}
      <div className="navbar-start">
        <a href="/" className="btn btn-ghost text-base sm:text-lg md:text-xl">
          <img
            src="/web/icons8-concert-color-96.png"
            alt="App logo"
            width={32}
            height={32}
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
      <div className="navbar-end shrink-0 justify-end gap-1 sm:gap-2 md:gap-3">
        {isLoading ? (
          /* Skeleton placeholders while auth state loads. The canonical
             Skeleton (FeedbackStates.tsx) always renders full-width text
             lines; it does not model this pill-plus-avatar shape, so
             reproducing it here would change the loading silhouette. Kept
             hand-rolled and documented as an exception. */
          <div className="hidden xl:flex items-center gap-2 animate-pulse">
            <div className="skeleton h-6 w-20 rounded" />
            <div className="skeleton h-8 w-8 rounded-full" />
          </div>
        ) : (
          <>
            {/* Feedback Button - Desktop only */}
            <div className="hidden xl:block">
              <FeedbackButton />
            </div>

            {/* Desktop User Menu */}
            <div className="hidden xl:block">
              <DesktopUserMenu />
            </div>

            {/* Register Button - Viewer/Anonymous Only. Stays a real anchor
                (not Action, which only renders a <button>) so the link
                keeps true href navigation semantics (open in new tab,
                right-click, no client-side preventDefault); its filled
                primary-button look is also outside NavigationLink's pill
                style, which is tuned for the tab set above, not a CTA. */}
            {isViewer() && !isAuthenticated && (
              <div className="hidden sm:block">
                <a href="/register" className="btn btn-primary min-h-[44px] whitespace-nowrap">
                  {t('nav.join')}
                </a>
              </div>
            )}
          </>
        )}

        {/* Mobile Hamburger */}
        <div className="xl:hidden">
          <NavigationAction
            ref={hamburgerRef}
            variant="quiet"
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
          </NavigationAction>
        </div>
      </div>

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
