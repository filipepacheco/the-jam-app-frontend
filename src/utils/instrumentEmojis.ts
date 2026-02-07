/**
 * Instrument utilities
 * Provides emojis and display names for instruments
 */

export const instrumentEmojis: Record<string, string> = {
  // Common instruments
    'guitarra': '🎸',
    'guitarras': '🎸',
    'guitar': '🎸',
    'guitars': '🎸',
    'baixo': 'ᵇ🎸',
    'bateria': '🥁',
    'drums': '🥁',
  'drums set': '🥁',
  'drum': '🥁',
  'bass': 'ᵇ🎸',
  'bass guitar': 'ᵇ🎸',
  'keyboards': '⌨️',
  'keyboard': '⌨️',
  'keys': '⌨️',
    'teclado': '🎹',
    'teclados': '🎹',
    'piano': '🎹',
  'vocals': '🎤',
  'vocal': '🎤',
  'vozes': '🎤',
  'voz': '🎤',
  'singer': '🎤',
  'voice': '🎤',
  'violin': '🎻',
  'cello': '🎻',
  'strings': '🎻',
  'trumpet': '🎺',
  'trombone': '🎺',
  'saxophone': '🎷',
  'sax': '🎷',
  'flute': '🎵',
  'harmonica': '🎵',
  'percussion': '🥁',
  'percussions': '🥁',
  'backup vocals': '🎤',
  'backing vocals': '🎤',
  'lead vocals': '🎤',
  'lead': '🎤',
}

/**
 * Get emoji for an instrument name
 * @param instrument - Instrument name
 * @returns Emoji string or default musical note
 */
export function getInstrumentEmoji(instrument: string): string {
  if (!instrument) return '🎵'
  const normalized = instrument.toLowerCase().trim()
  return instrumentEmojis[normalized] || '🎵'
}

