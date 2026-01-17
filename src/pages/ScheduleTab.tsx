import type {JamMusicResponseDto, JamResponseDto, ScheduleResponseDto} from "../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useState} from "react";
import {registrationService} from "../services/registrationService";
import { scheduleService } from "../services/scheduleService";
import {ScheduleCardManagement} from '../components/schedule/ScheduleCardManagement';
import {HostMusicianRegistrationModal} from "../components/schedule";

/**
 * Schedule Tab Component - Full management with nested registrations
 * Matches JamDetailPage view but with management controls
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
        const updatePayload: any = {status: newStatus}

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

    // Handle move up
    const handleMoveUp = async (index: number) => {
        const nonSuggestedSchedules = sortedSchedules.filter(s => s.status !== 'SUGGESTED')
        if (index === 0) return
        const newOrder = nonSuggestedSchedules.map((s) => s.id)
        ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
        setLoading(true)
        try {
            await scheduleService.reorder(jam.id, newOrder)
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
        } finally {
            setLoading(false)
        }
    }

    // Handle move down
    const handleMoveDown = async (index: number) => {
        const nonSuggestedSchedules = sortedSchedules.filter(s => s.status !== 'SUGGESTED')
        if (index === nonSuggestedSchedules.length - 1) return
        const newOrder = nonSuggestedSchedules.map((s) => s.id)
        ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
        setLoading(true)
        try {
            await scheduleService.reorder(jam.id, newOrder)
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failed_to_execute_action'))
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
            console.log('✅ Approving registration:', registrationId)
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
            <div className="flex justify-between items-center">
                <p className="text-3xl font-bold">📋 {t('jam_management.schedule.title')}</p>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {t('jam_management.schedule.add_new_song')}
                </button>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert alert-error">
                    <p>{error}</p>
                    <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">✕</button>
                </div>
            )}

            {/* Schedule List */}
            {sortedSchedules.length > 0 ? (
                <div className="space-y-6">
                    {/* Non-Suggested Schedules */}
                    {nonSuggestedSchedules.length > 0 && (
                        <div className="space-y-4">
                            {nonSuggestedSchedules.map((schedule, index) => (
                                <ScheduleCardManagement
                                    key={schedule.id}
                                    schedule={schedule}
                                    index={index}
                                    loading={loading}
                                    isSuggested={false}
                                    onStatusChange={handleStatusChange}
                                    onDelete={handleDeleteSchedule}
                                    onMoveUp={handleMoveUp}
                                    onMoveDown={handleMoveDown}
                                    maxIndex={nonSuggestedSchedules.length - 1}
                                    onApproveRegistration={handleApproveRegistration}
                                    onRejectRegistration={handleRejectRegistration}
                                    onAddMusician={() => handleAddMusician(schedule)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Suggested Schedules */}
                    {suggestedSchedules.length > 0 && (
                        <div className="space-y-4 mt-6 pt-6 border-t-2 border-info/30">
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
                            {jam.jamMusics?.length
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
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">{t('jam_management.schedule.add_entry_modal')}</h3>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">{t('jam_management.schedule.song_label')}</span>
                            </label>
                            <select
                                value={selectedMusicId}
                                onChange={(e) => setSelectedMusicId(e.target.value)}
                                className="select select-bordered"
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
                            <label className="label">
                                <span className="label-text">{t('jam_management.schedule.order_label')}</span>
                            </label>
                            <input
                                type="text"
                                value={t('jam_management.schedule.order_auto', {count: sortedSchedules.length + 1})}
                                className="input input-bordered"
                                disabled
                            />
                        </div>

                        {error && (
                            <div className="alert alert-error mb-4">
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="modal-action">
                            <button
                                onClick={() => {
                                    setShowAddModal(false)
                                    setError(null)
                                    setSelectedMusicId('')
                                }}
                                className="btn btn-ghost"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleAddSchedule}
                                className="btn btn-primary"
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