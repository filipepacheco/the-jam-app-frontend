/**
 * Formatter Utilities
 * Common formatting functions for the application
 */

/**
 * Format a duration value to MM:SS format
 * @param value - Duration value
 * @param unit - Unit of the value: 'seconds' (default) or 'ms' for milliseconds
 * @returns Formatted string (e.g., "3:45")
 */
/**
 * Format a total duration in seconds to a human-readable string.
 * Shows hours and minutes when >= 60 minutes (e.g. "2h 53m"), otherwise just minutes (e.g. "45m").
 */
export function formatJamDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export function formatDuration(value: number | undefined | null, unit: 'seconds' | 'ms' = 'seconds'): string {
  if (!value || value < 0) return '0:00'
  const totalSeconds = unit === 'ms' ? Math.floor(value / 1000) : value
  const minutes = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
