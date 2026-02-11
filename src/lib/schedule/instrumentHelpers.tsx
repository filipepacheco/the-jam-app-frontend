/**
 * Instrument Helper Utilities
 * Centralized instrument icon, display name, and grouping utilities for schedule components
 */

import React from 'react'
import {Music} from 'lucide-react'

// Emoji font stack to ensure consistent emoji rendering across platforms
const emojiStyle: React.CSSProperties = {
  fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif',
}

/**
 * Get the emoji icon for a given instrument
 * @param instrument - The instrument name (case-insensitive, supports multiple languages)
 * @returns React element with emoji or Lucide Music icon for unknown instruments
 */
export function getInstrumentIcon(instrument?: string): React.ReactNode {
  if (!instrument) return <Music className="w-4 h-4" />

  const emoji = getInstrumentEmoji(instrument)
  if (emoji === '🎵') return <Music className="w-4 h-4" />

  // Special rendering for bass (subscript B marker)
  const lower = instrument.toLowerCase().trim()
  if (lower === 'bass' || lower === 'bass guitar' || lower === 'baixo' || lower === 'bajo') {
    return <span style={emojiStyle} className="inline-flex items-baseline">🎸<sub className="text-[0.6em] font-bold">B</sub></span>
  }

  return <span style={emojiStyle}>{emoji}</span>
}

/**
 * Get a plain emoji string for a given instrument
 * @param instrument - The instrument name (case-insensitive, supports multiple languages)
 * @returns Plain emoji string (no React wrapper)
 */
/**
 * Map of instrument names to emojis (case-insensitive lookup)
 */
const instrumentEmojiMap: Record<string, string> = {
  // Drums
  'drums': '🥁',
  'drum': '🥁',
  'drums set': '🥁',
  'bateria': '🥁',
  'batería': '🥁',
  'percussion': '🥁',
  'percussions': '🥁',
  // Guitar
  'guitar': '🎸',
  'guitars': '🎸',
  'guitarra': '🎸',
  'guitarras': '🎸',
  // Bass
  'bass': 'ᵇ🎸',
  'bass guitar': 'ᵇ🎸',
  'baixo': 'ᵇ🎸',
  'bajo': 'ᵇ🎸',
  // Vocals
  'vocals': '🎤',
  'vocal': '🎤',
  'vozes': '🎤',
  'voz': '🎤',
  'voces': '🎤',
  'singer': '🎤',
  'voice': '🎤',
  'lead vocals': '🎤',
  'lead': '🎤',
  'backup vocals': '🎤',
  'backing vocals': '🎤',
  // Keys / Piano
  'keys': '🎹',
  'keyboard': '🎹',
  'keyboards': '🎹',
  'teclado': '🎹',
  'teclados': '🎹',
  'piano': '🎹',
  // Strings
  'violin': '🎻',
  'cello': '🎻',
  'strings': '🎻',
  // Brass / Woodwind
  'trumpet': '🎺',
  'trombone': '🎺',
  'saxophone': '🎷',
  'sax': '🎷',
  'flute': '🎵',
  'harmonica': '🎵',
}

/**
 * Get a plain emoji string for a given instrument
 * @param instrument - The instrument name (case-insensitive, supports multiple languages)
 * @returns Plain emoji string (no React wrapper)
 */
export function getInstrumentEmoji(instrument?: string): string {
  if (!instrument) return '🎵'
  const lower = instrument.toLowerCase().trim()
  return instrumentEmojiMap[lower] || '🎵'
}

