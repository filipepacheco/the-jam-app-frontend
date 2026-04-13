/**
 * MusicianSlotList - Groups registrations by instrument
 * Renders MusicianSlotRow for each registration and EmptySlotRow for unfilled slots
 * Single column on mobile, 2-column grid on lg+ to fill desktop width
 */

import { useMemo } from 'react'
import type { RegistrationResponseDto } from '../../types/api.types'
import { groupRegistrationsByInstrument } from '../../utils/musicianUtils'
import { MusicianSlotRow } from './MusicianSlotRow'
import { EmptySlotRow } from './EmptySlotRow'

interface MusicianSlotListProps {
  registrations: RegistrationResponseDto[] | undefined
  loading?: boolean
  showActions?: boolean
  onApprove?: (registrationId: string) => void
  onReject?: (registrationId: string) => void
  onDelete?: (registrationId: string) => void
  onMusicianClick?: (musicianId: string) => void
  neededDrums?: number
  neededGuitars?: number
  neededBass?: number
  neededVocals?: number
  neededKeys?: number
}

interface InstrumentSlotConfig {
  key: string
  needed: number
}

export function MusicianSlotList({
  registrations,
  loading = false,
  showActions = false,
  onApprove,
  onReject,
  onDelete,
  onMusicianClick,
  neededDrums = 0,
  neededGuitars = 0,
  neededBass = 0,
  neededVocals = 0,
  neededKeys = 0,
}: MusicianSlotListProps) {
  type SlotItem =
    | { type: 'registration'; reg: RegistrationResponseDto }
    | { type: 'empty'; instrument: string; count: number }

  const items = useMemo(() => {
    const grouped = groupRegistrationsByInstrument(registrations)

    // Build list of instruments that are needed
    const instrumentSlots: InstrumentSlotConfig[] = [
      { key: 'drums', needed: neededDrums },
      { key: 'guitars', needed: neededGuitars },
      { key: 'bass', needed: neededBass },
      { key: 'vocals', needed: neededVocals },
      { key: 'keys', needed: neededKeys },
    ].filter((s) => s.needed > 0)

    // Also include any instruments from registrations that aren't in the needed list
    grouped.forEach((_regs, instrument) => {
      if (!instrumentSlots.find((s) => s.key === instrument)) {
        instrumentSlots.push({ key: instrument, needed: 0 })
      }
    })

    // Flatten all rows (registrations + empty slots) for grid layout
    const items: SlotItem[] = []
    for (const { key, needed } of instrumentSlots) {
      const regs = grouped.get(key) || []
      for (const reg of regs) {
        items.push({ type: 'registration', reg })
      }
      const emptyCount = Math.max(0, needed - regs.length)
      if (emptyCount > 0) {
        items.push({ type: 'empty', instrument: key, count: emptyCount })
      }
    }

    return items
  }, [registrations, neededDrums, neededGuitars, neededBass, neededVocals, neededKeys])

  return (
    <div className="mt-1">
      {/* Single column on mobile, 2 columns on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-6">
        {items.map((item) =>
          item.type === 'registration' ? (
            <MusicianSlotRow
              key={item.reg.id}
              registration={item.reg}
              loading={loading}
              showActions={showActions}
              onApprove={onApprove}
              onReject={onReject}
              onDelete={onDelete}
              onMusicianClick={onMusicianClick}
            />
          ) : (
            <EmptySlotRow
              key={`empty-${item.instrument}`}
              instrument={item.instrument}
              count={item.count}
            />
          ),
        )}
      </div>

    </div>
  )
}
