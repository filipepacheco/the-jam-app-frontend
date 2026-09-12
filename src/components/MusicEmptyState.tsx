/**
 * Music Empty State Component
 * Displays when no music matches the current filters
 */

import { useTranslation } from 'react-i18next'
import { CanonicalEmptyState } from './FeedbackStates'

interface MusicEmptyStateProps {
  hasFilters: boolean
  isHost: boolean
}

export function MusicEmptyState({ hasFilters, isHost }: MusicEmptyStateProps) {
  const { t } = useTranslation()
  return (
    <CanonicalEmptyState
      kind={hasFilters ? 'results' : 'first-use'}
      title={hasFilters ? t('music_empty.no_songs_found') : t('music_empty.no_music_in_library')}
      description={hasFilters
        ? t('music_empty.try_adjusting_filters')
        : isHost
          ? t('music_empty.host_hint')
          : t('music_empty.empty_hint')}
    />
  )
}
