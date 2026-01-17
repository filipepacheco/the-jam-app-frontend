/**
 * Schedule and instrument utilities
 * Shared functions for schedule management and instrument options
 */

import type { ScheduleResponseDto } from '../types/api.types'

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
      const registered =
        schedule.registrations?.filter((reg) => reg.musician?.instrument === label).length || 0
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
