import type {JamResponseDto, ScheduleResponseDto} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useCallback, useEffect, useState} from "react";
import {Action, Alert, ConfirmDialog, EmptyState, Field, IconAction, Modal, ModalFooter, MusicModal} from '../../components';
import {HostMusicianRegistrationModal} from "../../components/schedule";
import {ScheduleCollapsibleCard} from "../../components/schedule/ScheduleCollapsibleCard";
import {MusicianProfileModal} from "../../components/MusicianProfileModal";
import {SearchableSelect} from "../../components/forms/SearchableSelect.tsx";
import {Search, X, ListMusic} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {useHostScheduleController} from '../../hooks'
import type {HostScheduleOutcome, Music, Performance, PerformanceStatus} from '../../lib/schedule/hostScheduleController'

/**
 * Schedule Tab Component - Full management with nested registrations
 * Similar to jam detail page view but with additional management controls
 */
export function ScheduleTab({jam, onReload}: {
    jam: JamResponseDto
    onReload: () => Promise<JamResponseDto | undefined>
}) {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showCreateMusicModal, setShowCreateMusicModal] = useState(false)
    const [selectedMusicId, setSelectedMusicId] = useState('')
    const [showHostRegistrationModal, setShowHostRegistrationModal] = useState(false)
    const [selectedScheduleForRegistration, setSelectedScheduleForRegistration] = useState<ScheduleResponseDto | null>(null)
    const [selectedMusicianId, setSelectedMusicianId] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const {state: scheduleState, commands: scheduleCommands} = useHostScheduleController(jam, onReload)
    const {
        performances: sortedSchedules,
        filteredActivePerformances: filteredNonSuggested,
        filteredSuggestedPerformances: filteredSuggested,
        counts: {needsMusicians: needsCount, complete: completeCount, total: totalCount},
        rawSearch,
        appliedSearch: searchQuery,
        filter: statusFilter,
        catalogue: musicCatalogue,
        availableMusic: availableSongs,
        pendingEntityIds: loadingIds,
        pendingConfirmation,
    } = scheduleState
    const musicCatalog = musicCatalogue.items
    const loadingMusicCatalog = musicCatalogue.status === 'loading'
    const loadingSongsFailedMessage = t('jams.loading_songs_failed')

    const isAnyLoading = loadingIds.size > 0

    const reportMutationOutcome = useCallback((
        outcome: HostScheduleOutcome,
        successMessage: string,
        fallbackError: string,
    ) => {
        if (outcome.code === 'success') {
            setSuccess(successMessage)
            return true
        }
        if (outcome.code === 'partial_success' || outcome.code === 'bulk_failure') {
            if (outcome.code === 'partial_success') setSuccess(successMessage)
            setError(outcome.failed.map(({error: failure}) => failure.message).join(', ') || fallbackError)
            return false
        }
        if (outcome.code === 'failure' || outcome.code === 'refresh_failure') {
            setError(outcome.error.message || fallbackError)
            return false
        }
        if (outcome.code === 'duplicate_pending') setError(fallbackError)
        return false
    }, [])

    // Load the searchable music catalog when the add-entry modal opens.
    useEffect(() => {
        if (!showAddModal) return

        setError(null)
        void scheduleCommands.loadMusicCatalogue().then((outcome) => {
            if (outcome.code === 'failure') setError(loadingSongsFailedMessage)
        })
        return scheduleCommands.cancelMusicCatalogueLoad
    }, [loadingSongsFailedMessage, scheduleCommands, showAddModal])

    const handleSaveNotes = useCallback((jamMusicId: string, notes: string) => {
        void (async () => {
            setError(null)
            const outcome = await scheduleCommands.updateNotes(jamMusicId, notes)
            reportMutationOutcome(
                outcome,
                t('jam_management.schedule.notes_saved', 'Notes saved'),
                t('errors.failed_to_execute_action'),
            )
        })()
    }, [reportMutationOutcome, scheduleCommands, t])

    // Handle schedule status change
    const handleStatusChange = useCallback((scheduleId: string, newStatus: string) => {
        void (async () => {
            setError(null)
            const outcome = await scheduleCommands.transitionPerformance(scheduleId, newStatus as PerformanceStatus)
            reportMutationOutcome(
                outcome,
                t('jam_management.schedule.status_updated', 'Status updated'),
                t('errors.failed_to_execute_action'),
            )
        })()
    }, [reportMutationOutcome, scheduleCommands, t])

    // Handle schedule deletion (via confirm dialog)
    const handleDeleteSchedule = useCallback((scheduleId: string) => {
        scheduleCommands.requestRemovePerformance(scheduleId)
    }, [scheduleCommands])

    // Handle add schedule
    const handleAddSchedule = useCallback(() => {
        if (!selectedMusicId) {
            setError(t('host_songs.select_song_error'))
            return
        }
        void (async () => {
            setError(null)
            const outcome = await scheduleCommands.createPerformance(selectedMusicId)
            if (reportMutationOutcome(
                outcome,
                t('jam_management.schedule.added_success', 'Song added to schedule'),
                t('errors.failed_to_execute_action'),
            )) {
                setShowAddModal(false)
                setSelectedMusicId('')
            }
        })()
    }, [reportMutationOutcome, scheduleCommands, selectedMusicId, t])

    // Handle reject registration (via confirm dialog)
    const handleRejectRegistration = useCallback((registrationId: string) => {
        scheduleCommands.requestRemoveRegistration(registrationId)
    }, [scheduleCommands])

    // Handle approve registration - update registration status to APPROVED
    const handleApproveRegistration = useCallback((registrationId: string) => {
        void (async () => {
            setError(null)
            const outcome = await scheduleCommands.approveRegistration(registrationId)
            reportMutationOutcome(
                outcome,
                t('jam_management.schedule.registration_approved', 'Musician approved'),
                t('errors.failed_to_execute_action'),
            )
        })()
    }, [reportMutationOutcome, scheduleCommands, t])

    // Handle approve all pending registrations for a schedule
    const handleApproveAllRegistrations = useCallback((scheduleId: string) => {
        void (async () => {
            setError(null)
            const outcome = await scheduleCommands.approveAllRegistrations(scheduleId)
            reportMutationOutcome(
                outcome,
                t('schedule.all_registrations_approved', 'All musicians approved'),
                t('errors.failed_to_execute_action'),
            )
        })()
    }, [reportMutationOutcome, scheduleCommands, t])

    const handleAddMusician = useCallback((scheduleId: string) => {
        const schedule = sortedSchedules.find(s => s.id === scheduleId)
        if (schedule) {
            setSelectedScheduleForRegistration(schedule)
            setShowHostRegistrationModal(true)
        }
    }, [sortedSchedules])

    const handleConfirmAction = useCallback(() => {
        if (!pendingConfirmation) return
        const operation = pendingConfirmation.kind
        void (async () => {
            setError(null)
            const outcome = await scheduleCommands.confirmPendingAction()
            reportMutationOutcome(
                outcome,
                operation === 'remove_performance'
                    ? t('jam_management.schedule.deleted_success', 'Song removed from schedule')
                    : t('jam_management.schedule.registration_removed', 'Registration removed'),
                operation === 'remove_performance'
                    ? t('errors.failed_to_remove')
                    : t('errors.failed_to_execute_action'),
            )
        })()
    }, [pendingConfirmation, reportMutationOutcome, scheduleCommands, t])

    const confirmationPerformance = pendingConfirmation?.kind === 'remove_performance'
        ? sortedSchedules.find(({id}) => id === pendingConfirmation.performanceId)
        : undefined
    const confirmationTitle = pendingConfirmation?.kind === 'remove_performance'
        ? t('jam_management.schedule.confirm_delete_title', 'Delete song')
        : t('jam_management.schedule.confirm_reject_title', 'Remove registration')
    const confirmationMessage = pendingConfirmation?.kind === 'remove_performance'
        ? (confirmationPerformance?.music.title
            ? t('jam_management.schedule.confirm_delete_named', {name: confirmationPerformance.music.title})
            : t('jam_management.schedule.confirm_delete'))
        : t('jam_management.schedule.confirm_reject_reg')

    const isCardLoading = useCallback((schedule: ScheduleResponseDto) => {
        if (loadingIds.has(schedule.id)) return true
        return schedule.registrations?.some(r => loadingIds.has(r.id)) ?? false
    }, [loadingIds])

    const renderCard = (schedule: Performance, isSuggested: boolean) => {
        const jm = schedule.jamMusic
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
            onEditMusic={(musicId) => { void navigate(`/music?edit=${musicId}`) }}
        />
    }

    return (
        <div className="space-y-3">
            {/* Alerts */}
            <Alert type="error" message={error} onDismiss={() => setError(null)} />
            <Alert type="success" message={success} onDismiss={() => setSuccess(null)} autoHide autoHideDelay={3000} />

            {/* Search + Filter Toolbar */}
            {sortedSchedules.length > 3 && (
                <div className="space-y-2">
                    <div className="flex items-end gap-2">
                        <div className="flex min-w-0 flex-1 items-end gap-2">
                            <Search className="mb-3 size-4 shrink-0 text-base-content/60" aria-hidden="true" />
                            <Field
                                id="schedule-search"
                                label={<span className="sr-only">{t('schedule.search_placeholder', 'Search songs or musicians...')}</span>}
                                className="min-w-0 flex-1"
                            >
                                <Field.Input
                                    type="search"
                                    placeholder={t('schedule.search_placeholder', 'Search songs or musicians...')}
                                    value={rawSearch}
                                    onChange={(e) => scheduleCommands.setSearch(e.target.value)}
                                />
                            </Field>
                            {rawSearch && (
                                <IconAction
                                    variant="quiet"
                                    label={t('common.clear_filters', 'Clear filters')}
                                    onClick={scheduleCommands.clearSearch}
                                >
                                    <X className="size-4" />
                                </IconAction>
                            )}
                        </div>
                        <IconAction
                            onClick={() => setShowAddModal(true)}
                            variant="primary"
                            {...(loadingIds.has(selectedMusicId)
                                ? {state: 'loading' as const, loadingLabel: t('common.adding')}
                                : {state: 'idle' as const})}
                            label={t('jam_management.schedule.add_new_song')}
                        >
                            +
                        </IconAction>
                    </div>
                    <div className="flex flex-wrap gap-2" role="group" aria-label={t('jam_management.schedule.title')}>
                        <Action
                            variant={statusFilter === 'all' ? 'primary' : 'quiet'}
                            aria-pressed={statusFilter === 'all'}
                            onClick={() => scheduleCommands.setFilter('all')}
                        >
                            <Action.Label>{t('common.all', 'All')} ({totalCount})</Action.Label>
                        </Action>
                        <Action
                            variant={statusFilter === 'needs_musicians' ? 'primary' : 'quiet'}
                            aria-pressed={statusFilter === 'needs_musicians'}
                            onClick={() => scheduleCommands.setFilter('needs_musicians')}
                        >
                            <Action.Label>{t('schedule.needs_musicians_short', 'Aguardando')} ({needsCount})</Action.Label>
                        </Action>
                        <Action
                            variant={statusFilter === 'complete' ? 'primary' : 'quiet'}
                            aria-pressed={statusFilter === 'complete'}
                            onClick={() => scheduleCommands.setFilter('complete')}
                        >
                            <Action.Label>{t('schedule.band_complete_short', 'Pronto')} ({completeCount})</Action.Label>
                        </Action>
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
                                <Action
                                    variant="quiet"
                                    onClick={() => { scheduleCommands.clearSearch(); scheduleCommands.setFilter('all') }}
                                >
                                    <Action.Label>{t('common.clear_filters', 'Clear filters')}</Action.Label>
                                </Action>
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
                        <Action
                            onClick={() => setShowAddModal(true)}
                            variant="primary"
                            {...(loadingIds.has(selectedMusicId)
                                ? {state: 'loading' as const, loadingLabel: t('common.adding')}
                                : {state: 'idle' as const})}
                        >
                            <Action.Icon><ListMusic className="size-4" /></Action.Icon>
                            <Action.Label>{t('jam_management.schedule.add_new_song')}</Action.Label>
                        </Action>
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
                        void onReload()
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
                            submitting={loadingIds.has(selectedMusicId)}
                            submitDisabled={!selectedMusicId}
                        />
                    }
                >
                    <div className="form-control mb-4">
                        <label className="label" htmlFor="music-select">
                            <span className="label-text">{t('jam_management.schedule.song_label')}</span>
                        </label>
                        <SearchableSelect<Music>
                            id="music-select"
                            items={[...availableSongs]}
                            value={selectedMusicId}
                            onChange={setSelectedMusicId}
                            getItemLabel={(music) => music.title}
                            getItemSubLabel={(music) => music.artist}
                            placeholder={t('jam_management.schedule.select_song')}
                            searchPlaceholder={t('common.search')}
                            emptyMessage={t('common.no_results')}
                            disabled={loadingIds.has(selectedMusicId)}
                            loading={loadingMusicCatalog}
                            ariaLabel={t('jam_management.schedule.song_label')}
                            filterFn={(music, term) => {
                                const query = term.toLowerCase().trim()
                                return music.title.toLowerCase().includes(query)
                                    || music.artist.toLowerCase().includes(query)
                            }}
                        />
                        <Action
                            type="button"
                            onClick={() => {
                                setShowAddModal(false)
                                setShowCreateMusicModal(true)
                            }}
                            variant="quiet"
                            className="mt-2 w-full"
                        >
                            <Action.Label>{t('music_library.create_new')}</Action.Label>
                        </Action>
                    </div>

                    <Field
                        id="order-input"
                        label={t('jam_management.schedule.order_label')}
                        disabled
                        className="mb-4"
                    >
                        <Field.Input
                            type="text"
                            value={t('jam_management.schedule.order_auto', {count: sortedSchedules.length + 1})}
                        />
                    </Field>

                    <Alert type="error" message={error} className="mb-4" />
                </Modal>
            )}

            {showCreateMusicModal && (
                <MusicModal
                    mode="add"
                    existingSongs={[...musicCatalog]}
                    onClose={() => {
                        setShowCreateMusicModal(false)
                        setShowAddModal(true)
                    }}
                    onSuccess={(music) => {
                        setShowCreateMusicModal(false)
                        if (music) {
                            scheduleCommands.addCatalogueMusic(music)
                            setSelectedMusicId(music.id)
                        }
                        setShowAddModal(true)
                    }}
                    setError={setError}
                    setSuccess={setSuccess}
                />
            )}

            {/* Confirm Dialog for destructive actions */}
            <ConfirmDialog
                isOpen={!!pendingConfirmation}
                title={confirmationTitle}
                message={confirmationMessage}
                onConfirm={handleConfirmAction}
                onCancel={scheduleCommands.cancelPendingAction}
                variant="destructive"
                loading={isAnyLoading}
            />
        </div>
    )
}
