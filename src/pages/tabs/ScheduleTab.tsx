import type {JamMusicResponseDto, JamResponseDto, ScheduleResponseDto} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useState} from "react";
import {registrationService, scheduleService} from "../../services";
import {ScheduleCardManagement} from '../../components';
import {HostMusicianRegistrationModal} from "../../components/schedule";

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

    const sortedSchedules = [...(jam.schedules || [])].sort((a, b) => a.order - b.order)
    const nonSuggestedSchedules = sortedSchedules.filter(s => s.status !== 'SUGGESTED')
    const suggestedSchedules = sortedSchedules.filter(s => s.status === 'SUGGESTED')

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

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <p className="text-2xl sm:text-3xl font-bold">📋 {t('jam_management.schedule.title')}</p>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto"
                    disabled={loading}
                >
                    {t('jam_management.schedule.add_new_song')}
                </button>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert alert-error" role="alert" aria-live="polite">
                    <p className="flex-1">{error}</p>
                    <button 
                        onClick={() => setError(null)} 
                        className="btn btn-xs sm:btn-sm btn-ghost"
                        aria-label="Close error alert"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Schedule List */}
            {sortedSchedules.length > 0 ? (
                <div className="space-y-6">
                    {/* Suggested Schedules */}
                    {suggestedSchedules.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-3xl font-semibold flex items-center gap-2">
                                ✨ {t('jam_management.schedule.suggested_songs')}
                            </h3>
                            {suggestedSchedules.map((schedule) => (
                                <ScheduleCardManagement
                                    key={schedule.id}
                                    schedule={schedule}
                                    loading={loading}
                                    isSuggested={true}
                                    onStatusChange={handleStatusChange}
                                    onDelete={handleDeleteSchedule}
                                    onApproveRegistration={handleApproveRegistration}
                                    onRejectRegistration={handleRejectRegistration}
                                    onDeleteRegistration={handleRejectRegistration}
                                    onAddMusician={() => handleAddMusician(schedule)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Scheduled Songs */}
                    {nonSuggestedSchedules.length > 0 && (
                        <div className={`space-y-4 ${suggestedSchedules.length > 0 ? 'mt-6 pt-6 border-t-2 border-primary/30' : ''}`}>
                            {suggestedSchedules.length > 0 && (
                                <h3 className="text-3xl font-semibold flex items-center gap-2">
                                    📋 {t('jam_management.schedule.title')}
                                </h3>
                            )}
                            {nonSuggestedSchedules.map((schedule, index) => (
                                <ScheduleCardManagement
                                    key={schedule.id}
                                    schedule={schedule}
                                    index={index}
                                    loading={loading}
                                    isSuggested={false}
                                    onStatusChange={handleStatusChange}
                                    onDelete={handleDeleteSchedule}
                                    onApproveRegistration={handleApproveRegistration}
                                    onRejectRegistration={handleRejectRegistration}
                                    onDeleteRegistration={handleRejectRegistration}
                                    onAddMusician={() => handleAddMusician(schedule)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="card bg-base-200">
                    <div className="card-body text-center py-8">
                        <div className="text-4xl mb-3">📋</div>
                        <h3 className="font-semibold mb-2">{t('jam_management.schedule.no_schedule_yet')}</h3>
                        <p className="text-sm text-base-content/70">
                            {(jam._count?.jamMusics ?? jam.jamMusics?.length ?? 0) > 0
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
                                {jam.jamMusics?.map((jm: JamMusicResponseDto) => (
                                    <option key={jm.id} value={jm.music?.id || jm.musicId}>
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

                        {error && (
                            <div className="alert alert-error mb-4">
                                <p>{error}</p>
                            </div>
                        )}

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