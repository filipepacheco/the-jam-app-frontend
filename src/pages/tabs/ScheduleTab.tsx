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
    const [rowFeedback, setRowFeedback] = useState<Record<string, {type: 'error' | 'success'; message: string}>>({})
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
    const activePerformances = filteredNonSuggested.filter(({status}) => status === 'IN_PROGRESS')
    const upcomingPerformances = filteredNonSuggested.filter(({status}) => status === 'SCHEDULED')
    const completedPerformances = filteredNonSuggested.filter(({status}) => status === 'COMPLETED' || status === 'CANCELED')

    const isAnyLoading = loadingIds.size > 0

    useEffect(() => {
        if (!selectedScheduleForRegistration) return
        const refreshedPerformance = sortedSchedules.find(({id}) => id === selectedScheduleForRegistration.id)
        if (refreshedPerformance && refreshedPerformance !== selectedScheduleForRegistration) {
            setSelectedScheduleForRegistration(refreshedPerformance)
        }
    }, [selectedScheduleForRegistration, sortedSchedules])

    const reportMutationOutcome = useCallback((
        outcome: HostScheduleOutcome,
        successMessage: string,
        fallbackError: string,
    ) => {
        const affectedIds = 'affectedIds' in outcome
            ? outcome.affectedIds
            : 'entityId' in outcome
                ? [outcome.entityId]
                : []
        const affectedPerformanceId = sortedSchedules.find((performance) => affectedIds.some((id) => (
            id === performance.id
            || id === performance.jamMusic?.id
            || performance.registrations.some((registration) => registration.id === id)
        )))?.id
        const report = (type: 'error' | 'success', message: string) => {
            if (!affectedPerformanceId) return false
            setRowFeedback((current) => ({...current, [affectedPerformanceId]: {type, message}}))
            return true
        }

        if (outcome.code === 'success') {
            if (!report('success', successMessage)) setSuccess(successMessage)
            return true
        }
        if (outcome.code === 'partial_success' || outcome.code === 'bulk_failure') {
            const failureDetails = outcome.failed.map(({error: failure}) => failure.message).join(', ') || fallbackError
            const failureMessage = outcome.code === 'partial_success'
                ? `${t('schedule.batch.partial_error', {success: outcome.succeededIds.length, failed: outcome.failed.length})}: ${failureDetails}`
                : failureDetails
            if (!report('error', failureMessage)) setError(failureMessage)
            return false
        }
        if (outcome.code === 'failure' || outcome.code === 'refresh_failure') {
            const message = outcome.error.message || fallbackError
            if (!report('error', message)) setError(message)
            return false
        }
        if (outcome.code === 'duplicate_pending' && !report('error', fallbackError)) setError(fallbackError)
        return false
    }, [sortedSchedules, t])

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
                t('jam_management.schedule.notes_saved'),
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
                t('jam_management.schedule.status_updated'),
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
                t('jam_management.schedule.added_success'),
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
                t('jam_management.schedule.registration_approved'),
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
                t('schedule.all_registrations_approved'),
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
                    ? t('jam_management.schedule.deleted_success')
                    : t('jam_management.schedule.registration_removed'),
                operation === 'remove_performance'
                    ? t('host_songs.failed_to_remove')
                    : t('errors.failed_to_execute_action'),
            )
        })()
    }, [pendingConfirmation, reportMutationOutcome, scheduleCommands, t])

    const confirmationPerformance = pendingConfirmation?.kind === 'remove_performance'
        ? sortedSchedules.find(({id}) => id === pendingConfirmation.performanceId)
        : undefined
    const confirmationTitle = pendingConfirmation?.kind === 'remove_performance'
        ? t('jam_management.schedule.confirm_delete_title')
        : t('jam_management.schedule.confirm_reject_title')
    const confirmationMessage = pendingConfirmation?.kind === 'remove_performance'
        ? (confirmationPerformance?.music.title
            ? t('jam_management.schedule.confirm_delete_named', {name: confirmationPerformance.music.title})
            : t('jam_management.schedule.confirm_delete'))
        : t('jam_management.schedule.confirm_reject_reg')

    const isCardLoading = useCallback((schedule: ScheduleResponseDto) => {
        if (loadingIds.has(schedule.id)) return true
        return schedule.registrations?.some(r => loadingIds.has(r.id)) ?? false
    }, [loadingIds])

    const renderCard = (
        schedule: Performance,
        isSuggested: boolean,
        priority: 'current' | 'queue' | 'secondary',
    ) => {
        const jm = schedule.jamMusic
        const feedback = rowFeedback[schedule.id]
        return <div key={schedule.id} className="space-y-2">
            {feedback && (
                <Alert
                    type={feedback.type}
                    message={feedback.message}
                    onDismiss={() => setRowFeedback((current) => {
                        const next = {...current}
                        delete next[schedule.id]
                        return next
                    })}
                />
            )}
            <ScheduleCollapsibleCard
                schedule={schedule}
                loading={isCardLoading(schedule)}
                isSuggested={isSuggested}
                priority={priority}
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
        </div>
    }

    const renderGroup = (
        id: string,
        label: string,
        performances: readonly Performance[],
        isSuggested = false,
        priority: 'current' | 'queue' | 'secondary' = 'queue',
    ) => performances.length > 0 && (
        <section aria-labelledby={id} data-performance-priority={priority}>
            <div className={`flex items-center gap-2 py-2 font-bold uppercase tracking-wide ${
                priority === 'current'
                    ? 'text-sm text-base-content'
                    : priority === 'secondary'
                        ? 'text-xs text-base-content/50'
                        : 'text-xs text-base-content/70'
            }`}>
                {priority === 'current' && <span className="size-2 shrink-0 rounded-full bg-warning" aria-hidden="true" />}
                <h2 id={id} className="font-bold">{label} ({performances.length})</h2>
                <div className="flex-1 border-t border-base-300/50" />
            </div>
            <div className="space-y-2">
                {performances.map((schedule) => renderCard(schedule, isSuggested, priority))}
            </div>
        </section>
    )

    return (
        <div className="space-y-3">
            {/* Alerts */}
            <Alert type="error" message={error} onDismiss={() => setError(null)} />
            <Alert type="success" message={success} onDismiss={() => setSuccess(null)} autoHide autoHideDelay={3000} />

            {sortedSchedules.length > 0 && sortedSchedules.length <= 3 && (
                <div className="flex justify-end">
                    <Action
                        onClick={() => setShowAddModal(true)}
                        variant="primary"
                        className="w-full sm:w-auto"
                        {...(loadingIds.has(selectedMusicId)
                            ? {state: 'loading' as const, loadingLabel: t('common.adding')}
                            : {state: 'idle' as const})}
                    >
                        <Action.Icon><ListMusic className="size-4" /></Action.Icon>
                        <Action.Label>{t('jam_management.schedule.add_new_song')}</Action.Label>
                    </Action>
                </div>
            )}

            {/* Search + Filter Toolbar */}
            {sortedSchedules.length > 3 && (
                <div className="space-y-2">
                    <div className="flex items-end gap-2">
                        <div className="flex min-w-0 flex-1 items-end gap-2">
                            <div className="relative min-w-0 flex-1">
                                <Search
                                    className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-base-content/60"
                                    aria-hidden="true"
                                />
                                <Field
                                    id="schedule-search"
                                    label={<span className="sr-only">{t('schedule.search_placeholder')}</span>}
                                    className="min-w-0 [&_.ds-field__control]:pl-10"
                                >
                                    <Field.Input
                                        type="search"
                                        placeholder={t('schedule.search_placeholder')}
                                        value={rawSearch}
                                        onChange={(e) => scheduleCommands.setSearch(e.target.value)}
                                    />
                                </Field>
                            </div>
                            {rawSearch && (
                                <IconAction
                                    variant="quiet"
                                    label={t('common.clear_filters')}
                                    onClick={scheduleCommands.clearSearch}
                                >
                                    <X className="size-4" />
                                </IconAction>
                            )}
                        </div>
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
                    </div>
                    <div className="flex flex-wrap gap-2" role="group" aria-label={t('jam_management.schedule.title')}>
                        <Action
                            variant={statusFilter === 'all' ? 'primary' : 'quiet'}
                            aria-pressed={statusFilter === 'all'}
                            onClick={() => scheduleCommands.setFilter('all')}
                        >
                            <Action.Label>{t('common.all')} ({totalCount})</Action.Label>
                        </Action>
                        <Action
                            variant={statusFilter === 'needs_musicians' ? 'primary' : 'quiet'}
                            aria-pressed={statusFilter === 'needs_musicians'}
                            onClick={() => scheduleCommands.setFilter('needs_musicians')}
                        >
                            <Action.Label>{t('schedule.needs_musicians_short')} ({needsCount})</Action.Label>
                        </Action>
                        <Action
                            variant={statusFilter === 'complete' ? 'primary' : 'quiet'}
                            aria-pressed={statusFilter === 'complete'}
                            onClick={() => scheduleCommands.setFilter('complete')}
                        >
                            <Action.Label>{t('schedule.band_complete_short')} ({completeCount})</Action.Label>
                        </Action>
                    </div>
                </div>
            )}

            {/* Schedule List */}
            {sortedSchedules.length > 0 ? (
                <div className="space-y-3">
                    {renderGroup('schedule-active', t('schedule.now_playing'), activePerformances, false, 'current')}
                    {renderGroup('schedule-upcoming', t('schedule.statuses.scheduled'), upcomingPerformances)}
                    {renderGroup('schedule-suggested', t('jam_management.schedule.suggested_songs'), filteredSuggested, true, 'secondary')}
                    {renderGroup('schedule-completed', t('schedule.statuses.completed'), completedPerformances, false, 'secondary')}

                    {/* No results after filtering */}
                    {filteredNonSuggested.length === 0 && filteredSuggested.length === 0 && (
                        <div className="text-center py-6 space-y-2">
                            <p className="text-sm text-base-content/50">
                                {t('common.no_results')}
                            </p>
                            {(searchQuery || statusFilter !== 'all') && (
                                <Action
                                    variant="quiet"
                                    onClick={() => { scheduleCommands.clearSearch(); scheduleCommands.setFilter('all') }}
                                >
                                    <Action.Label>{t('common.clear_filters')}</Action.Label>
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
                    onBatchComplete={(outcome) => {
                        if (outcome.kind === 'success') {
                            setShowHostRegistrationModal(false)
                            setSelectedScheduleForRegistration(null)
                        }
                        if (outcome.kind !== 'failure') {
                            setSuccess(t('jam_management.schedule.musicians_registered'))
                        }
                        if (outcome.kind !== 'failure' || outcome.refreshRequired) void onReload()
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
