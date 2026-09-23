import type {User as SupabaseUser} from '@supabase/supabase-js'
import type {AuthUser} from '../../types/auth.types'

export const onboardingKey = (id: string) => `jam_onboarding_complete:${id}`

export function shouldShowOnboarding(profile: AuthUser, identity: SupabaseUser): boolean {
  return Boolean(profile.isNewUser &&
    identity.user_metadata?.jamOnboardingComplete !== true &&
    localStorage.getItem(onboardingKey(identity.id)) !== 'true')
}
