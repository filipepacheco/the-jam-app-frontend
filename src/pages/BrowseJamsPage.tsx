/**
 * Browse Jams Page
 * Public page for browsing all available jam sessions with filters
 */

import {useCallback, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import useSWR from 'swr'
import {Action, Badge, EmptyState, ErrorState, Field, LoadingState, NavigationTabs} from '../components'
import type {NavigationTabItem} from '../components'
import {SITE_URL} from '../lib/api'
import {JamCard} from '../components'
import {JamCardSkeleton} from '../components'
import {SEO} from '../components/SEO'
import type {JamResponseDto, JamStatus} from '../types/api.types'

type DateSortOption = 'newest' | 'oldest' | 'upcoming'

export type BrowseJamsViewState =
  | {status: 'loading'}
  | {status: 'loaded'; data: readonly JamResponseDto[]}
  | {status: 'refreshing'; data: readonly JamResponseDto[]}
  | {status: 'error'; message: string; data?: readonly JamResponseDto[]}

interface BrowseJamsPageProps {
  viewState?: BrowseJamsViewState
  onRetry?: () => void | Promise<void>
}

export function BrowseJamsPage({viewState, onRetry}: BrowseJamsPageProps = {}) {
  const { t } = useTranslation()
  const swrKey = viewState ? null : '/jams'
  const {data: fetchedJams, error: fetchError, isLoading: fetchLoading, isValidating, mutate} = useSWR<JamResponseDto[]>(swrKey)
  const jams = viewState && 'data' in viewState ? [...(viewState.data ?? [])] : fetchedJams
  const error = viewState?.status === 'error' ? new Error(viewState.message) : fetchError
  const isLoading = viewState?.status === 'loading' || (!viewState && fetchLoading)
  const isRefreshing = viewState?.status === 'refreshing' || (!viewState && isValidating && Boolean(fetchedJams))


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

  const statusTabs: NavigationTabItem[] = [
    { id: 'ALL', label: t('jams.browse.tabs.all'), disabled: isLoading },
    { id: 'LIVE', label: t('jams.browse.tabs.live'), disabled: isLoading },
    { id: 'ACTIVE', label: t('jams.browse.tabs.active'), disabled: isLoading },
    { id: 'INACTIVE', label: t('jams.browse.tabs.inactive'), disabled: isLoading },
    { id: 'FINISHED', label: t('jams.browse.tabs.finished'), disabled: isLoading },
  ]

  const handleStatusTabChange = useCallback((next: string) => {
    setStatusFilter(next as 'ALL' | JamStatus)
    if (next === 'FINISHED') setPastJamsExpanded(true)
  }, [])

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
          {/* Search + Sort Row.
              Both labels are screen-reader only: this filter row never showed a
              visible label, and Field always renders a label element. The same
              sr-only label pattern is used by MusicFilters. */}
          <div className="flex gap-3 items-end">
            <Field
              id="browse-jams-search"
              label={<span className="sr-only">{t('jams.browse.search_label')}</span>}
              className="flex-1"
              disabled={isLoading}
            >
              <Field.Input
                type="text"
                placeholder={t('jams.browse.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Field>
            <Field
              id="browse-jams-sort"
              label={<span className="sr-only">{t('jams.browse.sort_label')}</span>}
              className="w-40 sm:w-48"
              disabled={isLoading}
            >
              <Field.Select
                value={dateSort}
                onChange={(e) => setDateSort(e.target.value as DateSortOption)}
              >
                <option value="newest">{t('jams.browse.sort.newest')}</option>
                <option value="oldest">{t('jams.browse.sort.oldest')}</option>
                <option value="upcoming">{t('jams.browse.sort.upcoming')}</option>
              </Field.Select>
            </Field>
          </div>

          {/* Status Filter Tabs.
              NavigationTabs keeps the tablist and tab roles and adds arrow-key
              roving focus. The per-tab title tooltips are not part of the
              canonical contract and are dropped. */}
          <NavigationTabs
            aria-label={t('jams.browse.filter_label')}
            className="text-xs sm:text-sm"
            items={statusTabs}
            value={statusFilter}
            onValueChange={handleStatusTabChange}
          />

          {/* Results Count & Clear Filters */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Badge tone="info" size="md">
              {(() => {
                const count = visibleCount
                const key = count === 1 ? 'jams.browse.results.one' : 'jams.browse.results.other'
                return t(key, { count })
              })()}
            </Badge>

            {hasActiveFilters && (
              <Action
                variant="quiet"
                onClick={clearFilters}
                state={isLoading ? 'disabled' : 'idle'}
              >
                {t('jams.browse.clear_filters')}
              </Action>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !jams?.length && (
          <div>
            <LoadingState label={t('jams.browse.loading')} className="mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {[...Array(6)].map((_, index) => (
                <JamCardSkeleton key={`skeleton-jam-${index}`} />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorState
            title={t('jams.browse.error_title')}
            description={typeof error === 'string' ? error : t('jams.browse.error_description')}
            action={{label: t('jams.browse.retry'), onClick: () => onRetry ? void onRetry() : void mutate()}}
          />
        )}

        {isRefreshing && (
          <LoadingState label={t('jams.browse.loading')} className="mb-4" />
        )}

        {/* Jam Sections */}
        {!isLoading && (!error || Boolean(jams?.length)) && (
          <>
            {/* Current Jams Section */}
            {visibleCount > 0 && showCurrentSection && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-base-content">
                  {t('jams.browse.section_current')}
                  <Badge tone="info" size="sm" className="ml-2">{currentJams.length}</Badge>
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
            {visibleCount > 0 && showPastSection && (
              <div>
                {/* Documented exception: this toggle stays hand-rolled. Disclosure
                    renders native <details>/<summary>, which does not set
                    aria-expanded, and the heading plus count must stay inside the
                    control. See docs/design-system/jam-music-migration.md. */}
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
                  <Badge size="sm">{pastJams.length}</Badge>
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
              <EmptyState
                icon="🎸"
                kind={hasActiveFilters ? 'results' : 'first-use'}
                title={t('jams.browse.empty_title')}
                description={hasActiveFilters
                  ? t('jams.browse.empty_try_filters')
                  : t('jams.browse.empty_no_jams')}
                action={hasActiveFilters
                  ? { label: t('jams.browse.clear_filters'), onClick: clearFilters }
                  : undefined}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
