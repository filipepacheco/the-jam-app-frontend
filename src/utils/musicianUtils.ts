/**
 * Musician grouping utilities
 * Helper functions for organizing musicians by instrument
 */

/**
 * Group musicians by instrument
 * @param musicians - Array of musician objects with instrument property
 * @returns Object with instruments as keys and arrays of musicians as values
 */
export function groupMusiciansByInstrument(musicians: any[] | undefined): Record<string, any[]> {
  return (musicians || []).reduce((acc: Record<string, any[]>, musician: any) => {
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
  registrations: any[] | undefined
): Map<string, any[]> {
  const grouped = new Map<string, any[]>()
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
