import type { MusicResponseDto, RegistrationResponseDto } from '../../types/api.types'

interface SlotFillIndicatorProps {
  registrations?: RegistrationResponseDto[]
  music?: MusicResponseDto
}

export function SlotFillIndicator({ registrations, music }: SlotFillIndicatorProps) {
  const totalNeeded = (music?.neededDrums || 0) + (music?.neededGuitars || 0)
    + (music?.neededBass || 0) + (music?.neededVocals || 0) + (music?.neededKeys || 0)
  const filled = registrations?.length || 0

  if (totalNeeded === 0) return null

  const isFull = filled >= totalNeeded
  const colorClass = isFull
    ? 'text-success'
    : filled === 0
      ? 'text-base-content/40'
      : 'text-warning'

  return (
    <span className={`text-xs font-mono font-semibold shrink-0 ${colorClass}`}>
      {filled}/{totalNeeded}
    </span>
  )
}
