/**
 * Share Utilities
 * Functions for sharing jam links via various platforms
 */

import {getJamShareUrl as getJamShareUrlFromJam} from './jamUrl'
import {SITE_URL} from '../lib/api/config'

/**
 * Get the shareable URL for a jam
 * @deprecated Use getJamShareUrl from jamUrl.ts with a jam object instead
 */
export function getJamShareUrl(jamId: string): string {
  const baseUrl = SITE_URL || window.location.origin
  return `${baseUrl}/jams/${jamId}`
}

/**
 * Get the shareable URL for a jam object (prefers slug)
 */
export { getJamShareUrlFromJam }

/**
 * Copy text to clipboard
 * @returns true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    return success
  } catch {
    return false
  }
}

/**
 * Share via WhatsApp
 * Opens WhatsApp with pre-filled message
 */
export function shareViaWhatsApp(url: string, message?: string): void {
  const text = message ? `${message} ${url}` : url
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
}

/**
 * Check if native share API is available
 */
export function canUseNativeShare(): boolean {
  return typeof navigator.share === 'function'
}

/**
 * Share using the native share sheet (mobile)
 * @returns true if share was initiated, false if not supported or failed
 */
export async function nativeShare(title: string, url: string, text?: string): Promise<boolean> {
  if (!canUseNativeShare()) {
    return false
  }
  try {
    await navigator.share({
      title,
      url,
      text,
    })
    return true
  } catch (error) {
    // User cancelled or share failed
    return error instanceof Error && error.name === 'AbortError';

  }
}
