/**
 * Music Filters Component
 * Search, genre filter, sort, and clear controls
 * Responsive: stacks vertically on mobile, horizontal on desktop
 */

import { useTranslation } from 'react-i18next'
import { Field } from './Field'
import { Action } from './Action'

interface MusicFiltersProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  genreFilter: string
  onGenreChange: (genre: string) => void
  sortBy: 'title' | 'artist' | 'date'
  onSortChange: (sort: 'title' | 'artist' | 'date') => void
  onClearFilters: () => void
  genres: string[]
}

export function MusicFilters({
  searchTerm,
  onSearchChange,
  genreFilter,
  onGenreChange,
  sortBy,
  onSortChange,
  onClearFilters,
  genres,
}: MusicFiltersProps) {
  const { t } = useTranslation()
  const hasFilters = searchTerm || genreFilter

  return (
    <div className="card bg-base-200 shadow">
      <div className="card-body p-3 sm:p-4">
        {/* Mobile: Stack vertically */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search - Full width on mobile. Label stays visible on mobile and becomes
              screen-reader-only from sm, matching the original layout. */}
          <div className="flex-1">
            <Field id="music-search" label={<span className="sm:sr-only">{t('common.search')}</span>}>
              <Field.Input
                type="text"
                placeholder={t('music_library.search_placeholder')}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </Field>
          </div>

          {/* Filters Row on Mobile / Horizontal on Desktop */}
          <div className="flex gap-2 sm:gap-4">
            {/* Genre Filter */}
            <div className="flex-1 sm:min-w-[140px]">
              <Field id="music-genre-filter" label={<span className="sm:sr-only">{t('common.form_labels.genre')}</span>}>
                <Field.Select value={genreFilter} onChange={(e) => onGenreChange(e.target.value)}>
                  <option value="">{t('music_library.all_genres')}</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </Field.Select>
              </Field>
            </div>

            {/* Sort */}
            <div className="flex-1 sm:min-w-[140px]">
              <Field id="music-sort" label={<span className="sm:sr-only">{t('jams.browse.sort_label')}</span>}>
                <Field.Select value={sortBy} onChange={(e) => onSortChange(e.target.value as 'title' | 'artist' | 'date')}>
                  <option value="title">{t('music_library.sort_title')}</option>
                  <option value="artist">{t('music_library.sort_artist')}</option>
                  <option value="date">{t('music_library.sort_date')}</option>
                </Field.Select>
              </Field>
            </div>

            {/* Clear Filters - Icon only on mobile, text on desktop */}
            {hasFilters && (
              <div className="shrink-0 self-end">
                <Action
                  onClick={onClearFilters}
                  variant="quiet"
                  aria-label={t('music_library.clear_filters')}
                >
                  <Action.Label>
                    <span className="sm:hidden" aria-hidden="true">✕</span>
                    <span className="hidden sm:inline">{t('music_library.clear_filters')}</span>
                  </Action.Label>
                </Action>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
