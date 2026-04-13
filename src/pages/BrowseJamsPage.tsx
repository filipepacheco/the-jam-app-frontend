/**
 * Browse Jams Page
 * Public page for browsing all available jam sessions with filters
 */

import {useCallback, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import useSWR from 'swr'
import {Alert} from '../components'
import {SITE_URL} from '../lib/api'
import {JamCard} from '../components'
import {JamCardSkeleton} from '../components'
import {SEO} from '../components/SEO'
import type {JamStatus} from '../types/api.types'

type DateSortOption = 'newest' | 'oldest' | 'upcoming'

export function BrowseJamsPage() {
  const { t } = useTranslation()
  const { data: jams, error, isLoading } = useSWR('/jams')


  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | JamStatus>('ALL')
  const [dateSort, setDateSort] = useState<DateSortOption>('newest')
  const [pastJamsExpanded, setPastJamsExpanded] = useState(false)

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

  // Split into current and past jams
  const currentJams = useMemo(
    () => filteredJams.filter((jam) => jam.status === 'ACTIVE' || jam.status === 'INACTIVE' || jam.status === 'LIVE'),
    [filteredJams]
  )
  const pastJams = useMemo(
    () => filteredJams.filter((jam) => jam.status === 'FINISHED'),
    [filteredJams]
  )

  // Section visibility based on status filter
  const showCurrentSection = statusFilter === 'ALL' || statusFilter === 'ACTIVE' || statusFilter === 'INACTIVE' || statusFilter === 'LIVE'
  const showPastSection = statusFilter === 'ALL' || statusFilter === 'FINISHED'
  const visibleCount = (showCurrentSection ? currentJams.length : 0) + (showPastSection ? pastJams.length : 0)

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setStatusFilter('ALL')
    setDateSort('newest')
  }, [])

  // Check if any filters are active
  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'ALL'

  const siteUrl = SITE_URL

  const browseJsonLd: Record<string, unknown>[] = [
    {
      '@type': 'CollectionPage',
      name: t('jams.browse.title'),
      description: t('seo.browse.description', { defaultValue: t('jams.browse.subtitle') }),
      url: `${siteUrl}/jams`,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Jam App',
        url: siteUrl,
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: t('jams.browse.title'), item: `${siteUrl}/jams` },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-base-100">
      <SEO
        title={t('seo.browse.title', { defaultValue: t('jams.browse.title') })}
        description={t('seo.browse.description', { defaultValue: t('jams.browse.subtitle') })}
        keywords={t('seo.browse.keywords', { defaultValue: 'jam sessions, live music events, open mic, jam, jams, music meetup' })}
        canonical={`${siteUrl}/jams`}
        jsonLd={browseJsonLd}
      />
      {/* Hero Section */}
      <div className="bg-primary text-primary-content">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              {t('jams.browse.title')}
            </h1>
            <p className="text-sm sm:text-base opacity-95">
              {t('jams.browse.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Filters & Search */}
        <div className="mb-4 sm:mb-6 space-y-3">
          {/* Search + Sort Row */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={t('jams.browse.search_placeholder')}
              className="input input-bordered flex-1 input-sm sm:input-md text-xs sm:text-sm min-h-[44px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search jams"
              disabled={isLoading}
            />
            <select
              className="select select-bordered w-40 sm:w-48 select-sm sm:select-md text-xs sm:text-sm min-h-[44px]"
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value as DateSortOption)}
              disabled={isLoading}
            >
              <option value="newest">{t('jams.browse.sort.newest')}</option>
              <option value="oldest">{t('jams.browse.sort.oldest')}</option>
              <option value="upcoming">{t('jams.browse.sort.upcoming')}</option>
            </select>
          </div>

          {/* Status Filter Tabs */}
          <div className="tabs tabs-boxed text-xs sm:text-sm flex-wrap overflow-x-auto [&_.tab]:min-h-[44px]" role="tablist">
            <button
              className={`tab ${statusFilter === 'ALL' ? 'tab-active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
              role="tab"
              aria-selected={statusFilter === 'ALL'}
              disabled={isLoading}
              title={t('jams.browse.tabs.all_hint', 'Show all jam sessions')}
            >
              {t('jams.browse.tabs.all')}
            </button>
            <button
              className={`tab ${statusFilter === 'LIVE' ? 'tab-active' : ''}`}
              onClick={() => setStatusFilter('LIVE')}
              role="tab"
              aria-selected={statusFilter === 'LIVE'}
              disabled={isLoading}
              title={t('jams.browse.tabs.live_hint', 'Currently performing live')}
            >
              {t('jams.browse.tabs.live')}
            </button>
            <button
              className={`tab ${statusFilter === 'ACTIVE' ? 'tab-active' : ''}`}
              onClick={() => setStatusFilter('ACTIVE')}
              role="tab"
              aria-selected={statusFilter === 'ACTIVE'}
              disabled={isLoading}
              title={t('jams.browse.tabs.active_hint', 'Scheduled and accepting musicians')}
            >
              {t('jams.browse.tabs.active')}
            </button>
            <button
              className={`tab ${statusFilter === 'INACTIVE' ? 'tab-active' : ''}`}
              onClick={() => setStatusFilter('INACTIVE')}
              role="tab"
              aria-selected={statusFilter === 'INACTIVE'}
              disabled={isLoading}
              title={t('jams.browse.tabs.inactive_hint', 'Created but not yet started')}
            >
              {t('jams.browse.tabs.inactive')}
            </button>
            <button
              className={`tab ${statusFilter === 'FINISHED' ? 'tab-active' : ''}`}
              onClick={() => { setStatusFilter('FINISHED'); setPastJamsExpanded(true) }}
              role="tab"
              aria-selected={statusFilter === 'FINISHED'}
              disabled={isLoading}
              title={t('jams.browse.tabs.finished_hint', 'Past sessions that have ended')}
            >
              {t('jams.browse.tabs.finished')}
            </button>
          </div>

          {/* Results Count & Clear Filters */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="badge badge-primary badge-sm sm:badge-md lg:badge-lg text-xs sm:text-sm">
              {(() => {
                const count = visibleCount
                const key = count === 1 ? 'jams.browse.results.one' : 'jams.browse.results.other'
                return t(key, { count })
              })()}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-ghost btn-sm text-xs sm:text-sm"
                disabled={isLoading}
              >
                {t('jams.browse.clear_filters')}
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div>
            <div className="flex justify-center items-center gap-3 mb-8">
              <span className="loading loading-spinner loading-md sm:loading-lg"></span>
              <span className="font-semibold text-sm sm:text-base text-base-content/70">{t('jams.browse.loading')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {[...Array(6)].map((_, index) => (
                <JamCardSkeleton key={`skeleton-jam-${index}`} />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert type="error" title={t('jams.browse.error_title')} message={error} />
        )}

        {/* Jam Sections */}
        {!isLoading && !error && (
          <>
            {/* Current Jams Section */}
            {showCurrentSection && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-base-content">
                  {t('jams.browse.section_current')}
                  <span className="badge badge-primary badge-sm ml-2">{currentJams.length}</span>
                </h2>
                {currentJams.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 animate-in fade-in duration-300">
                    {currentJams.map((jam) => (
                      <JamCard key={jam.id} jam={jam} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-base-content/60 py-4">{t('jams.browse.section_no_current')}</p>
                )}
              </div>
            )}

            {/* Past Jams Section - Collapsible */}
            {showPastSection && (
              <div>
                <button
                  onClick={() => setPastJamsExpanded(!pastJamsExpanded)}
                  className="flex items-center gap-2 mb-3 sm:mb-4 cursor-pointer group"
                  type="button"
                  aria-expanded={pastJamsExpanded}
                >
                  <span
                    className={`transform transition-transform motion-reduce:transition-none text-base-content/60 ${pastJamsExpanded ? 'rotate-90' : ''}`}
                    aria-hidden="true"
                  >
                    &#9654;
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-base-content group-hover:text-primary transition-colors">
                    {t('jams.browse.section_past')}
                  </h2>
                  <span className="badge badge-ghost badge-sm">{pastJams.length}</span>
                </button>

                {pastJamsExpanded && pastJams.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 animate-in fade-in duration-300">
                    {pastJams.map((jam) => (
                      <JamCard key={jam.id} jam={jam} />
                    ))}
                  </div>
                )}

                {pastJamsExpanded && pastJams.length === 0 && (
                  <p className="text-sm text-base-content/60 py-4">{t('jams.browse.section_no_past')}</p>
                )}
              </div>
            )}

            {/* Global Empty State */}
            {visibleCount === 0 && (
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
          </>
        )}
      </div>
    </div>
  )
}


