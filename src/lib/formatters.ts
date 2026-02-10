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
export function formatDuration(value: number | undefined | null, unit: 'seconds' | 'ms' = 'seconds'): string {
  if (!value || value < 0) return '0:00'
  const totalSeconds = unit === 'ms' ? Math.floor(value / 1000) : value
  const minutes = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
