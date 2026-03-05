import { supabase } from '../supabase'

// Cache the token to avoid calling getSession() on every API request
let cachedToken: string | null = null
let cachedExpiresAt = 0

export async function getAccessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000)

  // Return cached token if still valid (with 60s buffer for proactive refresh)
  if (cachedToken && cachedExpiresAt - now >= 60) {
    return cachedToken
  }

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    cachedToken = null
    cachedExpiresAt = 0
    return null
  }

  const expiresAt = session.expires_at || 0

  // Proactive refresh if expiring soon (within 60 seconds)
  if (expiresAt - now < 60) {
    const { data: { session: newSession } } = await supabase.auth.refreshSession()
    cachedToken = newSession?.access_token || null
    cachedExpiresAt = newSession?.expires_at || 0
    return cachedToken
  }

  cachedToken = session.access_token
  cachedExpiresAt = expiresAt
  return cachedToken
}

export async function refreshAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.refreshSession()
  cachedToken = session?.access_token || null
  cachedExpiresAt = session?.expires_at || 0
  return cachedToken
}

export function clearTokenCache(): void {
  cachedToken = null
  cachedExpiresAt = 0
}
