/**
 * Instrument Helper Utilities
 * Centralized instrument icon, display name, and grouping utilities for schedule components
 */

import React from 'react'

/**
 * Get the Lucide icon for a given instrument
 * @param instrument - The instrument name (case-insensitive, supports multiple languages)
 * @returns React element with Lucide icon
 */
export function getInstrumentIcon(instrument?: string): React.ReactNode {
  return getInstrumentEmoji(instrument)
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

/**
 * Instrument slot fields present on music DTOs
 */
interface InstrumentSlots {
  neededDrums?: number
  neededGuitars?: number
  neededVocals?: number
  neededBass?: number
  neededKeys?: number
}

export interface InstrumentCount {
  count: number
  key: string
  label: string
}

/**
 * Build the instrument counts array from a music DTO's needed* fields.
 * @param music - Any object with neededDrums/Guitars/Vocals/Bass/Keys
 * @param t - i18next t function for labels
 * @returns Array of { count, key, label } for each instrument slot
 */
export function getInstrumentCounts(music: InstrumentSlots, t: (key: string) => string): InstrumentCount[] {
  return [
    { count: music.neededDrums || 0, key: 'drums', label: t('schedule.instruments.drums') },
    { count: music.neededGuitars || 0, key: 'guitars', label: t('schedule.instruments.guitars') },
    { count: music.neededVocals || 0, key: 'vocals', label: t('schedule.instruments.vocals') },
    { count: music.neededBass || 0, key: 'bass', label: t('schedule.instruments.bass') },
    { count: music.neededKeys || 0, key: 'keys', label: t('schedule.instruments.keys') },
  ]
}

