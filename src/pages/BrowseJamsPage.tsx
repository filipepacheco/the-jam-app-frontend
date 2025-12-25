/**
 * Browse Jams Page
 * Public page for browsing all available jam sessions with filters
 */

import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useJams} from '../hooks'
import {ErrorAlert, JamCard, JamCardSkeleton} from '../components'
import type {JamStatus} from '../types/api.types'

type DateSortOption = 'newest' | 'oldest' | 'upcoming'

export function BrowseJamsPage() {
  const { t } = useTranslation()
  const { data: jams, loading, error } = useJams()


  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | JamStatus>('ALL')
  const [dateSort, setDateSort] = useState<DateSortOption>('newest')

  // Client-side filtering and sorting
  const filteredJams = useMemo(() => {
    if (!jams) return []

    let result = [...jams]

    // 1. Search filter (name + description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (jam) =>
          jam.name.toLowerCase().includes(query) ||
          jam.description?.toLowerCase().includes(query)
      )
    }

    // 2. Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((jam) => jam.status === statusFilter)
    }

    // 3. Date sorting
    result.sort((a, b) => {
      if (dateSort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (dateSort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else {
        // 'upcoming'
        if (!a.date || !b.date) return 0
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      }
    })

    return result
  }, [jams, searchQuery, statusFilter, dateSort])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('ALL')
    setDateSort('newest')
  }

  // Check if any filters are active
  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'ALL'

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="bg-primary text-primary-content">
        <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 lg:py-12">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4">
            🎸 {t('jams.browse.title')}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl opacity-90">
            {t('jams.browse.subtitle')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Filters & Search Panel */}
        <div className="card bg-base-200 shadow-lg mb-6 sm:mb-8">
          <div className="card-body p-3 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <label className="label">
                  <span className="label-text font-semibold text-xs sm:text-sm">{t('jams.browse.search_label')}</span>
                </label>
                <input
                  type="text"
                  placeholder={t('jams.browse.search_placeholder')}
                  className="input input-bordered w-full input-sm sm:input-md text-xs sm:text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search jams"
                  disabled={loading}
                />
              </div>

              {/* Date Sort */}
              <div className="w-full sm:w-40 lg:w-48">
                <label className="label">
                  <span className="label-text font-semibold text-xs sm:text-sm">{t('jams.browse.sort_label')}</span>
                </label>
                <select
                  className="select select-bordered w-full select-sm sm:select-md text-xs sm:text-sm"
                  value={dateSort}
                  onChange={(e) => setDateSort(e.target.value as DateSortOption)}
                  disabled={loading}
                >
                  <option value="newest">{t('jams.browse.sort.newest')}</option>
                  <option value="oldest">{t('jams.browse.sort.oldest')}</option>
                  <option value="upcoming">{t('jams.browse.sort.upcoming')}</option>
                </select>
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="mt-3 sm:mt-4">
              <label className="label">
                <span className="label-text font-semibold text-xs sm:text-sm">{t('jams.browse.filter_label')}</span>
              </label>
              <div className="tabs tabs-boxed text-xs sm:text-sm flex-wrap" role="tablist">
                <button
                  className={`tab ${statusFilter === 'ALL' ? 'tab-active' : ''}`}
                  onClick={() => setStatusFilter('ALL')}
                  role="tab"
                  aria-selected={statusFilter === 'ALL'}
                  disabled={loading}
                >
                  {t('jams.browse.tabs.all')}
                </button>
                <button
                  className={`tab ${statusFilter === 'ACTIVE' ? 'tab-active' : ''}`}
                  onClick={() => setStatusFilter('ACTIVE')}
                  role="tab"
                  aria-selected={statusFilter === 'ACTIVE'}
                  disabled={loading}
                >
                  {t('jams.browse.tabs.active')}
                </button>
                <button
                  className={`tab ${statusFilter === 'INACTIVE' ? 'tab-active' : ''}`}
                  onClick={() => setStatusFilter('INACTIVE')}
                  role="tab"
                  aria-selected={statusFilter === 'INACTIVE'}
                  disabled={loading}
                >
                  {t('jams.browse.tabs.inactive')}
                </button>
                <button
                  className={`tab ${statusFilter === 'FINISHED' ? 'tab-active' : ''}`}
                  onClick={() => setStatusFilter('FINISHED')}
                  role="tab"
                  aria-selected={statusFilter === 'FINISHED'}
                  disabled={loading}
                >
                  {t('jams.browse.tabs.finished')}
                </button>
              </div>
            </div>

            {/* Results Count & Clear Filters */}
            <div className="flex items-center justify-between mt-3 sm:mt-4 flex-wrap gap-2">
              <div className="badge badge-primary badge-sm sm:badge-md lg:badge-lg text-xs sm:text-sm">
                {(() => {
                  const count = filteredJams.length
                  const key = count === 1 ? 'jams.browse.results.one' : 'jams.browse.results.other'
                  return t(key, { count })
                })()}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="btn btn-ghost btn-xs sm:btn-sm text-xs sm:text-sm"
                  disabled={loading}
                >
                  {t('jams.browse.clear_filters')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div>
            <div className="flex justify-center items-center gap-3 mb-8">
              <span className="loading loading-spinner loading-md sm:loading-lg"></span>
              <span className="font-semibold text-sm sm:text-base text-base-content/70">{t('jams.browse.loading')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {[...Array(6)].map((_, index) => (
                <JamCardSkeleton key={index} />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorAlert title={t('jams.browse.error_title')} message={error} />
        )}

        {/* Jam Cards Grid */}
        {!loading && !error && filteredJams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 animate-in fade-in duration-300">
            {filteredJams.map((jam) => (
              <JamCard
                key={jam.id}
                jam={jam}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredJams.length === 0 && (
          <div className="text-center py-8 sm:py-12 lg:py-16">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">🎸</div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">{t('jams.browse.empty_title')}</h3>
            <p className="text-xs sm:text-sm lg:text-base text-base-content/70 mb-4 sm:mb-6">
              {hasActiveFilters
                ? t('jams.browse.empty_try_filters')
                : t('jams.browse.empty_no_jams')}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-primary btn-xs sm:btn-sm lg:btn-md">
                {t('jams.browse.clear_filters')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BrowseJamsPage
