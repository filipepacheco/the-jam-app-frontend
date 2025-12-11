/**
 * Jam Management Hub Page
 * Central control center for managing all aspects of a jam session
 * Route: /host/jams/:id/manage
 */

import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useAuth} from '../hooks'
import {jamService, registrationService, scheduleService} from '../services'
import type {JamMusicResponseDto, JamResponseDto, ScheduleResponseDto} from '../types/api.types'
import {ErrorAlert, ScheduleCard, SuccessAlert} from '../components'
import {HostMusicianRegistrationModal} from '../components/schedule'

type TabType = 'overview' | 'registrations' | 'schedule' | 'dashboard' | 'analytics'

export function JamManagementPage() {
    const navigate = useNavigate()
    const {id: jamId} = useParams<{ id: string }>()
    const {isAuthenticated, isLoading: authLoading} = useAuth()

    const [activeTab, setActiveTab] = useState<TabType>('overview')
    const [jam, setJam] = useState<JamResponseDto | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        if (authLoading) {
            return
        }

        if (!isAuthenticated) {
            navigate('/login')
            return
        }

        if (jamId) {
            loadJamData(jamId)
        }
    }, [jamId, isAuthenticated, authLoading, navigate])

    const loadJamData = async (id: string) => {
        setLoading(true)
        setError(null)

        try {
            console.log('🔍 Loading jam data for management hub...')
            const result = await jamService.findOne(id)
            console.log('✅ Jam data loaded:', result.data)
            setJam(result.data)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load jam'
            console.error('❌ Error loading jam:', err)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (newStatus: 'ACTIVE' | 'INACTIVE' | 'FINISHED') => {
        if (!jamId || !jam) return

        const confirmMessage =
            newStatus === 'ACTIVE'
                ? 'Are you sure you want to start this jam session?'
                : newStatus === 'FINISHED'
                    ? 'Are you sure you want to end this jam session? This action cannot be undone.'
                    : 'Are you sure you want to change the jam status?'

        if (!confirm(confirmMessage)) {
            return
        }

        setLoading(true)
        setError(null)

        try {
            await jamService.update(jamId, {status: newStatus})
            setSuccess(`Jam status updated to ${newStatus}`)
            await loadJamData(jamId)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update jam status'
            console.error('❌ Error updating jam status:', err)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    // Show loading spinner while auth is initializing
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        )
    }

    if (loading && !jam) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        )
    }

    if (error && !jam) {
        return (
            <div className="min-h-screen bg-base-100 p-4">
                <div className="container mx-auto max-w-6xl">
                    <ErrorAlert message={error} title="Error Loading Jam"/>
                    <button onClick={() => navigate('/host/dashboard')} className="btn btn-primary mt-4">
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    if (!jam) {
        return null
    }

    const getStatusBadgeColor = () => {
        switch (jam.status) {
            case 'ACTIVE':
                return 'badge-success'
            case 'INACTIVE':
                return 'badge-warning'
            case 'FINISHED':
                return 'badge-error'
            default:
                return 'badge-outline'
        }
    }

    const tabs: { id: TabType; label: string; icon: string }[] = [
        {id: 'overview', label: 'Overview', icon: '📊'},
        {id: 'schedule', label: 'Schedule', icon: '📋'},
        // {id: 'dashboard', label: 'Dashboard', icon: '📺'},
        // {id: 'analytics', label: 'Analytics', icon: '📈'},
        // {id: 'registrations', label: 'Registrations', icon: '👥'},
    ]

    return (
        <div className="min-h-screen bg-base-100">
            {/* Header */}
            <div className="bg-base-200 border-b border-base-300">
                <div className="container mx-auto max-w-6xl px-4 py-4">
                    {/* Breadcrumb */}
                    <div className="text-sm breadcrumbs mb-2">
                        <ul>
                            <li>
                                <button onClick={() => navigate('/host/dashboard')} className="link link-hover">
                                    Dashboard
                                </button>
                            </li>
                            <li>{jam.name}</li>
                            <li>Manage</li>
                        </ul>
                    </div>

                    {/* Title and Status */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold">🎭 {jam.name}</h1>
                        <div className={`badge ${getStatusBadgeColor()} badge-lg`}>{jam.status}</div>
                    </div>
                </div>
            </div>


            {/* Tab Navigation */}
            <div className="border-b border-base-300 bg-base-200">
                <div className="container mx-auto max-w-6xl px-4">
                    <div className="tabs tabs-boxed bg-transparent gap-2 py-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Alerts */}
            <div className="container sticky top-0 z-50 mx-auto max-w-6xl px-4 mt-4">
                {error && <ErrorAlert message={error} onDismiss={() => setError(null)}/>}
                {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)}/>}
            </div>

            {/* Tab Content */}
            <div className="container mx-auto max-w-8xl px-4 py-8">
                {activeTab === 'overview' && (
                    <OverviewTab jam={jam} onStatusChange={handleStatusChange} loading={loading}/>
                )}
                {activeTab === 'registrations' && (
                    <RegistrationsTab jam={jam}/>
                )}
                {activeTab === 'schedule' && (
                    <ScheduleTab jam={jam} onReload={() => loadJamData(jamId!)}/>
                )}
                {activeTab === 'dashboard' && <DashboardTab jam={jam}/>}
                {activeTab === 'analytics' && <AnalyticsTab jam={jam}/>}
            </div>


        </div>
    )
}

/**
 * Overview Tab Component
 */
function OverviewTab({
                         jam,
                         onStatusChange,
                         loading,
                     }: {
    jam: JamResponseDto
    onStatusChange: (status: 'ACTIVE' | 'INACTIVE' | 'FINISHED') => void
    loading: boolean
}) {
    const navigate = useNavigate()

    const uniqueMusicians = new Set<string>()
    jam.registrations?.forEach((reg) => uniqueMusicians.add(reg.musicianId))

    return (
        <div className="space-y-6">


            {/* Quick Actions & Status Controls - Merged */}
            <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                    <h2 className="card-title">Actions & Controls</h2>

                    {/* Quick Actions Section */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <button
                                onClick={() => navigate(`/host/jams/${jam.id}/edit`)}
                                className="btn btn-primary"
                            >
                                ✏️ Edit Jam
                            </button>
                            <button onClick={() => navigate(`/jams/${jam.id}`)} className="btn btn-secondary">
                                👁️ View Public Page
                            </button>
                            {jam.status === 'INACTIVE' && (
                                <button
                                    onClick={() => onStatusChange('ACTIVE')}
                                    className="btn btn-success"
                                    disabled={loading}
                                >
                                    ▶️ Start Jam
                                </button>
                            )}
                            {jam.status === 'ACTIVE' && (
                                <button
                                    onClick={() => onStatusChange('FINISHED')}
                                    className="btn btn-error"
                                    disabled={loading}
                                >
                                    ⏹️ End Jam
                                </button>
                            )}
                            {jam.status === 'FINISHED' && (
                                <button
                                    onClick={() => onStatusChange('INACTIVE')}
                                    className="btn btn-warning"
                                    disabled={loading}
                                >
                                    🔄 Reactivate Jam
                                </button>
                            )}
                        </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stats shadow bg-base-200">
                    <div className="stat">
                        <div className="stat-title">Performances</div>
                        <div className="stat-value text-success">{jam.schedules?.length || 0}</div>
                    </div>
                </div>
                <div className="stats shadow bg-base-200">
                    <div className="stat">
                        <div className="stat-title">Registrations</div>
                        <div className="stat-value text-accent">{jam.registrations?.length || 0}</div>
                    </div>
                </div>
                <div className="stats shadow bg-base-200">
                    <div className="stat">
                        <div className="stat-title">Musicians</div>
                        <div className="stat-value text-secondary">{uniqueMusicians.size}</div>
                    </div>
                </div>
            </div>

            {/* Jam Info Card */}
            <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                    <h2 className="card-title">Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <p className="text-sm text-base-content/70">Description</p>
                            <p className="font-semibold">{jam.description || 'No description'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-base-content/70">Date</p>
                            <p className="font-semibold">
                                {jam.date ? new Date(jam.date).toLocaleString() : 'Not set'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-base-content/70">Host</p>
                            <p className="font-semibold">{jam.hostName}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


/**
 * Registrations Tab Component
 */
function RegistrationsTab({jam}: { jam: JamResponseDto }) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">👥 Registrations Management</h2>

            {jam.registrations && jam.registrations.length > 0 ? (
                <div className="space-y-2">
                    {jam.registrations.map((registration) => (
                        <div key={registration.id} className="card bg-base-200 shadow">
                            <div className="card-body p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">{registration.musician?.name}</h3>
                                        <p className="text-sm text-base-content/70">
                                            {registration.musician?.instrument}
                                        </p>
                                    </div>
                                    <div className="badge badge-outline">{registration.status}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="alert">
                    <p>No registrations yet.</p>
                </div>
            )}
        </div>
    )
}

/**
 * Schedule Tab Component - Full management with nested registrations
 * Matches JamDetailPage view but with management controls
 */
function ScheduleTab({jam, onReload}: { jam: JamResponseDto; onReload: () => void }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedMusicId, setSelectedMusicId] = useState('')
    const [showHostRegistrationModal, setShowHostRegistrationModal] = useState(false)
    const [selectedScheduleForRegistration, setSelectedScheduleForRegistration] = useState<ScheduleResponseDto | null>(null)

    const sortedSchedules = [...(jam.schedules || [])].sort((a, b) => a.order - b.order)

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
            setError(err instanceof Error ? err.message : 'Failed to update status')
        } finally {
            setLoading(false)
        }
    }

    // Handle schedule deletion
    const handleDeleteSchedule = async (scheduleId: string) => {
        if (!confirm('Are you sure you want to delete this schedule entry?')) return
        setLoading(true)
        setError(null)
        try {
            await scheduleService.remove(scheduleId)
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete schedule')
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
            setError(err instanceof Error ? err.message : 'Failed to reorder')
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
            setError(err instanceof Error ? err.message : 'Failed to reorder')
        } finally {
            setLoading(false)
        }
    }

    // Handle add schedule
    const handleAddSchedule = async () => {
        if (!selectedMusicId) {
            setError('Please select a song')
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
            } as any )
            setShowAddModal(false)
            setSelectedMusicId('')
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create schedule')
        } finally {
            setLoading(false)
        }
    }

    // Handle reject registration (delete)
    const handleRejectRegistration = async (registrationId: string) => {
        if (!confirm('Are you sure you want to reject this registration?')) return
        setLoading(true)
        try {
            await registrationService.remove(registrationId)
            onReload()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reject registration')
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
            await registrationService.update(registrationId, { status: 'APPROVED' })
            onReload()
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to approve registration'
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
                <p className="text-3xl font-bold">📋 Song Setlist</p>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary"
                    disabled={loading}
                >
                    + Add New Song
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
                    {(() => {
                        const nonSuggestedSchedules = sortedSchedules.filter(s => s.status !== 'SUGGESTED')
                        return nonSuggestedSchedules.length > 0 ? (
                            <div className="space-y-4">
                                {nonSuggestedSchedules.map((schedule, index) => (
                                    <ScheduleCard
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
                        ) : null
                    })()}

                    {/* Suggested Schedules */}
                    {(() => {
                        const suggestedSchedules = sortedSchedules.filter(s => s.status === 'SUGGESTED')
                        return suggestedSchedules.length > 0 ? (
                            <div className="space-y-4 mt-6 pt-6 border-t-2 border-info/30">
                                <h3 className="text-3xl font-semibold flex items-center gap-2">
                                    ✨ Suggested Songs (Pending Approval)
                                </h3>
                                {suggestedSchedules.map((schedule) => (
                                    <ScheduleCard
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
                        ) : null
                    })()}
                </div>
            ) : (
                <div className="card bg-base-200">
                    <div className="card-body text-center py-8">
                        <div className="text-4xl mb-3">📋</div>
                        <h3 className="font-semibold mb-2">No Performance Schedule Yet</h3>
                        <p className="text-sm text-base-content/70">
                            {jam.jamMusics?.length
                                ? 'Click "Add Entry" to create your first schedule.'
                                : 'Add songs to your jam first, then create your schedule.'}

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
                        <h3 className="font-bold text-lg mb-4">Add Performance Entry</h3>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Song *</span>
                            </label>
                            <select
                                value={selectedMusicId}
                                onChange={(e) => setSelectedMusicId(e.target.value)}
                                className="select select-bordered"
                            >
                                <option value="">Select a song...</option>
                                {jam.jamMusics?.map((jm: JamMusicResponseDto) => (
                                    <option key={jm.id} value={jm.music?.id || jm.musicId}>
                                        {jm.music?.title || 'Unknown'} - {jm.music?.artist || 'Unknown'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Order</span>
                            </label>
                            <input
                                type="text"
                                value={`#${sortedSchedules.length + 1} (auto-assigned)`}
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
                                Cancel
                            </button>
                            <button
                                onClick={handleAddSchedule}
                                className="btn btn-primary"
                                disabled={loading || !selectedMusicId}
                            >
                                {loading ?
                                    <span className="loading loading-spinner loading-sm"></span> : 'Add to Schedule'}
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAddModal(false)}></div>
                </div>
            )}
        </div>
    )
}

/**
 * Dashboard Tab Component
 */
function DashboardTab({jam}: { jam: JamResponseDto }) {
    const navigate = useNavigate()

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">📺 Public Dashboard View</h2>
            <div className="alert alert-info">
                <p>This will show what the audience and musicians see on the public dashboard.</p>
            </div>
            <button
                onClick={() => navigate(`/jams/${jam.id}`)}
                className="btn btn-primary"
            >
                Open Public View
            </button>
        </div>
    )
}

/**
 * Analytics Tab Component
 */
function AnalyticsTab({jam}: { jam: JamResponseDto }) {
    const uniqueMusicians = new Set<string>()
    jam.registrations?.forEach((reg) => uniqueMusicians.add(reg.musicianId))

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">📈 Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-base-200 shadow">
                    <div className="card-body">
                        <h3 className="font-semibold">Total Songs</h3>
                        <p className="text-3xl font-bold">{jam.jamMusics?.length || 0}</p>
                    </div>
                </div>
                <div className="card bg-base-200 shadow">
                    <div className="card-body">
                        <h3 className="font-semibold">Unique Musicians</h3>
                        <p className="text-3xl font-bold">{uniqueMusicians.size}</p>
                    </div>
                </div>
                <div className="card bg-base-200 shadow">
                    <div className="card-body">
                        <h3 className="font-semibold">Performances</h3>
                        <p className="text-3xl font-bold">{jam.schedules?.length || 0}</p>
                    </div>
                </div>
            </div>

            {jam.status === 'FINISHED' && (
                <div className="alert alert-success">
                    <p>✅ This jam session has been completed. Export analytics coming soon!</p>
                </div>
            )}
        </div>
    )
}

export default JamManagementPage
