/**
 * Jam URL Utilities
 * Centralized functions for generating jam-related URLs.
 * All internal links should use these helpers instead of hardcoding paths.
 *
 * The path builders live in site.config.ts so the Edge middleware and the Node
 * build scripts share one definition with the browser bundle; they are
 * re-exported here so app code can keep importing from `utils/jamUrl`.
 * The full-URL helpers below stay client-only: they read SITE_URL from
 * `import.meta.env`, which is Vite-specific and unavailable in those runtimes.
 */

import { SITE_URL } from '../lib/api'
import { getJamPath, getJamShortPath, type JamLike } from '../../site.config'

export { getJamPath, getJamDashboardPath, getJamShortPath } from '../../site.config'
export type { JamLike } from '../../site.config'

/**
 * Get the full shareable URL for a jam.
 * Uses /:slug directly (shortest readable URL) when available, falls back to /jams/:id.
 */
export function getJamShareUrl(jam: JamLike): string {
  const baseUrl = SITE_URL || window.location.origin
  if (jam.slug) return `${baseUrl}/${jam.slug}`
  return `${baseUrl}${getJamPath(jam)}`
}

/**
 * Get the full short URL for a jam (for QR codes).
 */
export function getJamShortUrl(jam: JamLike): string {
  const baseUrl = SITE_URL || window.location.origin
  return `${baseUrl}${getJamShortPath(jam)}`
}
