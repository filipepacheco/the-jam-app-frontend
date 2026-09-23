/**
 * Navigation utilities
 * Helper functions for determining post-auth redirect paths
 */

/**
 * Determine redirect destination based on:
 * 1. ?redirect= query param (explicit override)
 * 2. Coming from jam registration flow (?jamId param)
 * 3. Referrer from jam detail page
 * 4. Default to home page
 * @returns The path to redirect to after authentication
 */
export function safeRedirectPath(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  try {
    const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin
    const parsed = new URL(value, origin)
    if (parsed.origin !== origin || parsed.pathname === '/login' || parsed.pathname === '/register' || parsed.pathname === '/auth/callback') return null
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

export function authPath(path: '/login' | '/register', from: {pathname: string; search: string; hash: string}): string {
  const destination = safeRedirectPath(`${from.pathname}${from.search}${from.hash}`)
  return destination ? `${path}?redirect=${encodeURIComponent(destination)}` : path
}

export function getRedirectPath(): string {
  const params = new URLSearchParams(window.location.search)

  // Check for explicit redirect param (validate to prevent open redirects)
  const redirectParam = params.get('redirect')
  const destination = safeRedirectPath(redirectParam)
  if (destination) return destination

  // Check if coming from jam registration flow
  const jamId = params.get('jamId')
  if (jamId) {
    return safeRedirectPath(`/jams/${encodeURIComponent(jamId)}/register`) || '/'
  }

  // Check if we came from a jam detail page
  const referer = document.referrer
  if (referer) {
    try {
      const url = new URL(referer)
      if (url.origin === window.location.origin && url.pathname.startsWith('/jams/')) {
        return `${url.pathname}${url.search}${url.hash}`
      }
    } catch { /* Ignore invalid referrers. */ }
  }

  // Default to home
  return '/'
}
