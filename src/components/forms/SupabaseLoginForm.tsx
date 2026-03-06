/**
 * Supabase Login Form Component
 * Email/password login with social OAuth buttons
 */

import * as React from 'react'
import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useAuth, useFormState} from '../../hooks'
import type {OAuthProvider} from '../../lib/supabase'
import OAuthButton from "./OAuthButton.tsx";
import {useTranslation} from 'react-i18next'
import {Alert} from '../Alert'

interface SupabaseLoginFormProps {
  onSuccess?: () => void
}

export function SupabaseLoginForm({ onSuccess }: SupabaseLoginFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { loginWithEmail, signUpWithEmail, loginWithOAuth, isLoading: authLoading } = useAuth()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const { error, setError, success: message, setSuccess: setMessage, isLoading, setIsLoading } = useFormState({ navigateOnSuccess: false })

  // Get redirect path from URL params (validated to prevent open redirects)
  const getRedirectPath = () => {
    const params = new URLSearchParams(window.location.search)
    const redirectParam = params.get('redirect')
    if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
      return redirectParam
    }
    const jamId = params.get('jamId')
    if (jamId) {
      return `/jams/${jamId}/register`
    }
    return '/'
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsLoading(true)

    try {
      let result: { success: boolean; error?: string; message?: string }

      if (isSignUp) {
        result = await signUpWithEmail(email, password, name || undefined)
      } else {
        result = await loginWithEmail(email, password)
      }

      if (result.success) {
        if (result.message) {
          // Success with info message (e.g., email confirmation required)
          setMessage(result.message)
        } else if (result.error) {
          // Backend sync error during otherwise successful auth
          setError(result.error)
        } else {
          // Fully successful login/signup
          onSuccess?.()
          navigate(getRedirectPath())
        }
      } else {
        // Failed authentication
        setError(result.error || t('auth.auth_failed'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.auth_failed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setError(null)
    setIsLoading(true)

    try {
      // Store redirect path for use after OAuth callback
      const redirectPath = getRedirectPath()
      sessionStorage.setItem('auth_redirect', redirectPath)

      const result = await loginWithOAuth(provider)
      if (!result.success && result.error) {
        setError(result.error)
        setIsLoading(false)
      }
      // If successful, user will be redirected to OAuth provider
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.oauth_failed'))
      setIsLoading(false)
    }
  }


  const isFormLoading = isLoading || authLoading

  return (
      <div className="max-w-sm mx-auto">

      <fieldset className="fieldset border-base-300 rounded-box w-sm border p-4">
        <legend className="fieldset-legend  font-bold">{isSignUp ? t('auth.create_account') : t('auth.sign_in')}</legend>
        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {/* Name field (only for signup) */}
        {isSignUp && (
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t('common.name')}</span>
            </label>
            <input
              type="text"
              placeholder={t('auth.name_placeholder')}
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isFormLoading}
            />
          </div>
        )}

        {/* Email Input */}
        <div >
          <label className="label">
            {t('common.email')}
          </label>
          <input
            type="email"
            placeholder={t('auth.email_placeholder')}
            className="input input-bordered w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isFormLoading}
            required
          />
        </div>

        {/* Password Input */}
          <div>
            <label className='label'>
          {t('common.password')}
            </label>
            <input
                type="password"
                placeholder={t('auth.password_placeholder')}
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isFormLoading}
                required
                minLength={6}
            />
            {isSignUp && (
                <label className="label">
              <span className="label-text-alt text-xs text-base-content/60">
                {t('auth.password_hint')}
              </span>
                </label>
            )}
          </div>

          {/* Error Alert */}
          <Alert type="error" message={error} />

        {/* Info/Success Message */}
          <Alert type="info" message={message} />

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isFormLoading || !email || !password}
        >
          {isFormLoading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              {isSignUp ? t('auth.creating_account') : t('auth.signing_in')}
            </>
          ) : (
            isSignUp ? t('auth.create_account') : t('auth.sign_in')
          )}
        </button>

          <div className="divider ">{t('common.or')}</div>

          {/* OAuth Buttons */}
          <div className="space-y-2">
            <OAuthButton
              provider="google"
              onClick={() => handleOAuthLogin('google')}
              disabled={isFormLoading}
              loading={isFormLoading}
            />
            <OAuthButton
              provider="spotify"
              onClick={() => handleOAuthLogin('spotify')}
              disabled={isFormLoading}
              loading={isFormLoading}
            />
          </div>

        </form>

      {/* Toggle Sign Up / Sign In */}
      <div className="divider "></div>
      <div className="text-center">
        <button
          type="button"
          className="btn btn-accent btn-sm"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
            setMessage(null)
          }}
          disabled={isFormLoading}
        >
          {isSignUp ? t('auth.already_have_account') : t('auth.dont_have_account')}
        </button>
      </div>

      {/* Forgot Password Link */}
      {/*{!isSignUp && (*/}
      {/*  // <div className="text-center ">*/}
      {/*  //   <a href="/forgot-password" className="link link-hover text-sm text-base-content/60">*/}
      {/*  //     Forgot password?*/}
      {/*  //   </a>*/}
      {/*  // </div>*/}
      {/*)}*/}
    </fieldset>

      </div>
  )
}



