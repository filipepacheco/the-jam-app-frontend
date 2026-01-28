/**
 * Music Filters Component
 * Search, genre filter, sort, and clear controls
 * Responsive: stacks vertically on mobile, horizontal on desktop
 */

import { useTranslation } from 'react-i18next'

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
          {/* Search - Full width on mobile */}
          <div className="form-control flex-1">
            <label className="label py-1 sm:sr-only" htmlFor="music-search">
              {t('common.search')}
            </label>
            <input
              id="music-search"
              type="text"
              placeholder={t('music_library.search_placeholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="input input-bordered input-sm sm:input-md w-full"
            />
          </div>

          {/* Filters Row on Mobile / Horizontal on Desktop */}
          <div className="flex gap-2 sm:gap-4">
            {/* Genre Filter */}
            <div className="form-control flex-1 sm:min-w-[140px]">
              <label className="label py-1 sm:sr-only" htmlFor="music-genre-filter">
                {t('common.form_labels.genre')}
              </label>
              <select
                id="music-genre-filter"
                value={genreFilter}
                onChange={(e) => onGenreChange(e.target.value)}
                className="select select-bordered select-sm sm:select-md w-full"
                aria-label={t('common.form_labels.genre')}
              >
                <option value="">{t('music_library.all_genres')}</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="form-control flex-1 sm:min-w-[140px]">
              <label className="label py-1 sm:sr-only" htmlFor="music-sort">
                {t('jams.browse.sort_label')}
              </label>
              <select
                id="music-sort"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as 'title' | 'artist' | 'date')}
                className="select select-bordered select-sm sm:select-md w-full"
                aria-label={t('jams.browse.sort_label')}
              >
                <option value="title">{t('music_library.sort_title')}</option>
                <option value="artist">{t('music_library.sort_artist')}</option>
                <option value="date">{t('music_library.sort_date')}</option>
              </select>
            </div>

            {/* Clear Filters - Icon only on mobile, text on desktop */}
            {hasFilters && (
              <button 
                onClick={onClearFilters} 
                className="btn btn-ghost btn-sm sm:btn-md shrink-0"
                title={t('music_library.clear_filters')}
                aria-label={t('music_library.clear_filters')}
              >
                <span className="sm:hidden">✕</span>
                <span className="hidden sm:inline">{t('music_library.clear_filters')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
