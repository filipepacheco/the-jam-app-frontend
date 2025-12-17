/**
 * Navbar Component
 * Role-aware navigation component that displays different menu items based on user role
 */

import {useAuth} from '../hooks'
import {getRoleLabel} from '../lib/auth'
import {useNavigate} from 'react-router-dom'
import {useState} from 'react'
import ThemeSwitcher from './ThemeSwitcher'
import {ConnectionStatus} from "./ConnectionStatus.tsx";

function Navbar() {
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
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-48 sm:w-52 p-2 shadow text-xs sm:text-sm">
            {/* Mobile Menu Items */}
            <li><a href="/">Home</a></li>
            <li><a href="/jams">Browse Jams</a></li>
            {user?.isHost && (
              <li><a href="/musicians">Musicians</a></li>
            )}
            {!isViewer() && (
              <li><a href="/music">Music Library</a></li>
            )}
            {user?.isHost && (
              <>
                <li><a href="/host/dashboard">Host Dashboard</a></li>
                <li><a href="/host/create-jam">Create Jam</a></li>
              </>
            )}
          </ul>
        </div>
        <a href="/" className="btn btn-ghost text-base sm:text-lg md:text-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          Let's Jam
        </a>
      </div>

      {/* Navbar Center - Desktop Menu */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><a href="/">Home</a></li>
          <li><a href="/jams">Jams</a></li>
          {user?.isHost && (
            <li><a href="/musicians">Musicians</a></li>
          )}
          {!isViewer() && (
            <li><a href="/music">Music</a></li>
          )}
          {user?.isHost && (
            <li><a href="/host/dashboard">Host Dashboard</a></li>
          )}
        </ul>
      </div>

      {/* Navbar End - Auth Actions */}
      <div className="navbar-end gap-1 sm:gap-2 md:gap-3 flex-wrap md:flex-nowrap justify-end">
        {/* Connection Status */}
        <ConnectionStatus />
        {/* Theme Switcher */}
        <ThemeSwitcher />
        {/* Role Badge */}
        <div className="badge badge-outline hidden sm:inline-flex text-xs sm:text-sm">
          {getRoleLabel(role)}
        </div>

        {/* Auth Dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar placeholder w-8 sm:w-10">
            <div className="bg-primary text-primary-content rounded-full w-8 sm:w-10 flex items-center justify-center text-xs sm:text-sm">
              {isAuthenticated && user ? (user.name || 'U').charAt(0).toUpperCase() : 'G'}
            </div>
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-1 menu p-2 shadow bg-base-100 rounded-box w-48 sm:w-52 text-xs sm:text-sm">
            {isAuthenticated && user && (
              <>
                <li className="menu-title">
                  <span className="text-xs sm:text-sm">{user.name || 'Complete your profile'}</span>
                </li>
                <li><a href="/profile">My Profile</a></li>
                {user?.isHost && (
                  <>
                    <li><a href="/host/dashboard">Dashboard</a></li>
                    <li><a href="/host/create-jam">Create Jam</a></li>
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
                        Logging out...
                      </>
                    ) : (
                      'Logout'
                    )}
                  </a>
                </li>
              </>
            )}
            {!isAuthenticated && (
              <>
                <li className="disabled"><p>Hi, Guest user!</p></li>
                <li><a href="/register">Login/Register</a></li>
              </>
            )}
          </ul>
        </div>

        {/* Create Jam Button - Host Only */}
        {user?.isHost && (
          <a href="/host/create-jam" className="btn btn-primary btn-xs sm:btn-sm whitespace-nowrap">
            Create Jam
          </a>
        )}

        {/* Register Button - Viewer/Anonymous Only */}
        {isViewer() && !isAuthenticated && (
          <a href="/register" className="btn btn-primary btn-xs sm:btn-sm whitespace-nowrap">
            Join
          </a>
        )}
      </div>
    </div>
  )
}

export default Navbar
