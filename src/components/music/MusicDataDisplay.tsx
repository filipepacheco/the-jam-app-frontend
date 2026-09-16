import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { MusicResponseDto } from '../../types/api.types'
import { formatDuration } from '../../lib/formatters'
import { Badge, CompactMetadata, DataCard, StatusIndicator } from '../data-display'
import type { DataCardProps } from '../data-display'

type MusicStatus = NonNullable<MusicResponseDto['status']>

export function MusicBadge({ status }: Readonly<{ status: MusicStatus }>) {
  const { t } = useTranslation()
  const label = status === 'APPROVED'
    ? t('common.statuses.approved')
    : t('common.statuses.suggested')
  return <Badge tone={status === 'APPROVED' ? 'success' : 'warning'}>{label}</Badge>
}

export function MusicStatusIndicator({ status }: Readonly<{ status: MusicStatus }>) {
  const { t } = useTranslation()
  const label = status === 'APPROVED'
    ? t('common.statuses.approved')
    : t('common.statuses.suggested')
  return <StatusIndicator status={status === 'APPROVED' ? 'success' : 'pending'} label={label} />
}

export function MusicCompactMetadata({ music }: Readonly<{ music: MusicResponseDto }>) {
  const { t } = useTranslation()
  const items = [
    music.genre ? { label: t('common.form_labels.genre'), value: music.genre } : null,
    music.duration ? { label: t('music_library.table.duration'), value: formatDuration(music.duration) } : null,
  ].filter((item): item is { label: string; value: string } => item !== null)
  return <CompactMetadata items={items} />
}

export interface MusicDataCardProps extends Omit<DataCardProps, 'children'> {
  children: ReactNode
  music: MusicResponseDto
}

export function MusicDataCard({ children, music, ...props }: MusicDataCardProps) {
  return (
    <DataCard {...props} aria-label={props['aria-label'] ?? music.title} density={props.density ?? 'compact'}>
      {children}
    </DataCard>
  )
}
