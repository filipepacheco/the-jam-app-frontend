/**
 * Supabase Configuration
 * Creates and exports Supabase client instance for authentication
 */

import {createClient, type SupabaseClient} from '@supabase/supabase-js'

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  )
}

/**
 * Supabase client instance
 * Configured with auth persistence to localStorage
 * Uses a placeholder URL when env vars are missing (prerendering/SSG)
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // Persist session to localStorage
      persistSession: true,
      // Storage key for the session
      storageKey: 'supabase-auth',
      // Auto refresh token before expiry
      autoRefreshToken: true,
      // Detect session from URL (for OAuth callbacks)
      detectSessionInUrl: true,
    },
  }
)

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

/**
 * Get Supabase URL for debugging
 */
export function getSupabaseUrl(): string {
  return supabaseUrl || ''
}
