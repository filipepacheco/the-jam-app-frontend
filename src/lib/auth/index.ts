/**
 * Authentication Utilities Index
 * Central export point for authentication utilities
 */

export { getAccessToken, refreshAccessToken } from './tokenManager'

// Dummy function for backward compatibility
export function clearAuth(): void {
  // Auth state is now managed by Supabase and AuthContext
}

// Re-export role utilities
export * from './roleUtils'

