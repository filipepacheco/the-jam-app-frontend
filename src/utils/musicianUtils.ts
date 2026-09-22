/**
 * Musician grouping utilities
 * Helper functions for organizing musicians by instrument
 */

import type {RegistrationResponseDto} from '../types/api.types'

/** Registrations in these states no longer occupy a performance slot. */
const INACTIVE_REGISTRATION_STATUSES = new Set(['REJECTED', 'WITHDRAWN', 'CANCELED', 'CANCELLED'])

export function isActiveRegistration(registration: RegistrationResponseDto): boolean {
  return !INACTIVE_REGISTRATION_STATUSES.has(registration.status?.toUpperCase() ?? '')
}

export function activeRegistrations(
  registrations: RegistrationResponseDto[] | undefined,
): RegistrationResponseDto[] {
  return (registrations ?? []).filter(isActiveRegistration)
}

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
  if (['keys', 'keyboard', 'keyboards', 'piano', 'pianos', 'teclado', 'teclados'].includes(lower)) return 'keys'
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

  registrations.filter(isActiveRegistration).forEach((reg) => {
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
