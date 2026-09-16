/**
 * Music Library Page
 * Public page for browsing music catalog
 * Hosts can add, edit, delete. Users can browse.
 * Route: /music
 */

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, useMusicLibraryController, usePageAlerts } from '../hooks'
import type { MusicResponseDto, UpdateMusicDto } from '../types/api.types'
import type { MusicLibraryMutationPort, MusicLibraryQueryPort } from '../lib/music/musicLibraryController'
import { translationKey } from '../lib/i18n/translationKeys'
import {
  Action,
  Alert,
  Badge,
  ConfirmDialog,
  EmptyState,
  LoadingState,
  MusicCard,
  MusicEmptyState,
  MusicFilters,
  MusicModal,
  OverlayModal,
  PageAlerts,
} from '../components'
import { GENRES } from '../lib/musicConstants'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { MusicDataCard, MusicStatusIndicator } from '../components/music/MusicDataDisplay'

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const
type SortBy = 'title' | 'artist' | 'date'

interface MusicPageProps {
  queryPort?: MusicLibraryQueryPort
  mutationPort?: MusicLibraryMutationPort
}

export function MusicPage({ queryPort, mutationPort }: MusicPageProps = {}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuth()

  const {state: musicState, commands: musicCommands} = useMusicLibraryController(
    Boolean(user?.isHost),
    queryPort,
    mutationPort,
  )
  const {
    approved, query, suggestedCount, suggestedList, suggestedOpen, visibleMusic,
    pendingEntityIds, pendingConfirmation, modalIntent,
  } = musicState
  const musicList = approved.items
  const meta = approved.meta
  const page = query.page
  const pageSize = query.pageSize
  const isLoading = approved.status === 'loading'
  const totalPages = meta ? Math.ceil(meta.total / pageSize) : 0
  const openSuggestedModal = musicCommands.openSuggested
  const closeSuggestedModal = musicCommands.closeSuggested
  const suggestedSongs = suggestedList.items
  const suggestedLoading = suggestedList.status === 'loading'

  const {error, setError, clearError, success, setSuccess, clearSuccess} = usePageAlerts()

  // Filter states
  const searchTerm = query.searchTerm
  const genreFilter = query.genre
  const sortBy: SortBy = query.sort

  // Quick edit expanded card
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  const handleConfirm = useCallback(async () => {
    const confirmation = pendingConfirmation
    const outcome = await musicCommands.confirmPending()
    if (outcome.code === 'success' && confirmation) {
      const key = confirmation.kind === 'reject' ? 'reject_success' : 'delete_success'
      setSuccess(t(translationKey('music_library.feedback', key), {title: confirmation.title}))
    } else if (outcome.code === 'failure' || outcome.code === 'refresh_failure') {
      const fallback = confirmation?.kind === 'reject' ? 'failed_to_reject' : 'failed_to_delete'
      const refreshMessage = outcome.code === 'failure' && outcome.refreshError
        ? ` · ${outcome.refreshError.message || t('music_library.errors.failed_to_load')}`
        : ''
      setError(`${outcome.error.message || t(translationKey('music_library.errors', fallback))}${refreshMessage}`)
    }
  }, [musicCommands, pendingConfirmation, setError, setSuccess, t])

  const handleClearFilters = useCallback(() => {
    musicCommands.clearFilters()
  }, [musicCommands])

  const handleToggleExpand = useCallback((musicId: string) => {
    setExpandedCardId((prev: string | null) => prev === musicId ? null : musicId)
  }, [])

  const handleQuickSave = useCallback(async (id: string, data: UpdateMusicDto): Promise<boolean> => {
    const outcome = await musicCommands.edit(id, data)
    if (outcome.code === 'success') {
      setExpandedCardId(null)
      setSuccess(t('music_library.feedback.update_success', {
        title: data.title || musicList.find((music) => music.id === id)?.title || '',
      }))
      return true
    }
    if (outcome.code === 'failure' || outcome.code === 'refresh_failure') {
      setError(outcome.error.message || t('music_library.errors.failed_to_update'))
    }
    return false
  }, [musicCommands, musicList, setError, setSuccess, t])

  const handleApprove = useCallback(
    async (music: MusicResponseDto) => {
      setError(null)
      const outcome = await musicCommands.approve(music)
      if (outcome.code === 'success') setSuccess(t('music_library.feedback.approve_success', {title: music.title}))
      else if (outcome.code === 'failure' || outcome.code === 'refresh_failure') {
        const refreshMessage = outcome.code === 'failure' && outcome.refreshError
          ? ` · ${outcome.refreshError.message || t('music_library.errors.failed_to_load')}`
          : ''
        setError(`${outcome.error.message || t('music_library.errors.failed_to_approve')}${refreshMessage}`)
      }
    },
    [musicCommands, setError, setSuccess, t],
  )

  const handleReject = useCallback(
    (music: MusicResponseDto) => {
      musicCommands.requestConfirmation('reject', music)
    },
    [musicCommands],
  )

  const handleDelete = useCallback(
    (music: MusicResponseDto) => {
      musicCommands.requestConfirmation('delete', music)
    },
    [musicCommands],
  )

  const handleAdd = useCallback(() => {
    musicCommands.openModal('add')
  }, [musicCommands])

  const handleSuggest = useCallback(() => {
    musicCommands.openModal('suggest')
  }, [musicCommands])

  const handleModalSuccess = useCallback(async () => {
    const outcome = await musicCommands.completeModal()
    if (outcome.code === 'refresh_failure') {
      setError(outcome.error.message || t('music_library.errors.failed_to_load'))
    }
  }, [musicCommands, setError, t])

  const handleModalClose = useCallback(() => {
    musicCommands.closeModal()
  }, [musicCommands])

  // Loading skeleton
  if (isLoading && musicList.length === 0) {
    return (
      <div className="min-h-screen bg-base-100 animate-pulse">
        <div className="bg-base-200 border-b border-base-300">
          <div className="container mx-auto max-w-7xl px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="skeleton h-9 w-48 rounded" />
              <div className="skeleton h-9 w-28 rounded hidden sm:block" />
            </div>
          </div>
        </div>
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="card bg-base-200 p-3 mb-4">
            <div className="flex gap-3">
              <div className="skeleton h-10 flex-1 rounded" />
              <div className="skeleton h-10 w-32 rounded hidden sm:block" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card bg-base-200 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-5 w-2/3 rounded" />
                    <div className="skeleton h-4 w-1/3 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="skeleton h-5 w-12 rounded-full" />
                    <div className="skeleton h-5 w-10 rounded-full" />
                  </div>
                </div>
              </div>
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
                <Action
                  onClick={handleAdd}
                  className="flex-1 sm:flex-none"
                  state="idle"
                >
                  {t('music_library.add_song')}
                </Action>
              )}
              {isAuthenticated ? (
                <Action
                  variant="secondary"
                  onClick={handleSuggest}
                  className="flex-1 sm:flex-none"
                  state="idle"
                >
                  {t('music_library.suggest_song')}
                </Action>
              ) : (
                <Action
                  variant="secondary"
                  onClick={() => navigate('/login?redirect=/music')}
                  className="flex-1 sm:flex-none"
                >
                  {t('music_library.suggest_song')}
                </Action>
              )}
            </div>
          </div>

          {/* Suggested songs button - hosts only */}
          {user?.isHost && suggestedCount.count > 0 && (
            <Action variant="secondary" onClick={() => void openSuggestedModal()} className="gap-2">
              {t('music_library.suggested_songs')}
              <Badge size="sm">{suggestedCount.count}</Badge>
            </Action>
          )}
        </div>
      </div>

      {/* Alerts */}
      <PageAlerts
        error={error}
        success={success}
        onDismissError={clearError}
        onDismissSuccess={clearSuccess}
        className="container mx-auto max-w-7xl px-4 mt-4"
      />
      {(approved.status === 'failed' || (user?.isHost && suggestedCount.status === 'failed')) && (
        <div className="container mx-auto max-w-7xl space-y-3 px-4 mt-4">
          {approved.status === 'failed' && (
            <Alert
              type="error"
              message={approved.error?.message || t('music_library.errors.failed_to_load')}
              action={(
                <Action variant="quiet" onClick={() => void musicCommands.refreshApproved()}>
                  {t('common.try_again')}
                </Action>
              )}
            />
          )}
          {user?.isHost && suggestedCount.status === 'failed' && (
            <Alert
              type="error"
              message={suggestedCount.error?.message || t('music_library.errors.failed_to_load')}
              action={(
                <Action variant="quiet" onClick={() => void musicCommands.refreshSuggestedCount()}>
                  {t('common.try_again')}
                </Action>
              )}
            />
          )}
        </div>
      )}

      {/* Search & Filter */}
      <div className="container mx-auto max-w-7xl px-4 py-4">
        <MusicFilters
          searchTerm={searchTerm}
          onSearchChange={musicCommands.setSearch}
          genreFilter={genreFilter}
          onGenreChange={musicCommands.setGenre}
          sortBy={sortBy}
          onSortChange={musicCommands.setSort}
          onClearFilters={handleClearFilters}
          genres={GENRES}
        />
      </div>

      {/* Music List */}
      <div className="container mx-auto max-w-7xl px-4 pb-8">
        <h2 className="sr-only">{t('music_library.results_heading')}</h2>
        {visibleMusic.length === 0 ? (
          <MusicEmptyState hasFilters={!!searchTerm || !!genreFilter} isHost={user?.isHost || false} />
        ) : (
          <div className="space-y-2">
            {visibleMusic.map((music) => (
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

      {/* Pagination.
          Documented exception: the page-size select, the page-number input, and
          the four join-item step buttons stay hand-rolled. Field always renders a
          label and Action always renders a full-size control, so these dense,
          label-free pagination controls have no canonical equivalent yet.
          See docs/design-system/jam-music-migration.md. */}
      {/* Pagination */}
      {meta && totalPages > 1 && (
        <div className="container mx-auto max-w-7xl px-4 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 border-t border-base-300">
            {/* Page size selector */}
            <div className="flex items-center gap-2 text-sm text-base-content/60">
              <span>{t('common.show')}</span>
              <select
                className="select select-sm select-bordered"
                aria-label={t('music_library.pagination.page_size')}
                value={pageSize}
                onChange={(e) => { void musicCommands.setPageSize(Number(e.target.value)) }}
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
                  aria-label={t('music_library.pagination.first')}
                  disabled={page === 0}
                  onClick={() => { void musicCommands.setPage(0) }}
                >
                  <ChevronsLeft className="size-4" aria-hidden="true" />
                </button>
                <button
                  className="join-item btn btn-sm"
                  aria-label={t('music_library.pagination.previous')}
                  disabled={page === 0}
                  onClick={() => { void musicCommands.setPage(page - 1) }}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="flex items-center gap-1 text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <input
                  type="number"
                  className="input input-sm input-bordered w-14 text-center"
                  aria-label={t('music_library.pagination.page_number')}
                  min={1}
                  max={totalPages}
                  value={page + 1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (val >= 1 && val <= totalPages) void musicCommands.setPage(val - 1)
                  }}
                />
                <span className="text-base-content/60">/ {totalPages}</span>
              </div>

              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  aria-label={t('music_library.pagination.next')}
                  disabled={!meta.hasMore}
                  onClick={() => { void musicCommands.setPage(page + 1) }}
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
                <button
                  className="join-item btn btn-sm"
                  aria-label={t('music_library.pagination.last')}
                  disabled={!meta.hasMore}
                  onClick={() => { void musicCommands.setPage(totalPages - 1) }}
                >
                  <ChevronsRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Music Modal */}
      {modalIntent?.kind === 'add' && (
        <MusicModal
          mode="add"
          existingSongs={[...musicList]}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          setError={setError}
          setSuccess={setSuccess}
        />
      )}

      {/* Suggest Song Modal */}
      {modalIntent?.kind === 'suggest' && (
        <MusicModal
          mode="suggest"
          existingSongs={[...musicList]}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          setError={setError}
          setSuccess={setSuccess}
        />
      )}


      {/* Suggested Songs Review Modal.
          This was a second, hand-rolled <dialog className="modal modal-open">
          that duplicated the overlay behaviour (backdrop dismissal, close
          control, scrollable body). It now uses the canonical OverlayModal,
          which also adds the focus trap and the escape-key dismissal. */}
      <OverlayModal
        isOpen={suggestedOpen}
        onDismiss={closeSuggestedModal}
        title={t('music_library.suggested_songs')}
        closeLabel={t('common.close')}
        size="lg"
      >
        {suggestedList.status === 'failed' && (
          <Alert
            type="error"
            message={suggestedList.error?.message || t('music_library.errors.failed_to_load')}
            className="mb-3"
            action={(
              <Action variant="quiet" onClick={() => void musicCommands.refreshSuggestedList()}>
                {t('common.try_again')}
              </Action>
            )}
          />
        )}
        {suggestedLoading && suggestedSongs.length === 0 ? (
          <LoadingState label={t('common.loading')} className="py-8" />
        ) : suggestedSongs.length === 0 && suggestedList.status !== 'failed' ? (
          <EmptyState kind="content" title={t('music_library.no_suggested')} />
        ) : suggestedSongs.length > 0 ? (
          <div className="space-y-3 overflow-y-auto">
            {suggestedSongs.map((music) => (
              <MusicDataCard key={music.id} music={music} density="comfortable">
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="ds-type-ui ds-wrap-user-content font-semibold">{music.title}</p>
                      <p className="ds-wrap-user-content text-sm text-base-content/70">{music.artist}</p>
                      {music.status === 'SUGGESTED' && (
                        <div className="mt-1"><MusicStatusIndicator status={music.status} /></div>
                      )}
                      {music.genre && <Badge size="sm" className="mt-1">{music.genre}</Badge>}
                      {music.description && <p className="ds-wrap-user-content mt-1 text-sm text-base-content/50">{music.description}</p>}
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:shrink-0">
                      <Action
                        state={pendingEntityIds.has(music.id) ? 'disabled' : 'idle'}
                        onClick={() => void handleApprove(music)}
                        className="w-full sm:w-auto"
                      >
                        {t('common.approve')}
                      </Action>
                      <Action
                        variant="destructive"
                        state={pendingEntityIds.has(music.id) ? 'disabled' : 'idle'}
                        onClick={() => handleReject(music)}
                        className="w-full sm:w-auto"
                      >
                        {t('common.reject')}
                      </Action>
                    </div>
                  </div>
              </MusicDataCard>
            ))}
          </div>
        ) : null}
      </OverlayModal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={pendingConfirmation !== null}
        title={pendingConfirmation?.kind === 'reject' ? t('common.reject') : t('common.delete')}
        message={pendingConfirmation?.kind === 'reject'
          ? t('music_library.feedback.reject_confirm', {title: pendingConfirmation.title, artist: pendingConfirmation.artist})
          : t('music_library.feedback.delete_confirm', {title: pendingConfirmation?.title, artist: pendingConfirmation?.artist})}
        variant="destructive"
        loading={pendingConfirmation ? pendingEntityIds.has(pendingConfirmation.musicId) : false}
        onConfirm={handleConfirm}
        onCancel={musicCommands.cancelConfirmation}
      />
    </div>
  )
}

export default MusicPage
