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
export function getRedirectPath(): string {
  const params = new URLSearchParams(window.location.search)

  // Check for explicit redirect param
  const redirectParam = params.get('redirect')
  if (redirectParam) {
    return redirectParam
  }

  // Check if coming from jam registration flow
  const jamId = params.get('jamId')
  if (jamId) {
    return `/jams/${jamId}/register`
  }

  // Check if we came from a jam detail page
  const referer = document.referrer
  if (referer.includes('/jams/')) {
    const match = referer.match(/\/jams\/([^/]+)/)
    if (match) {
      return `/jams/${match[1]}`
    }
  }

  // Default to home
  return '/'
}
