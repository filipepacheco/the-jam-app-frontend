/**
 * Music Empty State Component
 * Displays when no music matches the current filters
 */

import { useTranslation } from 'react-i18next'

interface MusicEmptyStateProps {
  hasFilters: boolean
  isHost: boolean
}

export function MusicEmptyState({ hasFilters, isHost }: MusicEmptyStateProps) {
  const { t } = useTranslation()
  return (
    <div className="card bg-base-200">
      <div className="card-body text-center py-12">
        <h2 className="text-2xl font-bold mb-2">
          {hasFilters ? t('music_empty.no_songs_found') : t('music_empty.no_music_in_library')}
        </h2>
        <p className="text-base-content/70">
          {hasFilters
            ? t('music_empty.try_adjusting_filters')
            : isHost
              ? t('music_empty.host_hint')
              : t('music_empty.empty_hint')}
        </p>
      </div>
    </div>
  )
}
