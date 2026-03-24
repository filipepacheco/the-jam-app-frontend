/**
 * Music Library Page
 * Public page for browsing music catalog
 * Hosts can add, edit, delete. Users can browse.
 * Route: /music
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, usePageAlerts } from '../hooks'
import { musicService } from '../services'
import type { MusicResponseDto, UpdateMusicDto, PaginationMeta } from '../types/api.types'
import {
  ConfirmDialog,
  MusicCard,
  MusicEmptyState,
  MusicFilters,
  MusicModal,
  PageAlerts,
} from '../components'
import { filterAndSortMusic } from '../lib/musicUtils'
import { GENRES } from '../lib/musicConstants'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const
const DEFAULT_PAGE_SIZE = 50

type SortBy = 'title' | 'artist' | 'date'
type ModalMode = 'add' | 'suggest' | null

export function MusicPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuth()

  // Paginated data fetching
  const [musicList, setMusicList] = useState<MusicResponseDto[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const totalPages = meta ? Math.ceil(meta.total / pageSize) : 0

  const fetchMusic = useCallback(async (pageNum: number, take: number) => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const response = await musicService.findAll(pageNum * take, take, 'APPROVED')
      setMusicList(response.data)
      setMeta(response.meta)
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch music')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMusic(page, pageSize)
  }, [page, pageSize, fetchMusic])

  const mutate = useCallback(() => fetchMusic(page, pageSize), [fetchMusic, page, pageSize])

  // Suggested songs modal
  const [suggestedModalOpen, setSuggestedModalOpen] = useState(false)
  const [suggestedSongs, setSuggestedSongs] = useState<MusicResponseDto[]>([])
  const [suggestedCount, setSuggestedCount] = useState(0)
  const [suggestedLoading, setSuggestedLoading] = useState(false)

  const fetchSuggestedCount = useCallback(async () => {
    try {
      const response = await musicService.findAll(0, 1, 'SUGGESTED')
      setSuggestedCount(response.meta.total)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    void fetchSuggestedCount()
  }, [fetchSuggestedCount])

  const openSuggestedModal = useCallback(async () => {
    setSuggestedModalOpen(true)
    setSuggestedLoading(true)
    try {
      const response = await musicService.findAll(0, 100, 'SUGGESTED')
      setSuggestedSongs(response.data)
    } catch { /* ignore */ }
    setSuggestedLoading(false)
  }, [])

  const closeSuggestedModal = useCallback(() => {
    setSuggestedModalOpen(false)
    setSuggestedSongs([])
  }, [])

  const [actionLoading, setActionLoading] = useState(false)
  const {error, setError, clearError, success, setSuccess, clearSuccess} = usePageAlerts()

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [genreFilter, setGenreFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortBy>('title')

  // Quick edit expanded card
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  const [modalState, setModalState] = useState<{ mode: ModalMode }>(({ mode: null }))

  // Confirm dialog state (without function - using ref instead)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmVariant, setConfirmVariant] = useState<'default' | 'destructive'>('default')
  const pendingConfirmAction = useRef<(() => Promise<void>) | null>(null)

  const openConfirm = useCallback((
    title: string,
    message: string,
    variant: 'default' | 'destructive',
    action: () => Promise<void>
  ) => {
    setConfirmTitle(title)
    setConfirmMessage(message)
    setConfirmVariant(variant)
    pendingConfirmAction.current = action
    setConfirmOpen(true)
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false)
    pendingConfirmAction.current = null
  }, [])

  const handleConfirm = useCallback(async () => {
    if (pendingConfirmAction.current) {
      await pendingConfirmAction.current()
    }
    closeConfirm()
  }, [closeConfirm])

  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    setGenreFilter('')
    setSortBy('title')
  }, [])

  const filteredAndSortedMusic = useMemo(() => {
    return filterAndSortMusic(musicList, {
      status: 'all',
      searchTerm,
      genreFilter,
      sortBy,
    })
  }, [musicList, searchTerm, genreFilter, sortBy])

  const handleToggleExpand = useCallback((musicId: string) => {
    setExpandedCardId((prev: string | null) => prev === musicId ? null : musicId)
  }, [])

  const handleQuickSave = useCallback(async (id: string, data: UpdateMusicDto): Promise<boolean> => {
    try {
      const result = await musicService.update(id, data)
      if (!result.success) {
        setError(result.error || t('music_library.errors.failed_to_update'))
        return false
      }
      setExpandedCardId(null)
      await mutate()
      setSuccess(t('music_library.feedback.update_success', { title: result.data?.title || '' }))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : t('music_library.errors.failed_to_update'))
      return false
    }
  }, [t, mutate, setError, setSuccess])

  const refreshSuggested = useCallback(async () => {
    try {
      const response = await musicService.findAll(0, 100, 'SUGGESTED')
      setSuggestedSongs(response.data)
      setSuggestedCount(response.meta.total)
    } catch { /* ignore */ }
  }, [])

  const handleApprove = useCallback(
    async (music: MusicResponseDto) => {
      setActionLoading(true)
      setError(null)
      try {
        const result = await musicService.update(music.id, { status: 'APPROVED' })
        if (!result.success) {
          setError(result.error || t('music_library.errors.failed_to_approve'))
        } else {
          setSuccess(t('music_library.feedback.approve_success', { title: music.title }))
          await Promise.all([mutate(), refreshSuggested()])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('music_library.errors.failed_to_approve'))
      } finally {
        setActionLoading(false)
      }
    },
    [t, mutate, refreshSuggested, setError, setSuccess],
  )

  const handleReject = useCallback(
    (music: MusicResponseDto) => {
      openConfirm(
        t('common.reject'),
        t('music_library.feedback.reject_confirm', { title: music.title, artist: music.artist }),
        'destructive',
        async () => {
          setActionLoading(true)
          setError(null)
          try {
            const result = await musicService.remove(music.id)
            if (!result.success) {
              setError(result.error || t('music_library.errors.failed_to_reject'))
            } else {
              setSuccess(t('music_library.feedback.reject_success', { title: music.title }))
              await refreshSuggested()
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : t('music_library.errors.failed_to_reject'))
          } finally {
            setActionLoading(false)
          }
        }
      )
    },
    [t, openConfirm, mutate],
  )

  const handleDelete = useCallback(
    (music: MusicResponseDto) => {
      openConfirm(
        t('common.delete'),
        t('music_library.feedback.delete_confirm', { title: music.title, artist: music.artist }),
        'destructive',
        async () => {
          setActionLoading(true)
          setError(null)
          try {
            const result = await musicService.remove(music.id)
            if (!result.success) {
              setError(result.error || t('music_library.errors.failed_to_delete'))
            } else {
              setSuccess(t('music_library.feedback.delete_success', { title: music.title }))
              await mutate()
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : t('music_library.errors.failed_to_delete'))
          } finally {
            setActionLoading(false)
          }
        }
      )
    },
    [t, openConfirm, mutate],
  )

  const handleAdd = useCallback(() => {
    setModalState({ mode: 'add' })
  }, [])

  const handleSuggest = useCallback(() => {
    setModalState({ mode: 'suggest' })
  }, [])

  const handleModalSuccess = useCallback(async () => {
    setModalState({ mode: null })
    await mutate()
  }, [mutate])

  const handleModalClose = useCallback(() => {
    setModalState({ mode: null })
  }, [])

  // Loading skeleton
  if (isLoading && musicList.length === 0) {
    return (
      <div className="min-h-screen bg-base-100">
        <div className="bg-base-200 border-b border-base-300">
          <div className="container mx-auto max-w-7xl px-4 py-6">
            <div className="h-10 w-48 bg-base-300 rounded animate-pulse" />
          </div>
        </div>
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="h-24 bg-base-200 rounded-lg animate-pulse mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-base-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-balance">{t('music_library.page_title')}</h1>
            <div className="flex gap-2 w-full sm:w-auto">
              {user?.isHost && (
                <button
                  onClick={handleAdd}
                  className="btn btn-primary flex-1 sm:flex-none"
                  disabled={actionLoading}
                >
                  {t('music_library.add_song')}
                </button>
              )}
              {isAuthenticated ? (
                <button
                  onClick={handleSuggest}
                  className="btn btn-secondary flex-1 sm:flex-none"
                  disabled={actionLoading}
                >
                  {t('music_library.suggest_song')}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login?redirect=/music')}
                  className="btn btn-secondary flex-1 sm:flex-none"
                >
                  {t('music_library.suggest_song')}
                </button>
              )}
            </div>
          </div>

          {/* Suggested songs button - hosts only */}
          {user?.isHost && suggestedCount > 0 && (
            <button
              onClick={() => void openSuggestedModal()}
              className="btn btn-warning btn-sm gap-2"
            >
              {t('music_library.suggested_songs')}
              <span className="badge badge-sm">{suggestedCount}</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      <PageAlerts
        error={error || fetchError || null}
        success={success}
        onDismissError={clearError}
        onDismissSuccess={clearSuccess}
        className="container mx-auto max-w-7xl px-4 mt-4"
      />

      {/* Search & Filter */}
      <div className="container mx-auto max-w-7xl px-4 py-4">
        <MusicFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          genreFilter={genreFilter}
          onGenreChange={setGenreFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onClearFilters={handleClearFilters}
          genres={GENRES}
        />
      </div>

      {/* Music List */}
      <div className="container mx-auto max-w-7xl px-4 pb-8">
        {filteredAndSortedMusic.length === 0 ? (
          <MusicEmptyState hasFilters={!!searchTerm || !!genreFilter} isHost={user?.isHost || false} />
        ) : (
          <div className="space-y-2">
            {filteredAndSortedMusic.map((music) => (
              <MusicCard
                key={music.id}
                music={music}
                isHost={user?.isHost || false}
                isExpanded={expandedCardId === music.id}
                onDelete={handleDelete}
                onToggleExpand={user?.isHost ? handleToggleExpand : undefined}
                onQuickSave={user?.isHost ? handleQuickSave : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && totalPages > 1 && (
        <div className="container mx-auto max-w-7xl px-4 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 border-t border-base-300">
            {/* Page size selector */}
            <div className="flex items-center gap-2 text-sm text-base-content/60">
              <span>{t('common.show')}</span>
              <select
                className="select select-sm select-bordered"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {t('common.of_total', { total: meta.total })}
              </span>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  disabled={page === 0}
                  onClick={() => setPage(0)}
                >
                  <ChevronsLeft className="size-4" />
                </button>
                <button
                  className="join-item btn btn-sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                </button>
              </div>

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

              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  disabled={!meta.hasMore}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </button>
                <button
                  className="join-item btn btn-sm"
                  disabled={!meta.hasMore}
                  onClick={() => setPage(totalPages - 1)}
                >
                  <ChevronsRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Music Modal */}
      {modalState.mode === 'add' && (
        <MusicModal
          mode="add"
          existingSongs={musicList}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          setError={setError}
          setSuccess={setSuccess}
        />
      )}

      {/* Suggest Song Modal */}
      {modalState.mode === 'suggest' && (
        <MusicModal
          mode="suggest"
          existingSongs={musicList}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          setError={setError}
          setSuccess={setSuccess}
        />
      )}


      {/* Suggested Songs Review Modal */}
      {suggestedModalOpen && (
        <dialog className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) closeSuggestedModal() }}>
          <div className="modal-box max-w-2xl max-h-[80vh]">
            <h3 className="font-bold text-lg mb-4">{t('music_library.suggested_songs')}</h3>
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeSuggestedModal}>X</button>
            {suggestedLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg" />
              </div>
            ) : suggestedSongs.length === 0 ? (
              <p className="text-base-content/60 text-center py-8">{t('music_library.no_suggested')}</p>
            ) : (
              <div className="space-y-3 overflow-y-auto">
                {suggestedSongs.map((music) => (
                  <div key={music.id} className="card bg-base-200">
                    <div className="card-body p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{music.title}</p>
                          <p className="text-sm text-base-content/70">{music.artist}</p>
                          {music.genre && <span className="badge badge-sm badge-outline mt-1">{music.genre}</span>}
                          {music.description && <p className="text-xs text-base-content/50 mt-1 line-clamp-2">{music.description}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            className="btn btn-success btn-sm"
                            disabled={actionLoading}
                            onClick={() => void handleApprove(music)}
                          >
                            {t('common.approve')}
                          </button>
                          <button
                            className="btn btn-error btn-sm"
                            disabled={actionLoading}
                            onClick={() => handleReject(music)}
                          >
                            {t('common.reject')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </dialog>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        variant={confirmVariant}
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />
    </div>
  )
}

export default MusicPage
