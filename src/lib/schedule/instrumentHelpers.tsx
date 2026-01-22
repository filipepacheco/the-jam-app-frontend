/**
 * Instrument Helper Utilities
 * Centralized instrument icon, display name, and grouping utilities for schedule components
 */

import React from 'react'
import {Music} from 'lucide-react'

/**
 * Get the emoji icon for a given instrument
 * @param instrument - The instrument name (case-insensitive, supports multiple languages)
 * @returns Emoji string or Lucide Music icon for unknown instruments
 */
export function getInstrumentIcon(instrument?: string): React.ReactNode {
  if (!instrument) return <Music className="w-4 h-4" />

  const lower = instrument.toLowerCase()
  switch (lower) {
    case 'drums':
    case 'bateria':
      return '🥁'
    case 'guitar':
    case 'guitars':
    case 'guitarra':
      return '🎸'
    case 'bass':
    case 'baixo':
      return '🎸b'
    case 'vocals':
    case 'vocal':
    case 'vozes':
    case 'voz':
      return '🎤'
    case 'keys':
    case 'keyboard':
    case 'teclado':
      return '🎹'
    default:
      return <Music className="w-4 h-4" />
  }
}

