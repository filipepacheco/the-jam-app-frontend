/**
 * Schedule and instrument utilities
 * Shared functions for schedule management and instrument options
 */

import type { ScheduleResponseDto } from '../types/api.types'

/**
 * Normalize instrument name to canonical key
 * Handles EN, PT, and ES variations
 */
function normalizeInstrument(instrument?: string): string | null {
  if (!instrument) return null
  const lower = instrument.toLowerCase()

  // Drums - EN: Drums, PT: Bateria, ES: Batería
  if (['drums', 'bateria', 'batería'].includes(lower)) return 'drums'

  // Vocals - EN: Vocals, PT: Voz, ES: Voces
  if (['vocals', 'vocal', 'vozes', 'voz', 'voces'].includes(lower)) return 'vocals'

  // Guitar - EN: Guitars, PT: Guitarras, ES: Guitarras
  if (['guitar', 'guitars', 'guitarra', 'guitarras'].includes(lower)) return 'guitars'

  // Bass - EN: Bass, PT: Baixo, ES: Bajo
  if (['bass', 'baixo', 'bajo'].includes(lower)) return 'bass'

  // Keys - EN: Keys, PT: Teclados, ES: Teclados
  if (['keys', 'keyboard', 'teclado', 'teclados'].includes(lower)) return 'keys'

  return null
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

  instrumentMap.forEach(({ key, emoji, field }) => {
    const label = getLabel(key)
    const needed = schedule.music![field] || 0
    if (needed > 0) {
      // Count registrations for THIS schedule by matching normalized instrument
      const registered =
        schedule.registrations?.filter((reg) => normalizeInstrument(reg.instrument) === key).length || 0
      options.push({
        key,
        label,
        emoji,
        needed,
        registered,
      })
    }
  })

  return options
}
