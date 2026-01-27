/**
 * Music Library Page
 * Public page for browsing music catalog
 * Hosts can add, edit, delete. Users can browse.
 * Route: /music
 */

import { useCallback, useMemo, useState } from 'react'
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
  MusicEmptyState,
  MusicFilters,
  MusicModal,
  MusicTableRow,
  SuccessAlert,
} from '../components'
import { filterAndSortMusic, formatDuration } from '../lib/musicUtils'
import { GENRES } from '../lib/musicConstants'

type SortBy = 'title' | 'artist' | 'date'
type StatusFilter = 'all' | 'approved' | 'suggested'

interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
  variant: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
}

const INITIAL_CONFIRM_STATE: ConfirmState = {
  isOpen: false,
  title: '',
  message: '',
  variant: 'default',
  onConfirm: () => {},
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

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSuggestModal, setShowSuggestModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMusic, setEditingMusic] = useState<MusicResponseDto | null>(null)

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<ConfirmState>(INITIAL_CONFIRM_STATE)

  const closeConfirm = useCallback(() => {
    setConfirmState(INITIAL_CONFIRM_STATE)
  }, [])

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
    setEditingMusic(music)
    setShowEditModal(true)
  }, [])

  const handleApprove = useCallback(
    (music: MusicResponseDto) => {
      setConfirmState({
        isOpen: true,
        title: t('common.approve'),
        message: t('music_library.feedback.approve_confirm', { title: music.title, artist: music.artist }),
        variant: 'default',
        onConfirm: async () => {
          closeConfirm()
          setActionLoading(true)
          setError(null)
          try {
            const result = await musicService.update(music.id, { status: 'APPROVED' })
            if (!result.success) {
              setError(result.error ||t('music_library.errors.failed_to_approve'))
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
      })
    },
    [t, closeConfirm, mutate],
  )

  const handleReject = useCallback(
    (music: MusicResponseDto) => {
      setConfirmState({
        isOpen: true,
        title: t('common.reject'),
        message: t('music_library.feedback.reject_confirm', { title: music.title, artist: music.artist }),
        variant: 'destructive',
        onConfirm: async () => {
          closeConfirm()
          setActionLoading(true)
          setError(null)
          try {
            const result = await musicService.remove(music.id)
            if (!result.success) {
              setError(result.error ||t('music_library.errors.failed_to_reject'))
            } else {
              setSuccess(t('music_library.feedback.reject_success', { title: music.title }))
              await mutate()
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : t('music_library.errors.failed_to_reject'))
          } finally {
            setActionLoading(false)
          }
        },
      })
    },
    [t, closeConfirm, mutate],
  )

  const handleDelete = useCallback(
    (music: MusicResponseDto) => {
      setConfirmState({
        isOpen: true,
        title: t('common.delete'),
        message: t('music_library.feedback.delete_confirm', { title: music.title, artist: music.artist }),
        variant: 'destructive',
        onConfirm: async () => {
          closeConfirm()
          setActionLoading(true)
          setError(null)
          try {
            const result = await musicService.remove(music.id)
            if (!result.success) {
              setError(result.error ||t('music_library.errors.failed_to_delete'))
            } else {
              setSuccess(t('music_library.feedback.delete_success', { title: music.title }))
              await mutate()
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : t('music_library.errors.failed_to_delete'))
          } finally {
            setActionLoading(false)
          }
        },
      })
    },
    [t, closeConfirm, mutate],
  )

  const handleAdd = useCallback(() => {
    setShowAddModal(true)
  }, [])

  const handleSuggest = useCallback(() => {
    setShowSuggestModal(true)
  }, [])

  const handleModalSuccess = useCallback(async () => {
    setShowAddModal(false)
    setShowSuggestModal(false)
    setShowEditModal(false)
    setEditingMusic(null)
    await mutate()
  }, [mutate])

  const handleEditClose = useCallback(() => {
    setShowEditModal(false)
    setEditingMusic(null)
  }, [])

  if (isLoading && musicList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-4xl font-bold">{t('music_library.page_title')}</h1>
            <div className="flex gap-2">
              {user?.isHost && (
                <button
                  onClick={handleAdd}
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {t('music_library.add_song')}
                </button>
              )}
              {isAuthenticated && (
                <button
                  onClick={handleSuggest}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  {t('music_library.suggest_song')}
                </button>
              )}
              {!isAuthenticated && (
                <button
                  onClick={() => navigate('/login?redirect=/music')}
                  className="btn btn-secondary"
                >
                  {t('music_library.suggest_song')}
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 flex-wrap" role="tablist">
            <button
              onClick={() => setStatusFilter('approved')}
              className={`tab ${statusFilter === 'approved' ? 'tab-active' : ''}`}
              role="tab"
              aria-selected={statusFilter === 'approved'}
            >
              {t('music_library.tabs.approved')}
            </button>
            <button
              onClick={() => setStatusFilter('suggested')}
              className={`tab ${statusFilter === 'suggested' ? 'tab-active' : ''}`}
              role="tab"
              aria-selected={statusFilter === 'suggested'}
            >
              {t('music_library.tabs.suggested')}
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`tab ${statusFilter === 'all' ? 'tab-active' : ''}`}
              role="tab"
              aria-selected={statusFilter === 'all'}
            >
              {t('music_library.tabs.all')}
            </button>
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

      {/* Music Table */}
      <div className="container mx-auto max-w-7xl px-4 pb-8">
        {filteredAndSortedMusic.length > 0 ? (
          <div className="overflow-x-auto bg-base-200 rounded-lg shadow">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="bg-base-300">
                  <th className="text-base">{t('common.form_labels.title')}</th>
                  <th className="text-base">{t('common.form_labels.artist')}</th>
                  <th className="text-base hidden sm:table-cell">{t('common.form_labels.genre')}</th>
                  <th className="text-base hidden sm:table-cell">{t('music_library.table.duration')}</th>
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
                    formatDuration={formatDuration}
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
        ) : (
          <MusicEmptyState hasFilters={!!searchTerm || !!genreFilter} isHost={user?.isHost || false} />
        )}
      </div>

      {/* Add Music Modal */}
      {showAddModal && (
        <MusicModal
          mode="add"
          existingSongs={musicList}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { void handleModalSuccess() }}
          setError={setError}
          setSuccess={setSuccess}
        />
      )}

      {/* Suggest Song Modal */}
      {showSuggestModal && (
        <MusicModal
          mode="suggest"
          existingSongs={musicList}
          onClose={() => setShowSuggestModal(false)}
          onSuccess={() => { void handleModalSuccess() }}
          setError={setError}
          setSuccess={setSuccess}
        />
      )}

      {/* Edit Music Modal */}
      {showEditModal && editingMusic && (
        <MusicModal
          mode="edit"
          music={editingMusic}
          existingSongs={musicList}
          onClose={handleEditClose}
          onSuccess={() => { void handleModalSuccess() }}
          setError={setError}
          setSuccess={setSuccess}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        loading={actionLoading}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  )
}

export default MusicPage
