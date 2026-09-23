import type {User as SupabaseUser} from '@supabase/supabase-js'
import type {AuthUser} from '../../types/auth.types'

export function resolveProfileName(profile: AuthUser, identity: SupabaseUser): string | null {
  const currentName = profile.name?.trim() || null
  const metadata = identity.user_metadata
  const providerName = [metadata?.full_name, metadata?.name]
    .find((value): value is string => typeof value === 'string' && Boolean(value.trim()))?.trim()

  if (!providerName) return currentName
  if (!currentName) return providerName

  // First-login placeholders were derived from the email. Once onboarding is
  // complete, the saved profile name belongs to the musician, even if it
  // happens to match the email prefix.
  if (profile.isNewUser !== true || profile.registrationComplete === true || metadata?.jamOnboardingComplete === true) {
    return currentName
  }

  const email = (profile.email || identity.email || '').trim().toLowerCase()
  const localPart = email.split('@')[0]
  const normalizedName = currentName.toLowerCase()
  return normalizedName === email || normalizedName === localPart ? providerName : currentName
}
