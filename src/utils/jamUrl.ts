/**
 * Jam URL Utilities
 * Centralized functions for generating jam-related URLs.
 * All internal links should use these helpers instead of hardcoding paths.
 */

interface JamLike {
  id: string
  slug?: string | null
  shortCode?: string | null
}

/**
 * Get the internal path for a jam detail page.
 * Prefers slug over UUID for SEO-friendly URLs.
 */
export function getJamPath(jam: JamLike): string {
  return `/jams/${jam.slug || jam.id}`
}

/**
 * Get the internal path for the jam dashboard.
 */
export function getJamDashboardPath(jam: JamLike): string {
  return `/jams/${jam.slug || jam.id}/dashboard`
}

/**
 * Get the internal path for jam registration.
 */
export function getJamRegisterPath(jam: JamLike): string {
  return `/jams/${jam.slug || jam.id}/register`
}

/**
 * Get the short URL path for QR codes and manual typing.
 * Falls back to /jams/:id if no shortCode.
 */
export function getJamShortPath(jam: JamLike): string {
  if (jam.shortCode) return `/j/${jam.shortCode}`
  return `/jams/${jam.id}`
}

/**
 * Get the full shareable URL for a jam.
 */
export function getJamShareUrl(jam: JamLike): string {
  const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin
  return `${baseUrl}${getJamPath(jam)}`
}

/**
 * Get the full short URL for a jam (for QR codes).
 */
export function getJamShortUrl(jam: JamLike): string {
  const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin
  return `${baseUrl}${getJamShortPath(jam)}`
}
