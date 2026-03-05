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
    const instrument = normalizeInstrument(musician.instrument) || 'Unknown'
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
  if (['drums', 'bateria', 'batería', 'baterias'].includes(lower)) return 'drums'
  if (['guitar', 'guitars', 'guitarra', 'guitarras'].includes(lower)) return 'guitars'
  if (['bass', 'baixo', 'baixos', 'bajo'].includes(lower)) return 'bass'
  if (['vocals', 'vocal', 'vozes', 'voz', 'voces'].includes(lower)) return 'vocals'
  if (['keys', 'keyboard', 'teclado', 'teclados'].includes(lower)) return 'keys'
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
    const instrument = normalizeInstrument(reg.instrument ?? reg.musician?.instrument ?? undefined)
    if (instrument) {
      if (!grouped.has(instrument)) {
        grouped.set(instrument, [])
      }
      grouped.get(instrument)!.push(reg)
    }
  })

  return grouped
}
