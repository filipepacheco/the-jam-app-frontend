/**
 * Supabase Module Index
 * Exports all Supabase-related functionality
 */

export { supabase, isSupabaseConfigured, getSupabaseUrl } from './config'

export {
  signUpWithEmail,
  signInWithEmail,
  signInWithOAuth,
  signOut,
  getCurrentSession,
  getCurrentUser,
  getAccessToken,
  resetPassword,
  updatePassword,
  onAuthStateChange,
  exchangeCodeForSession,
  type OAuthProvider,
  type SupabaseAuthResult,
} from './authService'

