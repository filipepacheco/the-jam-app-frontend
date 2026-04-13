/**
 * Jam URL Utilities
 * Centralized functions for generating jam-related URLs.
 * All internal links should use these helpers instead of hardcoding paths.
 */

import { SITE_URL } from '../lib/api'

interface JamLike {
  id: string
  slug?: string | null
  shortCode?: string | null
}

/**
 * Get the internal path for a jam detail page.
 * Prefers slug to UUID for SEO-friendly URLs.
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
 * Get the short URL path for QR codes and manual typing.
 * Falls back to /jams/:id if no shortCode.
 */
export function getJamShortPath(jam: JamLike): string {
  if (jam.shortCode) return `/j/${jam.shortCode}`
  return `/jams/${jam.id}`
}

/**
 * Get the full shareable URL for a jam.
 * Uses /:slug directly (shortest readable URL) when available, falls back to /jams/:id.
 */
export function getJamShareUrl(jam: JamLike): string {
  const baseUrl = SITE_URL || window.location.origin
  if (jam.slug) return `${baseUrl}/${jam.slug}`
  return `${baseUrl}/jams/${jam.id}`
}

/**
 * Get the full short URL for a jam (for QR codes).
 */
export function getJamShortUrl(jam: JamLike): string {
  const baseUrl = SITE_URL || window.location.origin
  return `${baseUrl}${getJamShortPath(jam)}`
}
