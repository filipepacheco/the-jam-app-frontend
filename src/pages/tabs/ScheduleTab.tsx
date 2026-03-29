import type {JamResponseDto, ScheduleResponseDto} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useMemo, useState} from "react";
import {registrationService, scheduleService, musicService} from "../../services";
import {Alert} from '../../components';
import {isScheduleReadyToPlay} from "../../utils/scheduleUtils";
import {HostMusicianRegistrationModal} from "../../components/schedule";
import {ScheduleCollapsibleCard} from "../../components/schedule/ScheduleCollapsibleCard";
import {MusicianProfileModal} from "../../components/MusicianProfileModal";
import {Search, X} from "lucide-react";

/**
 * Schedule Tab Component - Full management with nested registrations
 * Similar to jam detail page view but with additional management controls
 */
export function ScheduleTab({jam, onReload}: { jam: JamResponseDto; onReload: () => void }) {
    const {t} = useTranslation()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedMusicId, setSelectedMusicId] = useState('')
    const [showHostRegistrationModal, setShowHostRegistrationModal] = useState(false)
    const [selectedScheduleForRegistration, setSelectedScheduleForRegistration] = useState<ScheduleResponseDto | null>(null)
    const [selectedMusicianId, setSelectedMusicianId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'needs_musicians' | 'complete'>('all')

    const { sortedSchedules, nonSuggestedSchedules, suggestedSchedules } = useMemo(() => {
        const sorted = [...(jam.schedules || [])].sort((a, b) => a.order - b.order)
        return {
            sortedSchedules: sorted,
            nonSuggestedSchedules: sorted.filter(s => s.status !== 'SUGGESTED'),
            suggestedSchedules: sorted.filter(s => s.status === 'SUGGESTED'),
        }
    }, [jam.schedules])

    // Helper: check if a schedule needs musicians
    const needsMusicians = (s: ScheduleResponseDto) => {
        const music = s.music
        const totalNeeded = (music?.neededDrums || 0) + (music?.neededGuitars || 0)
            + (music?.neededBass || 0) + (music?.neededVocals || 0) + (music?.neededKeys || 0)
        if (totalNeeded === 0) return false
        return (s.registrations?.length || 0) < totalNeeded
    }

    // Filtered schedules
    const { filteredNonSuggested, filteredSuggested, needsCount, completeCount } = useMemo(() => {
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
            if (statusFilter === 'needs_musicians') return needsMusicians(s)
            if (statusFilter === 'complete') return isScheduleReadyToPlay(s)
            return true
        }

        const allNonSuggested = nonSuggestedSchedules.filter(s => matchesSearch(s) && matchesFilter(s))
        const allSuggested = suggestedSchedules.filter(matchesSearch)

        // Counts for filter chips (unfiltered, search-only)
        const searchedNonSuggested = nonSuggestedSchedules.filter(matchesSearch)
        const needs = searchedNonSuggested.filter(needsMusicians).length
        const complete = searchedNonSuggested.filter(isScheduleReadyToPlay).length

        return { filteredNonSuggested: allNonSuggested, filteredSuggested: allSuggested, needsCount: needs, completeCount: complete }
    }, [nonSuggestedSchedules, suggestedSchedules, searchQuery, statusFilter])

    // Build lookup: musicId -> { jamMusicId, notes }
    const jamMusicMap = useMemo(() => {
        const map = new Map<string, { id: string; notes?: string | null }>()
        for (const jm of jam.jamMusics || []) {
            map.set(jm.musicId, { id: jm.id, notes: jm.notes })
        }
        return map
    }, [jam.jamMusics])

    const handleSaveNotes = async (jamMusicId: string, notes: string) => {
        setLoading(true)
        setError(null)
        try {
            await musicService.updateJamMusic(jamMusicId, jam.id, { notes })
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
        } finally {
            setLoading(false)
        }
    }

    // Handle schedule status change
    const handleStatusChange = async (scheduleId: string, newStatus: string) => {
        const updatePayload: { status: string; order?: number } = {status: newStatus}

        // If approving a suggested schedule, set order to last position
        if (newStatus === 'SCHEDULED') {
            const nonSuggestedSchedules = sortedSchedules.filter(s => s.status !== 'SUGGESTED')
            const maxOrder = nonSuggestedSchedules.length > 0
                ? Math.max(...nonSuggestedSchedules.map(s => s.order))
                : 0

            updatePayload.order = maxOrder + 1
        }

        setLoading(true)
        setError(null)
        try {
            await scheduleService.update(scheduleId, updatePayload as any)
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
        } finally {
            setLoading(false)
        }
    }

    // Handle schedule deletion
    const handleDeleteSchedule = async (scheduleId: string) => {
        if (!confirm(t('jam_management.schedule.confirm_delete'))) return
        setLoading(true)
        setError(null)
        try {
            await scheduleService.remove(scheduleId)
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failed_to_remove'))
        } finally {
            setLoading(false)
        }
    }

    // Handle add schedule
    const handleAddSchedule = async () => {
        if (!selectedMusicId) {
            setError(t('host_songs.select_song_error'))
            return
        }
        setLoading(true)
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
            } as any)
            setShowAddModal(false)
            setSelectedMusicId('')
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
        } finally {
            setLoading(false)
        }
    }

    // Handle reject registration (delete)
    const handleRejectRegistration = async (registrationId: string) => {
        if (!confirm(t('jam_management.schedule.confirm_reject_reg'))) return
        setLoading(true)
        try {
            await registrationService.remove(registrationId)
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
        } finally {
            setLoading(false)
        }
    }

    // Handle approve registration - update registration status to APPROVED
    const handleApproveRegistration = async (registrationId: string) => {
        if (!jam?.id) return

        setLoading(true)
        setError(null)

        try {
            await registrationService.update(registrationId, {status: 'APPROVED'})
            onReload()
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('errors.failed_to_execute_action')
            console.error('❌ Error approving registration:', err)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleAddMusician = (schedule: ScheduleResponseDto) => {
        setSelectedScheduleForRegistration(schedule)
        setShowHostRegistrationModal(true)
    }

    const renderCard = (schedule: ScheduleResponseDto, isSuggested: boolean) => {
        const jm = jamMusicMap.get(schedule.musicId)
        return <ScheduleCollapsibleCard
            key={schedule.id}
            schedule={schedule}
            loading={loading}
            isSuggested={isSuggested}
            defaultExpanded={schedule.status === 'IN_PROGRESS'}
            notes={jm?.notes}
            jamMusicId={jm?.id}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteSchedule}
            onApproveRegistration={handleApproveRegistration}
            onRejectRegistration={handleRejectRegistration}
            onDeleteRegistration={handleRejectRegistration}
            onAddMusician={() => handleAddMusician(schedule)}
            onMusicianClick={setSelectedMusicianId}
            onSaveNotes={handleSaveNotes}
        />
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg sm:text-xl font-bold">{t('jam_management.schedule.title')}</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary btn-sm"
                    disabled={loading}
                >
                    {t('jam_management.schedule.add_new_song')}
                </button>
            </div>

            {/* Error Alert */}
            <Alert type="error" message={error} onDismiss={() => setError(null)} />

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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="btn btn-sm btn-ghost join-item" onClick={() => setSearchQuery('')}>
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                        <button
                            className={`btn btn-xs ${statusFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setStatusFilter('all')}
                        >
                            {t('common.all', 'All')} ({filteredNonSuggested.length + filteredSuggested.length})
                        </button>
                        <button
                            className={`btn btn-xs ${statusFilter === 'needs_musicians' ? 'btn-warning' : 'btn-ghost'}`}
                            onClick={() => setStatusFilter('needs_musicians')}
                        >
                            {t('schedule.needs_musicians', 'Needs musicians')} ({needsCount})
                        </button>
                        <button
                            className={`btn btn-xs ${statusFilter === 'complete' ? 'btn-success' : 'btn-ghost'}`}
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
                            <div className="flex items-center gap-2 py-1.5 text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                                <span>{t('jam_management.schedule.suggested_songs')} ({filteredSuggested.length})</span>
                                <div className="flex-1 border-t border-base-300/30" />
                            </div>
                            <div className="space-y-1">
                                {filteredSuggested.map((schedule) => renderCard(schedule, true))}
                            </div>
                        </div>
                    )}

                    {/* Scheduled/Active Songs */}
                    {filteredNonSuggested.length > 0 && (
                        <div>
                            {filteredSuggested.length > 0 && (
                                <div className="flex items-center gap-2 py-1.5 text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                                    <span>{t('jam_management.schedule.title')} ({filteredNonSuggested.length})</span>
                                    <div className="flex-1 border-t border-base-300/30" />
                                </div>
                            )}
                            <div className="space-y-1">
                                {filteredNonSuggested.map((schedule) => renderCard(schedule, false))}
                            </div>
                        </div>
                    )}

                    {/* No results after filtering */}
                    {filteredNonSuggested.length === 0 && filteredSuggested.length === 0 && (
                        <p className="text-sm text-base-content/50 text-center py-4">
                            {t('common.no_results', 'No results found')}
                        </p>
                    )}
                </div>
            ) : (
                <div className="card bg-base-200">
                    <div className="card-body text-center py-8">
                        <h3 className="font-semibold mb-2">{t('jam_management.schedule.no_schedule_yet')}</h3>
                        <p className="text-sm text-base-content/70">
                            {(jam._count?.schedules ?? jam.schedules?.length ?? 0) > 0
                                ? t('jam_management.schedule.add_entry_hint')
                                : t('jam_management.schedule.add_songs_first')}
                        </p>
                    </div>
                </div>
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
                <div className="modal modal-open">
                    <div className="modal-box max-w-md w-full mx-auto">
                        <h3 className="font-bold text-lg mb-4">{t('jam_management.schedule.add_entry_modal')}</h3>

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
                                {jam.schedules?.map((s) => (
                                    <option key={s.id} value={s.music?.id || s.musicId}>
                                        {s.music?.title || t('common.unknown')} - {s.music?.artist || t('common.unknown')}
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

                        <div className="modal-action gap-2">
                            <button
                                onClick={() => {
                                    setShowAddModal(false)
                                    setError(null)
                                    setSelectedMusicId('')
                                }}
                                className="btn btn-ghost btn-sm sm:btn-md"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleAddSchedule}
                                className="btn btn-primary btn-sm sm:btn-md"
                                disabled={loading || !selectedMusicId}
                            >
                                {loading ?
                                    <span
                                        className="loading loading-spinner loading-sm"></span> : t('jam_management.schedule.add_to_schedule')}
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAddModal(false)}></div>
                </div>
            )}
        </div>
    )
}