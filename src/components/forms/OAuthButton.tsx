/**
 * OAuth Button Component
 * Reusable button component for OAuth provider logins with theme-aware styling
 */

import type {OAuthProvider} from '../../lib/supabase'
import {providerIcons, providerLabels} from '../../lib/musicUtils'
import {useTranslation} from 'react-i18next'
import {Action} from '../Action'

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
    <Action
      type="button"
      variant="secondary"
      className={fullWidth ? 'w-full' : ''}
      onClick={onClick}
      {...(loading
        ? { state: 'loading' as const, loadingLabel: t('common.loading') }
        : { state: disabled ? 'disabled' as const : 'idle' as const })}
    >
      <Action.Icon>{providerIcons[provider]}</Action.Icon>
      <Action.Label>{t('auth.continue_with', { provider: providerLabels[provider] })}</Action.Label>
    </Action>
  )
}

export default OAuthButton

