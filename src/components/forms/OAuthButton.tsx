/**
 * OAuth Button Component
 * Reusable button component for OAuth provider logins with theme-aware styling
 */

import type {OAuthProvider} from '../../lib/supabase'
import {providerIcons, providerLabels} from '../../lib/musicUtils'
import {useTranslation} from 'react-i18next'

interface OAuthButtonProps {
  provider: OAuthProvider
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}

export function OAuthButton({
  provider,
  onClick,
  disabled = false,
  loading = false,
  fullWidth = true,
}: OAuthButtonProps) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-outline ${fullWidth ? 'w-full' : ''}`}
    >
      {loading ? (
        <>
          <span className="loading loading-spinner loading-sm"></span>
          {t('common.loading')}
        </>
      ) : (
        <>
          {providerIcons[provider]}
          {t('auth.continue_with', { provider: providerLabels[provider] })}
        </>
      )}
    </button>
  )
}

export default OAuthButton

