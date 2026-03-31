import type {JamResponseDto, ScheduleResponseDto, ScheduleStatus} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useCallback, useEffect, useMemo, useState} from "react";
import {registrationService, scheduleService, musicService} from "../../services";
import {Alert, ConfirmDialog, EmptyState, Modal, ModalFooter} from '../../components';
import {HostMusicianRegistrationModal} from "../../components/schedule";
import {ScheduleCollapsibleCard} from "../../components/schedule/ScheduleCollapsibleCard";
import {MusicianProfileModal} from "../../components/MusicianProfileModal";
import {Search, X, ListMusic} from "lucide-react";
import {hasCoreBand} from "../../utils/scheduleUtils";

/**
 * Schedule Tab Component - Full management with nested registrations
 * Similar to jam detail page view but with additional management controls
 */
export function ScheduleTab({jam, onReload}: { jam: JamResponseDto; onReload: () => void }) {
    const {t} = useTranslation()
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
    const [error, setError] = useState<string | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedMusicId, setSelectedMusicId] = useState('')
    const [showHostRegistrationModal, setShowHostRegistrationModal] = useState(false)
    const [selectedScheduleForRegistration, setSelectedScheduleForRegistration] = useState<ScheduleResponseDto | null>(null)
    const [selectedMusicianId, setSelectedMusicianId] = useState<string | null>(null)
    const [rawSearch, setRawSearch] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'needs_musicians' | 'complete'>('all')
    const [success, setSuccess] = useState<string | null>(null)
    const [confirmAction, setConfirmAction] = useState<{
        title: string; message: string; onConfirm: () => Promise<void>
    } | null>(null)

    // Per-operation loading helpers
    const startLoading = useCallback((id: string) =>
        setLoadingIds(prev => new Set(prev).add(id)), [])
    const stopLoading = useCallback((id: string) =>
        setLoadingIds(prev => { const next = new Set(prev); next.delete(id); return next }), [])
    const isAnyLoading = loadingIds.size > 0

    // Debounce search input (200ms)
    useEffect(() => {
        const timer = setTimeout(() => setSearchQuery(rawSearch), 200)
        return () => clearTimeout(timer)
    }, [rawSearch])

    const { sortedSchedules, nonSuggestedSchedules, suggestedSchedules } = useMemo(() => {
        const sorted = [...(jam.schedules || [])].sort((a, b) => a.order - b.order)
        return {
            sortedSchedules: sorted,
            nonSuggestedSchedules: sorted.filter(s => s.status !== 'SUGGESTED'),
            suggestedSchedules: sorted.filter(s => s.status === 'SUGGESTED'),
        }
    }, [jam.schedules])

    // Filtered schedules
    const { filteredNonSuggested, filteredSuggested, needsCount, completeCount, totalCount } = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()

        const matchesSearch = (s: ScheduleResponseDto) => {
            if (!query) return true
            const title = s.music?.title?.toLowerCase() || ''
            const artist = s.music?.artist?.toLowerCase() || ''
            const musicians = s.registrations?.map(r => r.musician?.name?.toLowerCase() || '').join(' ') || ''
            return title.includes(query) || artist.includes(query) || musicians.includes(query)
        }

        const matchesFilter = (s: ScheduleResponseDto) => {
            if (statusFilter === 'all') return true
            if (statusFilter === 'needs_musicians') return !hasCoreBand(s)
            if (statusFilter === 'complete') return hasCoreBand(s)
            return true
        }

        const allNonSuggested = nonSuggestedSchedules.filter(s => matchesSearch(s) && matchesFilter(s))
        const allSuggested = suggestedSchedules.filter(matchesSearch)

        // Counts for filter chips (unfiltered, search-only)
        const searchedNonSuggested = nonSuggestedSchedules.filter(matchesSearch)
        const complete = searchedNonSuggested.filter(hasCoreBand).length
        const needs = searchedNonSuggested.length - complete

        const total = searchedNonSuggested.length + allSuggested.length

        return { filteredNonSuggested: allNonSuggested, filteredSuggested: allSuggested, needsCount: needs, completeCount: complete, totalCount: total }
    }, [nonSuggestedSchedules, suggestedSchedules, searchQuery, statusFilter])

    // Build lookup: musicId -> { jamMusicId, notes }
    const jamMusicMap = useMemo(() => {
        const map = new Map<string, { id: string; notes?: string | null }>()
        for (const jm of jam.jamMusics || []) {
            map.set(jm.musicId, { id: jm.id, notes: jm.notes })
        }
        return map
    }, [jam.jamMusics])

    // Available songs for add-song modal (not yet scheduled)
    const availableSongs = useMemo(() => {
        const scheduledMusicIds = new Set((jam.schedules || []).map(s => s.musicId))
        return (jam.jamMusics || []).filter(jm => !scheduledMusicIds.has(jm.musicId))
    }, [jam.jamMusics, jam.schedules])

    const handleSaveNotes = useCallback((jamMusicId: string, notes: string) => {
        void (async () => {
            startLoading(jamMusicId)
            setError(null)
            try {
                await musicService.updateJamMusic(jamMusicId, jam.id, { notes })
                setSuccess(t('jam_management.schedule.notes_saved', 'Notes saved'))
                onReload()
            } catch (err) {
                setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
            } finally {
                stopLoading(jamMusicId)
            }
        })()
    }, [jam.id, onReload, t, startLoading, stopLoading])

    // Handle schedule status change
    const handleStatusChange = useCallback((scheduleId: string, newStatus: string) => {
        void (async () => {
            let order: number | undefined

            // If approving a suggested schedule, set order to last position
            if (newStatus === 'SCHEDULED') {
                const active = sortedSchedules.filter(s => s.status !== 'SUGGESTED')
                const maxOrder = active.length > 0
                    ? Math.max(...active.map(s => s.order))
                    : 0
                order = maxOrder + 1
            }

            startLoading(scheduleId)
            setError(null)
            try {
                await scheduleService.update(scheduleId, { status: newStatus as ScheduleStatus, order })
                setSuccess(t('jam_management.schedule.status_updated', 'Status updated'))
                onReload()
            } catch (err) {
                setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
            } finally {
                stopLoading(scheduleId)
            }
        })()
    }, [sortedSchedules, onReload, t, startLoading, stopLoading])

    // Handle schedule deletion (via confirm dialog)
    const handleDeleteSchedule = useCallback((scheduleId: string) => {
        const schedule = sortedSchedules.find(s => s.id === scheduleId)
        setConfirmAction({
            title: t('jam_management.schedule.confirm_delete_title', 'Delete song'),
            message: schedule?.music?.title
                ? t('jam_management.schedule.confirm_delete_named', { name: schedule.music.title })
                : t('jam_management.schedule.confirm_delete'),
            onConfirm: async () => {
                startLoading(scheduleId)
                setError(null)
                try {
                    await scheduleService.remove(scheduleId)
                    setSuccess(t('jam_management.schedule.deleted_success', 'Song removed from schedule'))
                    onReload()
                } catch (err) {
                    setError(err instanceof Error ? err.message : t('errors.failed_to_remove'))
                } finally {
                    stopLoading(scheduleId)
                }
            },
        })
    }, [sortedSchedules, onReload, t, startLoading, stopLoading])

    // Handle add schedule
    const handleAddSchedule = useCallback(() => {
        if (!selectedMusicId) {
            setError(t('host_songs.select_song_error'))
            return
        }
        void (async () => {
            startLoading('add-schedule')
            setError(null)
            try {
                const nextOrder = sortedSchedules.length > 0
                    ? Math.max(...sortedSchedules.map(s => s.order)) + 1
                    : 1
                await scheduleService.create({
                    jamId: jam.id,
                    musicId: selectedMusicId,
                    order: nextOrder,
                    status: 'SCHEDULED',
                })
                setShowAddModal(false)
                setSelectedMusicId('')
                setSuccess(t('jam_management.schedule.added_success', 'Song added to schedule'))
                onReload()
            } catch (err) {
                setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
            } finally {
                stopLoading('add-schedule')
            }
        })()
    }, [selectedMusicId, sortedSchedules, jam.id, onReload, t, startLoading, stopLoading])

    // Handle reject registration (via confirm dialog)
    const handleRejectRegistration = useCallback((registrationId: string) => {
        setConfirmAction({
            title: t('jam_management.schedule.confirm_reject_title', 'Remove registration'),
            message: t('jam_management.schedule.confirm_reject_reg'),
            onConfirm: async () => {
                startLoading(registrationId)
                setError(null)
                try {
                    await registrationService.remove(registrationId)
                    setSuccess(t('jam_management.schedule.registration_removed', 'Registration removed'))
                    onReload()
                } catch (err) {
                    setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
                } finally {
                    stopLoading(registrationId)
                }
            },
        })
    }, [onReload, t, startLoading, stopLoading])

    // Handle approve registration - update registration status to APPROVED
    const handleApproveRegistration = useCallback((registrationId: string) => {
        if (!jam?.id) return

        void (async () => {
            startLoading(registrationId)
            setError(null)

            try {
                await registrationService.update(registrationId, {status: 'APPROVED'})
                setSuccess(t('jam_management.schedule.registration_approved', 'Musician approved'))
                onReload()
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : t('errors.failed_to_execute_action')
                setError(errorMessage)
            } finally {
                stopLoading(registrationId)
            }
        })()
    }, [jam?.id, onReload, t, startLoading, stopLoading])

    // Handle approve all pending registrations for a schedule
    const handleApproveAllRegistrations = useCallback((scheduleId: string) => {
        if (!jam?.id) return
        const schedule = sortedSchedules.find(s => s.id === scheduleId)
        if (!schedule?.registrations) return

        const pendingRegs = schedule.registrations.filter(r => r.status === 'PENDING')
        if (pendingRegs.length === 0) return

        void (async () => {
            startLoading(scheduleId)
            setError(null)

            try {
                await Promise.all(pendingRegs.map(r => registrationService.update(r.id, {status: 'APPROVED'})))
                setSuccess(t('schedule.all_registrations_approved', 'All musicians approved'))
                onReload()
            } catch (err) {
                setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
            } finally {
                stopLoading(scheduleId)
            }
        })()
    }, [jam?.id, sortedSchedules, onReload, t, startLoading, stopLoading])

    const handleAddMusician = useCallback((scheduleId: string) => {
        const schedule = sortedSchedules.find(s => s.id === scheduleId)
        if (schedule) {
            setSelectedScheduleForRegistration(schedule)
            setShowHostRegistrationModal(true)
        }
    }, [sortedSchedules])

    const isCardLoading = useCallback((schedule: ScheduleResponseDto) => {
        if (loadingIds.has(schedule.id)) return true
        return schedule.registrations?.some(r => loadingIds.has(r.id)) ?? false
    }, [loadingIds])

    const renderCard = (schedule: ScheduleResponseDto, isSuggested: boolean) => {
        const jm = jamMusicMap.get(schedule.musicId)
        return <ScheduleCollapsibleCard
            key={schedule.id}
            schedule={schedule}
            loading={isCardLoading(schedule)}
            isSuggested={isSuggested}
            defaultExpanded={schedule.status === 'IN_PROGRESS'}
            notes={jm?.notes}
            jamMusicId={jm?.id}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteSchedule}
            onApproveRegistration={handleApproveRegistration}
            onRejectRegistration={handleRejectRegistration}
            onDeleteRegistration={handleRejectRegistration}
            onAddMusician={handleAddMusician}
            onMusicianClick={setSelectedMusicianId}
            onSaveNotes={handleSaveNotes}
            onApproveAllRegistrations={handleApproveAllRegistrations}
        />
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-bold">{t('jam_management.schedule.title')}</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary btn-sm"
                    disabled={loadingIds.has('add-schedule')}
                >
                    {t('jam_management.schedule.add_new_song')}
                </button>
            </div>

            {/* Alerts */}
            <Alert type="error" message={error} onDismiss={() => setError(null)} />
            <Alert type="success" message={success} onDismiss={() => setSuccess(null)} autoHide autoHideDelay={3000} />

            {/* Search + Filter Toolbar */}
            {sortedSchedules.length > 3 && (
                <div className="space-y-2">
                    <div className="join w-full">
                        <div className="join-item flex items-center px-2 bg-base-200">
                            <Search className="size-4 text-base-content/40" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('schedule.search_placeholder', 'Search songs or musicians...')}
                            className="input input-sm input-bordered join-item flex-1"
                            value={rawSearch}
                            onChange={(e) => setRawSearch(e.target.value)}
                            aria-label={t('schedule.search_placeholder', 'Search songs or musicians...')}
                        />
                        {rawSearch && (
                            <button className="btn btn-sm btn-ghost join-item" onClick={() => { setRawSearch(''); setSearchQuery('') }}>
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                        <button
                            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline btn-primary'}`}
                            onClick={() => setStatusFilter('all')}
                        >
                            {t('common.all', 'All')} ({totalCount})
                        </button>
                        <button
                            className={`btn btn-sm ${statusFilter === 'needs_musicians' ? 'btn-warning' : 'btn-outline btn-warning'}`}
                            onClick={() => setStatusFilter('needs_musicians')}
                        >
                            {t('schedule.needs_musicians', 'Needs musicians')} ({needsCount})
                        </button>
                        <button
                            className={`btn btn-sm ${statusFilter === 'complete' ? 'btn-success' : 'btn-outline btn-success'}`}
                            onClick={() => setStatusFilter('complete')}
                        >
                            {t('schedule.band_complete', 'Band complete')} ({completeCount})
                        </button>
                    </div>
                </div>
            )}

            {/* Schedule List */}
            {sortedSchedules.length > 0 ? (
                <div className="space-y-3">
                    {/* Suggested Schedules */}
                    {filteredSuggested.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 py-2 text-xs font-bold text-base-content/70 uppercase tracking-wide">
                                <span>{t('jam_management.schedule.suggested_songs')} ({filteredSuggested.length})</span>
                                <div className="flex-1 border-t border-base-300/50" />
                            </div>
                            <div className="space-y-2">
                                {filteredSuggested.map((schedule) => renderCard(schedule, true))}
                            </div>
                        </div>
                    )}

                    {/* Scheduled/Active Songs */}
                    {filteredNonSuggested.length > 0 && (
                        <div>
                            {filteredSuggested.length > 0 && (
                                <div className="flex items-center gap-2 py-2 text-xs font-bold text-base-content/70 uppercase tracking-wide">
                                    <span>{t('jam_management.schedule.title')} ({filteredNonSuggested.length})</span>
                                    <div className="flex-1 border-t border-base-300/50" />
                                </div>
                            )}
                            <div className="space-y-2">
                                {filteredNonSuggested.map((schedule) => renderCard(schedule, false))}
                            </div>
                        </div>
                    )}

                    {/* No results after filtering */}
                    {filteredNonSuggested.length === 0 && filteredSuggested.length === 0 && (
                        <div className="text-center py-6 space-y-2">
                            <p className="text-sm text-base-content/50">
                                {t('common.no_results', 'No results found')}
                            </p>
                            {(searchQuery || statusFilter !== 'all') && (
                                <button
                                    className="btn btn-sm btn-ghost text-primary"
                                    onClick={() => { setRawSearch(''); setSearchQuery(''); setStatusFilter('all') }}
                                >
                                    {t('common.clear_filters', 'Clear filters')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState
                    icon="🎵"
                    title={t('jam_management.schedule.no_schedule_yet')}
                    description={
                        (jam._count?.schedules ?? jam.schedules?.length ?? 0) > 0
                            ? t('jam_management.schedule.add_entry_hint')
                            : t('jam_management.schedule.add_songs_first')
                    }
                    action={
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary btn-sm"
                            disabled={loadingIds.has('add-schedule')}
                        >
                            <ListMusic className="size-4" />
                            {t('jam_management.schedule.add_new_song')}
                        </button>
                    }
                    className="card bg-base-200 p-4"
                />
            )}

            {/* Host Musician Registration Modal */}
            {selectedScheduleForRegistration && (
                <HostMusicianRegistrationModal
                    schedule={selectedScheduleForRegistration}
                    isOpen={showHostRegistrationModal}
                    onClose={() => {
                        setShowHostRegistrationModal(false)
                        setSelectedScheduleForRegistration(null)
                    }}
                    onSuccess={() => {
                        setShowHostRegistrationModal(false)
                        setSelectedScheduleForRegistration(null)
                        setSuccess(t('jam_management.schedule.musicians_registered', 'Musicians registered'))
                        onReload()
                    }}
                />
            )}

            {/* Musician Profile Modal */}
            {selectedMusicianId && (
                <MusicianProfileModal
                    musicianId={selectedMusicianId}
                    onClose={() => setSelectedMusicianId(null)}
                />
            )}

            {/* Add Schedule Modal */}
            {showAddModal && (
                <Modal
                    isOpen={showAddModal}
                    onClose={() => { setShowAddModal(false); setError(null); setSelectedMusicId('') }}
                    title={t('jam_management.schedule.add_entry_modal')}
                    size="sm"
                    footer={
                        <ModalFooter
                            onCancel={() => { setShowAddModal(false); setError(null); setSelectedMusicId('') }}
                            onSubmit={handleAddSchedule}
                            submitLabel={t('jam_management.schedule.add_to_schedule')}
                            submitting={loadingIds.has('add-schedule')}
                            submitDisabled={!selectedMusicId}
                        />
                    }
                >
                    <div className="form-control mb-4">
                        <label className="label" htmlFor="music-select">
                            <span className="label-text">{t('jam_management.schedule.song_label')}</span>
                        </label>
                        <select
                            id="music-select"
                            value={selectedMusicId}
                            onChange={(e) => setSelectedMusicId(e.target.value)}
                            className="select select-bordered"
                            aria-label={t('jam_management.schedule.song_label')}
                        >
                            <option value="">{t('jam_management.schedule.select_song')}</option>
                            {availableSongs.map((jm) => (
                                <option key={jm.id} value={jm.musicId}>
                                    {jm.music?.title || t('common.unknown')} - {jm.music?.artist || t('common.unknown')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-control mb-4">
                        <label className="label" htmlFor="order-input">
                            <span className="label-text">{t('jam_management.schedule.order_label')}</span>
                        </label>
                        <input
                            id="order-input"
                            type="text"
                            value={t('jam_management.schedule.order_auto', {count: sortedSchedules.length + 1})}
                            className="input input-bordered"
                            disabled
                            aria-label={t('jam_management.schedule.order_label')}
                        />
                    </div>

                    <Alert type="error" message={error} className="mb-4" />
                </Modal>
            )}

            {/* Confirm Dialog for destructive actions */}
            <ConfirmDialog
                isOpen={!!confirmAction}
                title={confirmAction?.title || ''}
                message={confirmAction?.message || ''}
                onConfirm={() => {
                    if (!confirmAction?.onConfirm) {
                        setConfirmAction(null)
                        return
                    }
                    void confirmAction.onConfirm().finally(() => setConfirmAction(null))
                }}
                onCancel={() => setConfirmAction(null)}
                variant="destructive"
                loading={isAnyLoading}
            />
        </div>
    )
}
