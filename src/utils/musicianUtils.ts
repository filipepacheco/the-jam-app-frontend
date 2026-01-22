/**
 * Musician grouping utilities
 * Helper functions for organizing musicians by instrument
 */

import type {RegistrationResponseDto} from '../types/api.types'

/**
 * Minimal musician interface for grouping
 * Any type with an instrument property can be grouped
 */
interface HasInstrument {
  instrument: string
}

/**
 * Group musicians by instrument
 * @param musicians - Array of musician objects with instrument property
 * @returns Object with instruments as keys and arrays of musicians as values
 */
export function groupMusiciansByInstrument<T extends HasInstrument>(
  musicians: T[] | undefined
): Record<string, T[]> {
  return (musicians || []).reduce((acc: Record<string, T[]>, musician: T) => {
    const instrument = musician.instrument || 'Unknown'
    if (!acc[instrument]) {
      acc[instrument] = []
    }
    acc[instrument].push(musician)
    return acc
  }, {})
}

/**
 * Normalize instrument names across different variations/languages
 * Maps different spellings/language variants to standard instrument names
 * @param instrument - Instrument name to normalize
 * @returns Normalized instrument name
 */
export function normalizeInstrument(instrument?: string): string {
  if (!instrument) return ''
  const lower = instrument.toLowerCase()
  if (lower === 'drums' || lower === 'bateria') return 'drums'
  if (lower === 'guitar' || lower === 'guitars' || lower === 'guitarra') return 'guitars'
  if (lower === 'bass' || lower === 'baixo') return 'bass'
  if (lower === 'vocals' || lower === 'vocal' || lower === 'vozes' || lower === 'voz') return 'vocals'
  if (lower === 'keys' || lower === 'keyboard' || lower === 'teclado') return 'keys'
  return lower
}

/**
 * Group registrations by normalized instrument
 * @param registrations - Array of registration objects
 * @returns Map with instruments as keys and arrays of registrations as values
 */
export function groupRegistrationsByInstrument(
  registrations: RegistrationResponseDto[] | undefined
): Map<string, RegistrationResponseDto[]> {
  const grouped = new Map<string, RegistrationResponseDto[]>()
  if (!registrations) return grouped

  registrations.forEach((reg) => {
    const instrument = normalizeInstrument(reg.instrument || reg.musician?.instrument)
    if (instrument) {
      if (!grouped.has(instrument)) {
        grouped.set(instrument, [])
      }
      grouped.get(instrument)!.push(reg)
    }
  })

  return grouped
}
