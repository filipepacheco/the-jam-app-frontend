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
import { useAuth } from '../hooks'
import { musicService } from '../services'
import type { MusicResponseDto } from '../types/api.types'
import { API_ENDPOINTS } from '../lib/api/config'
import {
  ConfirmDialog,
  ErrorAlert,
  MusicCard,
  MusicEmptyState,
  MusicFilters,
  MusicModal,
  MusicTableRow,
  SuccessAlert,
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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [genreFilter, setGenreFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('approved')
  const [sortBy, setSortBy] = useState<SortBy>('title')

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
    setModalState({ mode: 'edit', editingMusic: music })
  }, [])

  const handleApprove = useCallback(
    (music: MusicResponseDto) => {
      openConfirm(
        t('common.approve'),
        t('music_library.feedback.approve_confirm', { title: music.title, artist: music.artist }),
        'default',
        async () => {
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
        }
      )
    },
    [t, openConfirm, mutate],
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
      <div className="container mx-auto max-w-7xl px-4 mt-4">
        {(error || swrError) && (
          <ErrorAlert
            message={error || swrError?.message || t('music_library.errors.failed_to_load')}
            onDismiss={() => setError(null)}
          />
        )}
        {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />}
      </div>

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
            {/* Mobile: Card Layout */}
            <div className="block lg:hidden space-y-2">
              {filteredAndSortedMusic.map((music) => (
                <MusicCard
                  key={music.id}
                  music={music}
                  isHost={user?.isHost || false}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onApprove={user?.isHost ? handleApprove : undefined}
                  onReject={user?.isHost ? handleReject : undefined}
                />
              ))}
            </div>

            {/* Desktop: Table Layout */}
            <div className="hidden lg:block overflow-x-auto bg-base-200 rounded-lg shadow">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="bg-base-300">
                    <th className="text-base">{t('common.form_labels.title')}</th>
                    <th className="text-base">{t('common.form_labels.artist')}</th>
                    <th className="text-base">{t('common.form_labels.genre')}</th>
                    <th className="text-base">{t('music_library.table.duration')}</th>
                    <th className="text-base">{t('music_library.table.link')}</th>
                    <th className="text-base">{t('music_library.table.status')}</th>
                    <th className="text-base">{t('music_library.table.musicians_needed')}</th>
                    <th className="text-base">{t('music_library.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedMusic.map((music) => (
                    <MusicTableRow
                      key={music.id}
                      music={music}
                      isHost={user?.isHost || false}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onApprove={user?.isHost ? handleApprove : undefined}
                      onReject={user?.isHost ? handleReject : undefined}
                    />
                  ))}
                </tbody>
              </table>
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
