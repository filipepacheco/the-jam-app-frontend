/**
 * Spotify PKCE Authentication Utilities
 * Implements the Authorization Code with PKCE flow for Spotify Web API
 */

import type { SpotifyPKCEState } from '../../types/spotify.types'

const STORAGE_KEY = 'spotify_pkce_state'
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SCOPES = 'playlist-modify-public playlist-modify-private'

function getClientId(): string {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_SPOTIFY_CLIENT_ID is not configured')
  }
  return clientId
}

function getRedirectUri(): string {
  return `${window.location.origin}/auth/spotify/callback`
}

/**
 * Generate a cryptographically random string of the given length
 */
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values, (v) => possible[v % possible.length]).join('')
}

/**
 * Generate a SHA-256 hash and base64url-encode it
 */
async function sha256Base64url(plain: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Generate a PKCE code verifier and code challenge pair
 */
async function generatePKCEPair(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = generateRandomString(128)
  const codeChallenge = await sha256Base64url(codeVerifier)
  return { codeVerifier, codeChallenge }
}

/**
 * Store PKCE state in sessionStorage
 */
function storePKCEState(state: SpotifyPKCEState): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/**
 * Retrieve stored PKCE state from sessionStorage
 */
export function getStoredPKCEState(): SpotifyPKCEState | null {
  const stored = sessionStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as SpotifyPKCEState
  } catch {
    return null
  }
}

/**
 * Clear PKCE state from sessionStorage
 */
export function clearPKCEState(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

/**
 * Initiate the Spotify PKCE authorization flow
 * Generates PKCE pair, stores state, and redirects to Spotify
 */
export async function initiateSpotifyAuth(jamId: string): Promise<void> {
  const { codeVerifier, codeChallenge } = await generatePKCEPair()
  const state = generateRandomString(16)
  const redirectUri = getRedirectUri()
  const clientId = getClientId()

  storePKCEState({ codeVerifier, state, jamId, redirectUri })

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
  })

  window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for access token using PKCE
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const stored = getStoredPKCEState()
  if (!stored) {
    throw new Error('No PKCE state found')
  }

  const clientId = getClientId()

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: stored.redirectUri,
    client_id: clientId,
    code_verifier: stored.codeVerifier,
  })

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      (errorData as { error_description?: string }).error_description || 'Failed to exchange code for token'
    )
  }

  const data = (await response.json()) as { access_token: string }
  return data.access_token
}
