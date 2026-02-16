/**
 * Music Library Page
 * Public page for browsing music catalog
 * Hosts can add, edit, delete. Users can browse.
 * Route: /music
 */

import { useCallback, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import { useAuth, usePageAlerts } from '../hooks'
import { musicService } from '../services'
import type { MusicResponseDto, UpdateMusicDto } from '../types/api.types'
import { API_ENDPOINTS } from '../lib/api/config'
import {
  Alert,
  ConfirmDialog,
  MusicCard,
  MusicEmptyState,
  MusicFilters,
  MusicModal,
  PageAlerts,
} from '../components'
import { filterAndSortMusic } from '../lib/musicUtils'
import { GENRES } from '../lib/musicConstants'

type SortBy = 'title' | 'artist' | 'date'
type StatusFilter = 'all' | 'approved' | 'suggested'
type ModalMode = 'add' | 'edit' | 'suggest' | null

interface ModalState {
  mode: ModalMode
  editingMusic: MusicResponseDto | null
}

export function MusicPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuth()

  // SWR data fetching
  const {
    data: musicList = [],
    error: swrError,
    isLoading,
    mutate,
  } = useSWR<MusicResponseDto[]>(API_ENDPOINTS.music)

  const [actionLoading, setActionLoading] = useState(false)
  const {error, setError, clearError, success, setSuccess, clearSuccess} = usePageAlerts()

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [genreFilter, setGenreFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('suggested')
  const [sortBy, setSortBy] = useState<SortBy>('title')

  // Quick edit expanded card
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  // Modal state (single state object instead of multiple booleans)
  const [modalState, setModalState] = useState<ModalState>({
    mode: null,
    editingMusic: null,
  })

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
      status: statusFilter,
      searchTerm,
      genreFilter,
      sortBy,
    })
  }, [musicList, searchTerm, genreFilter, statusFilter, sortBy])

  const handleEdit = useCallback((music: MusicResponseDto) => {
    setExpandedCardId(null)
    setModalState({ mode: 'edit', editingMusic: music })
  }, [])

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
          await mutate()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('music_library.errors.failed_to_approve'))
      } finally {
        setActionLoading(false)
      }
    },
    [t, mutate, setError, setSuccess],
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
              await mutate()
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
    setModalState({ mode: 'add', editingMusic: null })
  }, [])

  const handleSuggest = useCallback(() => {
    setModalState({ mode: 'suggest', editingMusic: null })
  }, [])

  const handleModalSuccess = useCallback(async () => {
    setModalState({ mode: null, editingMusic: null })
    await mutate()
  }, [mutate])

  const handleModalClose = useCallback(() => {
    setModalState({ mode: null, editingMusic: null })
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

          {/* Status Filter Tabs */}
          <div className="flex gap-2 flex-wrap" role="tablist">
            {(['approved', 'suggested', 'all'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`tab ${statusFilter === filter ? 'tab-active' : ''}`}
                role="tab"
                aria-selected={statusFilter === filter}
              >
                {t(`music_library.tabs.${filter}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <PageAlerts
        error={error || swrError?.message || null}
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

      {/* Music List - Responsive: Cards on mobile, Table on desktop */}
      <div className="container mx-auto max-w-7xl px-4 pb-8">
        {filteredAndSortedMusic.length > 0 ? (
          <>
            {/* Card Layout - all screen sizes */}
            <div className="space-y-2">
              {filteredAndSortedMusic.map((music) => (
                <MusicCard
                  key={music.id}
                  music={music}
                  isHost={user?.isHost || false}
                  isExpanded={expandedCardId === music.id}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleExpand={user?.isHost ? handleToggleExpand : undefined}
                  onQuickSave={user?.isHost ? handleQuickSave : undefined}
                  onApprove={user?.isHost ? handleApprove : undefined}
                  onReject={user?.isHost ? handleReject : undefined}
                />
              ))}
            </div>
          </>
        ) : (
          <MusicEmptyState hasFilters={!!searchTerm || !!genreFilter} isHost={user?.isHost || false} />
        )}
      </div>

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

      {/* Edit Music Modal */}
      {modalState.mode === 'edit' && modalState.editingMusic && (
        <MusicModal
          mode="edit"
          music={modalState.editingMusic}
          existingSongs={musicList}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          setError={setError}
          setSuccess={setSuccess}
        />
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
