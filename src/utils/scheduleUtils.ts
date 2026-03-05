/**
 * Schedule and instrument utilities
 * Shared functions for schedule management and instrument options
 */

import type { ScheduleResponseDto } from '../types/api.types'
import { normalizeInstrument as normalizeInstrumentBase } from './musicianUtils'

const KNOWN_INSTRUMENTS = new Set(['drums', 'guitars', 'bass', 'vocals', 'keys'])

/**
 * Normalize instrument name to canonical key, returning null for unknown instruments.
 */
function normalizeInstrument(instrument?: string): string | null {
  const result = normalizeInstrumentBase(instrument)
  return KNOWN_INSTRUMENTS.has(result) ? result : null
}

/**
 * Check if a schedule has the core band instruments covered
 * @param schedule - The schedule with music and registration info
 * @returns true if drums, vocals, guitar, and bass are all registered
 */
export function isScheduleReadyToPlay(schedule: ScheduleResponseDto): boolean {
  if (!schedule.registrations || schedule.registrations.length === 0) return false

  const coreInstruments = ['drums', 'vocals', 'guitars', 'bass']
  const registeredInstruments = new Set(
    schedule.registrations.map((reg) => normalizeInstrument(reg.instrument))
  )

  return coreInstruments.every((instrument) => registeredInstruments.has(instrument))
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
