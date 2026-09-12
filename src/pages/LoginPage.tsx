/**
 * Login Page
 * Supabase auth with email/password and social OAuth login
 */

import {useEffect, useState} from 'react'
import {useAuth} from '../hooks'
import {useNavigate} from 'react-router-dom'
import {ProfileSetupModal, SupabaseLoginForm} from '../components'
import {NavigationLink} from '../components/Navigation'
import {SEO} from '../components/SEO'
import {useTranslation} from 'react-i18next'
import {getRedirectPath} from '../utils/navigationUtils'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, user, isNewUser } = useAuth()
  const [showProfileSetup, setShowProfileSetup] = useState(false)


  // If user is already authenticated, redirect to appropriate location
  useEffect(() => {
    if (isAuthenticated) {
      // Check if new user without name - show profile setup modal
      if (isNewUser && user?.name === null) {
        setShowProfileSetup(true)
        return // Don't redirect yet, let user complete profile
      }
      // For existing users or users with complete profile, redirect
      navigate(getRedirectPath(), { replace: true })
    }
  }, [isAuthenticated, isNewUser, user?.name, navigate])


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100 px-2 sm:px-4 py-4 sm:py-8">
        {/*
          Documented design-system exception (issue #50): this login skeleton
          stays hand-rolled. The canonical `Skeleton` primitive renders
          uniform full-width lines only, so it cannot reproduce the field
          label plus control pairs, the divider row, or the narrow footer
          link placeholder. Substitution would visibly change the loading
          silhouette. Same reasoning as PageHeaderSkeleton.tsx.
        */}
        <div className="w-full max-w-sm sm:max-w-md animate-pulse">
          {/* Title skeleton */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="skeleton h-8 w-48 mx-auto mb-2 sm:mb-3" />
            <div className="skeleton h-4 w-64 mx-auto" />
          </div>

          {/* Form skeleton */}
          <div className="space-y-4">
            {/* Email field */}
            <div>
              <div className="skeleton h-4 w-20 mb-2" />
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>
            {/* Password field */}
            <div>
              <div className="skeleton h-4 w-20 mb-2" />
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>
            {/* Submit button */}
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>

          {/* Divider skeleton */}
          <div className="flex items-center gap-4 my-6">
            <div className="skeleton h-px flex-1" />
            <div className="skeleton h-4 w-8" />
            <div className="skeleton h-px flex-1" />
          </div>

          {/* OAuth buttons skeleton */}
          <div className="space-y-3">
            <div className="skeleton h-10 w-full rounded-lg" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>

          {/* Footer link skeleton */}
          <div className="mt-6 sm:mt-8 flex justify-center">
            <div className="skeleton h-4 w-32" />
          </div>
        </div>
      </div>
    )
  }

  // If authenticated and not showing profile setup modal, redirect or return null
  if (isAuthenticated && !showProfileSetup) {
    return null
  }

  const handleProfileSetupClose = () => {
    setShowProfileSetup(false)
    // Redirect after profile setup is complete
    navigate(getRedirectPath(), { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 px-2 sm:px-4 py-4 sm:py-8">
      <SEO title={t('auth.login_page_title')} noindex={true} />
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">{t('auth.login_page_title')}</h1>
          <p className="text-xs sm:text-sm lg:text-base text-base-content/70">
            {t('auth.login_page_supabase_desc')}
          </p>
        </div>

        {/* Login Form */}
        <SupabaseLoginForm />

        {/* Footer Links */}
        {/* A quiet navigation destination, so it uses NavigationLink. The
            href stays a real anchor target, which keeps the browser
            fallback for a user who reaches this page without the router. */}
        <div className="mt-6 sm:mt-8 flex justify-center">
          <NavigationLink href="/">
            {t('auth.back_to_home')}
          </NavigationLink>
        </div>
      </div>

      {/* Profile Setup Modal - Show for new users with null name */}
      <ProfileSetupModal
        isOpen={showProfileSetup}
        onClose={handleProfileSetupClose}
      />
    </div>
  )
}


