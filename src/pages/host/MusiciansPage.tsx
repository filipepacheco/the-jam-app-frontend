/**
 * Musicians Page
 * Displays all musicians in the system with search, filter, and edit capabilities
 * Visible only to hosts
 */

import {useCallback, useEffect, useMemo, useState} from 'react'
import {useAuth} from '../../hooks'
import {musicianService} from '../../services'
import type {MusicianLevel, MusicianResponseDto, PaginationMeta} from '../../types/api.types.ts'
import {EditMusicianModal} from '../../components/EditMusicianModal.tsx'
import {Alert, FullPageSpinner} from '../../components'
import {useTranslation} from 'react-i18next'
import {ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Music, Search} from 'lucide-react'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
const DEFAULT_PAGE_SIZE = 20

/** Map level values to badge color variants */
function getLevelBadgeClass(level: string | null | undefined): string {
  switch (level) {
    case 'BEGINNER': return 'badge-info'
    case 'INTERMEDIATE': return 'badge-success'
    case 'ADVANCED': return 'badge-warning'
    case 'PROFESSIONAL': return 'badge-primary'
    default: return 'badge-ghost'
  }
}

/** Format level for display, handling null/undefined */
function formatLevel(level: string | null | undefined, t: (key: string) => string): string {
  if (!level) return t('schedule.levels.not_specified')
  return t(`schedule.levels.${level}`)
}

export function MusiciansPage() {
  const { t, i18n } = useTranslation()
  const { user, isLoading: authLoading } = useAuth()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<MusicianLevel | 'ALL'>('ALL')
  const [editingMusician, setEditingMusician] = useState<MusicianResponseDto | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Pagination state
  const [musicians, setMusicians] = useState<MusicianResponseDto[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalPages = meta ? Math.ceil(meta.total / pageSize) : 0

  // Fetch musicians with pagination
  const fetchMusicians = useCallback(async (pageNum: number, take: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await musicianService.findAll(pageNum * take, take)
      setMusicians(response.data)
      setMeta(response.meta)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch musicians')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.isHost) {
      void fetchMusicians(page, pageSize)
    }
  }, [user?.isHost, page, pageSize, fetchMusicians])

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }, [])

  // Date formatter using user's locale
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }),
    [i18n.language]
  )


  // Apply search and filter with memoization
  const filteredMusicians = useMemo(() => {
    let filtered = musicians

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          (m.name?.toLowerCase().includes(query) ?? false) ||
          (m.instrument?.toLowerCase().includes(query) ?? false) ||
          (m.otherInstruments?.toLowerCase().includes(query) ?? false) ||
          (m.contact?.toLowerCase().includes(query) ?? false)
      )
    }

    // Apply level filter
    if (selectedLevel !== 'ALL') {
      filtered = filtered.filter((m) => m.level === selectedLevel)
    }

    return filtered
  }, [searchQuery, selectedLevel, musicians])

  const handleEditMusician = useCallback((musician: MusicianResponseDto) => {
    setEditingMusician(musician)
  }, [])

  const handleUpdateMusician = useCallback(async (updatedMusician: MusicianResponseDto) => {
    try {
      await musicianService.update(updatedMusician.id, {
        name: updatedMusician.name ?? undefined,
        instrument: updatedMusician.instrument ?? undefined,
        level: updatedMusician.level ?? undefined,
        contact: updatedMusician.contact ?? undefined,
      })

      // Refresh current page
      await fetchMusicians(page, pageSize)

      setSuccess(t('jam_management.musicians.update_success'))
      setEditingMusician(null)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      // Error shown via error state
    }
  }, [fetchMusicians, page, pageSize, t])

  const handleCloseEditModal = () => {
    setEditingMusician(null)
  }

  // Ensure translations for the active language (or its base) are loaded before rendering
  const currentLang = (i18n.language || i18n.resolvedLanguage || '').toString()
  const baseLang = currentLang.split('-')[0]
  const hasBundle = (typeof i18n.hasResourceBundle === 'function')
    ? (i18n.hasResourceBundle(currentLang, 'translation') || i18n.hasResourceBundle(baseLang, 'translation'))
    : true

  if (!hasBundle) {
    return <FullPageSpinner />
  }

  if (authLoading) {
    return <FullPageSpinner />
  }

  if (!user?.isHost) {
    return null
  }

  return (
    <div className="min-h-screen bg-base-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <Music className="size-8 text-primary" aria-hidden="true" />
            {t('jam_management.musicians.title')}
          </h1>
          <p className="text-base-content/60">{t('jam_management.musicians.subtitle')}</p>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} title={t('common.error')} />}
        {success && <Alert type="success" message={success} title={t('common.success')} />}

        {/* Search and Filter Bar */}
        <div className="card bg-base-200 mb-6">
          <div className="card-body py-4">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              {/* Search Input */}
              <fieldset className="fieldset flex-1">
                <legend className="fieldset-legend">{t('jam_management.musicians.search_label')}</legend>
                <label className="input w-full">
                  <Search className="size-4 opacity-50" aria-hidden="true" />
                  <input
                    type="search"
                    name="search"
                    autoComplete="off"
                    placeholder={t('jam_management.musicians.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </label>
              </fieldset>

              {/* Level Filter */}
              <fieldset className="fieldset md:w-64">
                <legend className="fieldset-legend">{t('jam_management.musicians.filter_label')}</legend>
                <select
                  className="select w-full"
                  name="level"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value as MusicianLevel | 'ALL')}
                >
                  <option value="ALL">{t('jam_management.musicians.options.all_levels')}</option>
                  <option value="BEGINNER">{t('schedule.levels.BEGINNER')}</option>
                  <option value="INTERMEDIATE">{t('schedule.levels.INTERMEDIATE')}</option>
                  <option value="ADVANCED">{t('schedule.levels.ADVANCED')}</option>
                  <option value="PROFESSIONAL">{t('schedule.levels.PROFESSIONAL')}</option>
                </select>
              </fieldset>
            </div>

            {/* Results count */}
            <div className="text-sm text-base-content/60 mt-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {t('jam_management.musicians.results_count', { shown: filteredMusicians.length, total: meta?.total ?? musicians.length })}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        ) : filteredMusicians.length === 0 ? (
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <p className="text-base-content/60">
                {(meta?.total ?? 0) === 0
                  ? t('jam_management.musicians.no_musicians')
                  : t('jam_management.musicians.no_match')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: Card List */}
            <div className="md:hidden flex flex-col gap-2">
              {filteredMusicians.map((musician) => (
                <div key={musician.id} className="card bg-base-200">
                  <div className="card-body py-3 px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{musician.name || '—'}</span>
                          <span className={`badge badge-sm ${getLevelBadgeClass(musician.level)}`}>
                            {formatLevel(musician.level, t)}
                          </span>
                        </div>
                        {(musician.instrument || musician.otherInstruments) && (
                          <div className="text-sm text-base-content/70 mt-0.5">
                            {[musician.instrument, musician.otherInstruments].filter(Boolean).join(' · ')}
                          </div>
                        )}
                        {musician.bio && (
                          <div className="text-xs text-base-content/50 line-clamp-1 mt-0.5">{musician.bio}</div>
                        )}
                        {(musician.contact || musician.phone) && (
                          <div className="text-xs text-base-content/50 mt-1">
                            {[musician.contact, musician.phone].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                      <button
                        className="btn btn-primary btn-sm shrink-0"
                        onClick={() => handleEditMusician(musician)}
                        aria-label={`${t('jam_management.musicians.actions.edit')} ${musician.name || ''}`}
                      >
                        {t('jam_management.musicians.actions.edit')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto rounded-box">
              <table className="table table-zebra w-full bg-base-200">
                <thead>
                  <tr className="bg-base-300">
                    <th>{t('jam_management.musicians.table.name')}</th>
                    <th>{t('jam_management.musicians.table.instrument')}</th>
                    <th>{t('jam_management.musicians.table.level')}</th>
                    <th>{t('jam_management.musicians.table.contact')}</th>
                    <th>{t('jam_management.musicians.table.phone')}</th>
                    <th>{t('jam_management.musicians.table.joined')}</th>
                    <th>{t('jam_management.musicians.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMusicians.map((musician) => (
                    <tr key={musician.id} className="hover">
                      <td>
                        <div className="font-semibold">{musician.name || '—'}</div>
                        {musician.bio && (
                          <div className="text-xs text-base-content/50 line-clamp-1 max-w-48">{musician.bio}</div>
                        )}
                      </td>
                      <td>
                        <div>{musician.instrument || '—'}</div>
                        {musician.otherInstruments && (
                          <div className="text-xs text-base-content/50">{musician.otherInstruments}</div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getLevelBadgeClass(musician.level)}`}>
                          {formatLevel(musician.level, t)}
                        </span>
                      </td>
                      <td>{musician.contact || '—'}</td>
                      <td>{musician.phone || '—'}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {musician.createdAt ? dateFormatter.format(new Date(musician.createdAt)) : '—'}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => handleEditMusician(musician)}
                          aria-label={`${t('jam_management.musicians.actions.edit')} ${musician.name || ''}`}
                        >
                          {t('jam_management.musicians.actions.edit')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.total > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                {/* Page size selector - hidden on mobile */}
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <select
                    className="select select-sm select-bordered"
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span className="text-base-content/60">/ {meta.total}</span>
                </div>

                {/* Page navigation */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    {/* Mobile: prev / page-jump / next */}
                    <div className="flex sm:hidden items-center gap-2">
                      <button
                        className="btn btn-sm"
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                        aria-label={t('dj_control.previous')}
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <div className="flex items-center gap-1 text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        <input
                          type="number"
                          className="input input-sm input-bordered w-14 text-center"
                          min={1}
                          max={totalPages}
                          value={page + 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10)
                            if (val >= 1 && val <= totalPages) setPage(val - 1)
                          }}
                        />
                        <span className="text-base-content/60">/ {totalPages}</span>
                      </div>
                      <button
                        className="btn btn-sm"
                        disabled={!meta.hasMore}
                        onClick={() => setPage(p => p + 1)}
                        aria-label={t('dj_control.next')}
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>

                    {/* Desktop: full navigation */}
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="join">
                        <button
                          className="join-item btn btn-sm"
                          disabled={page === 0}
                          onClick={() => setPage(0)}
                          aria-label={t('dj_control.previous')}
                        >
                          <ChevronsLeft className="size-4" />
                        </button>
                        <button
                          className="join-item btn btn-sm"
                          disabled={page === 0}
                          onClick={() => setPage(p => p - 1)}
                          aria-label={t('dj_control.previous')}
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1 text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        <input
                          type="number"
                          className="input input-sm input-bordered w-16 text-center"
                          min={1}
                          max={totalPages}
                          value={page + 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10)
                            if (val >= 1 && val <= totalPages) setPage(val - 1)
                          }}
                        />
                        <span className="text-base-content/60">/ {totalPages}</span>
                      </div>

                      <div className="join">
                        <button
                          className="join-item btn btn-sm"
                          disabled={!meta.hasMore}
                          onClick={() => setPage(p => p + 1)}
                          aria-label={t('dj_control.next')}
                        >
                          <ChevronRight className="size-4" />
                        </button>
                        <button
                          className="join-item btn btn-sm"
                          disabled={!meta.hasMore}
                          onClick={() => setPage(totalPages - 1)}
                          aria-label={t('dj_control.next')}
                        >
                          <ChevronsRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editingMusician && (
        <EditMusicianModal
          musician={editingMusician}
          onSave={handleUpdateMusician}
          onClose={handleCloseEditModal}
        />
      )}
    </div>
  )
}

export default MusiciansPage
