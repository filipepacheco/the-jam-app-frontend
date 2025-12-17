/**
 * Formatter Utilities
 * Common formatting functions for the application
 */

/**
 * Format seconds to MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "3:45")
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

