/**
 * Schedule and instrument utilities
 * Shared functions for schedule management and instrument options
 */

import type { RegistrationResponseDto, ScheduleResponseDto } from '../types/api.types'
import { normalizeInstrument as normalizeInstrumentBase } from './musicianUtils'

export const KNOWN_INSTRUMENTS = new Set(['drums', 'guitars', 'bass', 'vocals', 'keys'])

/** Core band instruments required for "banda completa" */
export const CORE_BAND = ['drums', 'guitars', 'bass', 'vocals'] as const

/**
 * Normalize instrument name to canonical key, returning null for unknown instruments.
 */
function normalizeInstrument(instrument?: string): string | null {
  const result = normalizeInstrumentBase(instrument)
  return KNOWN_INSTRUMENTS.has(result) ? result : null
}

/**
 * Count non-rejected registrations grouped by canonical instrument.
 * Returns counts per instrument and total active (non-rejected) count.
 */
export function countActiveRegistrationsByInstrument(
  registrations: RegistrationResponseDto[] | undefined
): { counts: Record<string, number>; activeCount: number } {
  const counts: Record<string, number> = {}
  let activeCount = 0
  for (const reg of registrations || []) {
    if (reg.status === 'REJECTED') continue
    activeCount++
    const raw = normalizeInstrumentBase(reg.instrument)
    const inst = raw && KNOWN_INSTRUMENTS.has(raw) ? raw : null
    if (inst) counts[inst] = (counts[inst] || 0) + 1
  }
  return { counts, activeCount }
}

/**
 * Check if a schedule has the core band instruments covered (drums, guitar, bass, vocals).
 * Excludes rejected registrations.
 */
export function hasCoreBand(schedule: ScheduleResponseDto): boolean {
  if (!schedule.registrations || schedule.registrations.length === 0) return false
  const { counts } = countActiveRegistrationsByInstrument(schedule.registrations)
  return CORE_BAND.every((inst) => (counts[inst] || 0) >= 1)
}

export interface InstrumentOption {
  key: string
  label: string
  emoji: string
  needed: number
  registered: number
}

/**
 * Get instrument options for a schedule based on needed counts
 * @param schedule - The schedule with music and registration info
 * @param getLabel - Function to get translated label for instrument (receives key: 'drums'|'guitars'|'vocals'|'bass'|'keys')
 * @returns Array of instrument options with availability status
 */
export function getInstrumentOptions(
  schedule: ScheduleResponseDto,
  getLabel: (key: string) => string
): InstrumentOption[] {
  if (!schedule.music) return []

  const options: InstrumentOption[] = []
  const instrumentMap = [
    { key: 'drums', emoji: '🥁', field: 'neededDrums' as const },
    { key: 'guitars', emoji: '🎸', field: 'neededGuitars' as const },
    { key: 'vocals', emoji: '🎤', field: 'neededVocals' as const },
    { key: 'bass', emoji: '🎸', field: 'neededBass' as const },
    { key: 'keys', emoji: '🎹', field: 'neededKeys' as const },
  ]

  // Check if any instrument requirements are defined
  const hasAnyRequirements = instrumentMap.some(
    ({ field }) => (schedule.music![field] || 0) > 0
  )

  instrumentMap.forEach(({ key, emoji, field }) => {
    const label = getLabel(key)
    const needed = schedule.music![field] || 0

    // Show instrument if it has requirements, OR if no requirements are defined at all
    // (e.g., for suggested songs where user hasn't specified needed instruments)
    if (needed > 0 || !hasAnyRequirements) {
      // Count registrations for THIS schedule by matching normalized instrument
      const registered =
        schedule.registrations?.filter((reg) => normalizeInstrument(reg.instrument) === key).length || 0
      options.push({
        key,
        label,
        emoji,
        // Use -1 to indicate "unlimited/any" when no requirements defined
        needed: hasAnyRequirements ? needed : -1,
        registered,
      })
    }
  })

  return options
}
