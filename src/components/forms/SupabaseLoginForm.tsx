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
import {Action, Field} from '../index'
import type {AuthActionResult} from '../../types/auth.types'
import {getRedirectPath} from '../../utils/navigationUtils'

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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    const destination = getRedirectPath()
    setError(null)
    setMessage(null)
    setIsLoading(true)

    try {
      let result: AuthActionResult

      if (isSignUp) {
        result = await signUpWithEmail(email, password, name || undefined)
      } else {
        result = await loginWithEmail(email, password)
      }

      if (result.success) {
        if (result.message || result.messageKey) {
          // Success with info message (e.g., email confirmation required)
          const confirmationMessage = result.messageKey ? t(result.messageKey) : result.message
          if (confirmationMessage) setMessage(confirmationMessage)
        } else if (result.error) {
          // Backend sync error during otherwise successful auth
          setError(result.error)
        } else {
          // Fully successful login/signup
          onSuccess?.()
          void navigate(destination, {replace: true})
        }
      } else {
        // Failed authentication
        setError(result.errorKey ? t(result.errorKey) : (result.error || t('auth.auth_failed')))
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
      if (!result.success) {
        sessionStorage.removeItem('auth_redirect')
        setError(result.errorKey ? t(result.errorKey) : (result.error || t('auth.oauth_failed')))
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
          <Field id="login-name" label={t('common.name')} disabled={isFormLoading}>
            <Field.Input
              type="text"
              placeholder={t('auth.name_placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        )}

        {/* Email Input */}
        <Field id="login-email" label={t('common.email')} required requiredLabel={t('common.required')} disabled={isFormLoading}>
          <Field.Input
            type="email"
            placeholder={t('auth.email_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        {/* Password Input */}
        <Field
          id="login-password"
          label={t('common.password')}
          required
          requiredLabel={t('common.required')}
          disabled={isFormLoading}
          hint={isSignUp ? t('auth.password_hint') : undefined}
        >
          <Field.Input
            type="password"
            placeholder={t('auth.password_placeholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
          />
        </Field>

          {/* Error Alert */}
          <Alert type="error" message={error} />

        {/* Info/Success Message */}
          <Alert type="info" message={message} />

        {/* Submit Button */}
        <Action
          type="submit"
          variant="primary"
          className="w-full"
          {...(isFormLoading
            ? { state: 'loading' as const, loadingLabel: isSignUp ? t('auth.creating_account') : t('auth.signing_in') }
            : { state: (!email || !password) ? 'disabled' as const : 'idle' as const })}
        >
          <Action.Label>{isSignUp ? t('auth.create_account') : t('auth.sign_in')}</Action.Label>
        </Action>

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
        <Action
          type="button"
          variant="secondary"
          state={isFormLoading ? 'disabled' : 'idle'}
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
            setMessage(null)
          }}
        >
          <Action.Label>{isSignUp ? t('auth.already_have_account') : t('auth.dont_have_account')}</Action.Label>
        </Action>
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
