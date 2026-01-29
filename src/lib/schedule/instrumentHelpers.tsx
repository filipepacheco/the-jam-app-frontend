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

  const lower = instrument.toLowerCase()
  switch (lower) {
    // Drums - EN: Drums, PT: Bateria, ES: Batería
    case 'drums':
    case 'bateria':
    case 'batería':
      return <span style={emojiStyle}>🥁</span>
    // Guitar - EN: Guitars, PT: Guitarras, ES: Guitarras
    case 'guitar':
    case 'guitars':
    case 'guitarra':
    case 'guitarras':
      return <span style={emojiStyle}>🎸</span>
    // Bass - EN: Bass, PT: Baixo, ES: Bajo
    case 'bass':
    case 'baixo':
    case 'bajo':
      return <span style={emojiStyle} className="inline-flex items-baseline">🎸<sub className="text-[0.6em] font-bold">B</sub></span>
    // Vocals - EN: Vocals, PT: Voz, ES: Voces
    case 'vocals':
    case 'vocal':
    case 'vozes':
    case 'voz':
    case 'voces':
      return <span style={emojiStyle}>🎤</span>
    // Keys - EN: Keys, PT: Teclados, ES: Teclados
    case 'keys':
    case 'keyboard':
    case 'teclado':
    case 'teclados':
      return <span style={emojiStyle}>🎹</span>
    default:
      return <Music className="w-4 h-4" />
  }
}

