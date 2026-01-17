import { supabase } from '../supabase'

export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return null

  // Proactive refresh if expiring soon (within 60 seconds)
  const expiresAt = session.expires_at || 0
  const now = Math.floor(Date.now() / 1000)

  if (expiresAt - now < 60) {
    const { data: { session: newSession } } = await supabase.auth.refreshSession()
    return newSession?.access_token || null
  }

  return session.access_token
}

export async function refreshAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.refreshSession()
  return session?.access_token || null
}
