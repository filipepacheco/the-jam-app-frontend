/**
 * Jam Detail Page
 * Display jam information with registration button and QR code
 */

import {useNavigate, useParams} from 'react-router-dom'
import {useAuth, useJam} from '../hooks'
import {ErrorAlert, ScheduleDisplayItem, ScheduleEnrollmentModal} from '../components'
import {scheduleService} from '../services/scheduleService'
import {musicService} from '../services/musicService'
import type {MusicResponseDto, ScheduleResponseDto} from "../types/api.types.ts";
import {useState} from "react";
import {getStatusIcon, getStatusLabel} from "../components/schedule/ScheduleDisplayItem.tsx";
import {getInstrumentIcon} from "../components/schedule/RegistrationList.tsx";

export function JamDetailPage() {
    const {jamId} = useParams<{ jamId: string }>()
    const navigate = useNavigate()
    const {isAuthenticated, user} = useAuth()
    const {data: jam, loading, error, refetch} = useJam(jamId || '')

    const [showSuggestModal, setShowSuggestModal] = useState(false)
    const [suggestLoading, setSuggestLoading] = useState(false)
    const [suggestError, setSuggestError] = useState<string | null>(null)
    const [suggestSuccess, setSuggestSuccess] = useState<string | null>(null)
    const [allSongs, setAllSongs] = useState<MusicResponseDto[]>([])
    const [selectedSongId, setSelectedSongId] = useState('')

    const [showEnrollModal, setShowEnrollModal] = useState(false)
    const [selectedScheduleForEnroll, setSelectedScheduleForEnroll] = useState<ScheduleResponseDto | null>(null)

    // Check if current user is already registered in this jam
    const userRegistration = jam?.registrations?.find((reg) => reg.musician?.contact === user?.contact || reg.musician?.id === user?.id)

    const handleEnrollClick = (schedule: ScheduleResponseDto) => {
        if (!isAuthenticated) {
            navigate(`/login?redirect=/jams/${jamId}`)
        } else {
            setSelectedScheduleForEnroll(schedule)
            setShowEnrollModal(true)
        }
    }

    const handleSuggestClick = async () => {
        if (!isAuthenticated) {
            navigate(`/login?redirect=/jams/${jamId}`)
        } else {
            // Load all songs for the modal
            try {
                const songs = await musicService.findAll()
                setAllSongs(songs.data || [])
            } catch (err) {
                setSuggestError('Failed to load songs')
            }
            setShowSuggestModal(true)
        }
    }

    const handleSuggestSong = async () => {
        if (!selectedSongId || !jamId) {
            setSuggestError('Please select a song')
            return
        }

        setSuggestLoading(true)
        setSuggestError(null)

        try {
            await scheduleService.create({
                jamId, musicId: selectedSongId, order: 0, status: 'SUGGESTED',
            } as any)

            setSuggestSuccess('Song suggested successfully! Host will review it.')
            setSelectedSongId('')
            setShowSuggestModal(false)

            // Refetch jam data to show new schedule
            setTimeout(() => {
                refetch?.()
            }, 1000)
        } catch (err) {
            setSuggestError(err instanceof Error ? err.message : 'Failed to suggest song')
        } finally {
            setSuggestLoading(false)
        }
    }

    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center bg-base-100">
            <div className="loading loading-spinner loading-lg"></div>
        </div>)
    }

    if (error || !jam) {
        return (<div className="min-h-screen bg-base-100 p-4">
            <div className="container mx-auto max-w-4xl">
                <ErrorAlert message={error || 'Jam not found'} title="Error Loading Jam"/>
                <button onClick={() => navigate('/jams')} className="btn btn-primary mt-4">
                    ← Back to Jams
                </button>
            </div>
        </div>)
    }

    return (<div className="min-h-screen bg-base-100">
        {/* Success Alert at Top */}
        {suggestSuccess && (
            <div className="bg-success text-success-content sticky top-0 z-50">
                <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-center gap-4">
                    <p className="font-semibold text-center flex-1">{suggestSuccess}</p>
                    <button onClick={() => setSuggestSuccess(null)} className="btn btn-ghost btn-sm flex-shrink-0">✕</button>
                </div>
            </div>
        )}

        {/* Header */}
        <div className="bg-base-200 border-b border-base-300">
            <div className="container mx-auto max-w-4xl px-4 py-6">
                <button
                    onClick={() => navigate('/jams')}
                    className="btn btn-ghost btn-sm mb-4"
                >
                    ← Back to Jams
                </button>
                <h1 className="text-4xl font-bold">{jam.name}</h1>
                <p className="text-base-content/70 mt-2">{jam.description}</p>
            </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Jam Info Card */}
                    <div className="card bg-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-lg">🎵 Jam Information</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-base-100 rounded">
                                    <span className="text-xl">📅</span>
                                    <div>
                                        <p className="text-xs text-base-content/60">Date</p>
                                        <p className="font-semibold">{jam.date ? new Date(jam.date).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                        }) : 'TBA'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-base-100 rounded">
                                    <span className="text-xl">🎭</span>
                                    <div>
                                        <p className="text-xs text-base-content/60">Status</p>
                                        <span
                                            className={`badge badge-lg ${jam.status === 'ACTIVE' ? 'badge-success' : jam.status === 'INACTIVE' ? 'badge-warning' : 'badge-error'}`}>
                                                {jam.status || 'Unknown'}
                                            </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-base-100 rounded">
                                    <span className="text-xl">🎵</span>
                                    <div>
                                        <p className="text-xs text-base-content/60">Performances</p>
                                        <p className="font-semibold text-lg">{(jam.schedules?.filter(s => s.status !== 'SUGGESTED')?.length || 0)} {(jam.schedules?.filter(s => s.status !== 'SUGGESTED')?.length || 0) === 1 ? 'Song' : 'Songs'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-base-100 rounded">
                                    <span className="text-xl">⏱️</span>
                                    <div>
                                        <p className="text-xs text-base-content/60">Total Duration</p>
                                        <p className="font-semibold text-lg">{(() => {
                                            const totalSeconds = (jam.schedules?.filter(s => s.status !== 'SUGGESTED')?.reduce((acc, s) => acc + (s.music?.duration || 0), 0) || 0)
                                            const minutes = Math.floor(totalSeconds / 60)
                                            const seconds = totalSeconds % 60
                                            return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
                                        })()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Schedule Card - with nested Musicians */}
                    {jam.schedules && jam.schedules.length > 0 ? (<div className="space-y-6">
                        {/* Non-Suggested Schedules */}
                        {(() => {
                            const nonSuggestedSchedules = jam.schedules.filter(s => s.status !== 'SUGGESTED')
                            return nonSuggestedSchedules.length > 0 ? (<div className="card bg-base-200">
                                <div className="card-body">
                                    <h2 className="card-title text-lg">📋 Performance Schedule</h2>
                                    <div className="space-y-4">
                                        {nonSuggestedSchedules.map((schedule: ScheduleResponseDto) => {
                                            const userEnrolledInSchedule = schedule.registrations?.some((reg) => reg.musician?.contact === user?.contact || reg.musician?.id === user?.id)
                                            return (<ScheduleDisplayItem
                                                key={schedule.id}
                                                schedule={schedule}
                                                isSuggested={false}
                                                userRegisteredForSchedule={userEnrolledInSchedule || false}
                                                onEnrollClick={() => handleEnrollClick(schedule)}
                                            />)
                                        })}
                                    </div>
                                </div>
                            </div>) : null
                        })()}

                        {/* Suggested Schedules */}
                        {(() => {
                            const suggestedSchedules = jam.schedules.filter(s => s.status === 'SUGGESTED')
                            return suggestedSchedules.length > 0 ? (
                                <div className="card bg-base-200 border-t-2 border-info/30">
                                    <div className="card-body">
                                        <h2 className="card-title text-lg flex items-center gap-2">
                                            <span className="text-xl">✨</span>
                                            Suggested Songs (Pending Approval)
                                        </h2>
                                        <div className="space-y-4">
                                            {suggestedSchedules.map((schedule: ScheduleResponseDto) => {
                                                const userEnrolledInSchedule = schedule.registrations?.some((reg) => reg.musician?.contact === user?.contact || reg.musician?.id === user?.id)
                                                return (<ScheduleDisplayItem
                                                        key={schedule.id}
                                                        schedule={schedule}
                                                        isSuggested={true}
                                                        userRegisteredForSchedule={userEnrolledInSchedule || false}
                                                        onEnrollClick={() => handleEnrollClick(schedule)}
                                                    />)
                                            })}
                                        </div>
                                    </div>
                                </div>) : null
                        })()}
                    </div>) : (<div className="card bg-base-200">
                        <div className="card-body text-center py-8">
                            <div className="text-4xl mb-3">📋</div>
                            <h3 className="font-semibold mb-2">No Performance Schedule Yet</h3>
                            <p className="text-sm text-base-content/70">
                                Schedule will be organized once musicians are registered.
                            </p>
                        </div>
                    </div>)}

                </div>

                {/* Sidebar - QR Code and Registration */}
                <div className="md:col-span-1 space-y-4">

                    {/* How This Jam Works Card */}
                    <div className="card bg-primary text-primary-content">
                        <div className="card-body">
                            <h2 className="card-title text-lg">🎭 How This Jam Works</h2>
                            <div
                                className="divider my-2 before:bg-primary-content/20 after:bg-primary-content/20"></div>

                            {/* Jam Description */}
                            <div className="space-y-3 text-sm opacity-95 mb-4">
                                <div className="flex gap-2">
                                    <span className="text-lg min-w-fit">🎵</span>
                                    <div>
                                        <p className="font-semibold">Performance Schedule</p>
                                        <p className="text-xs opacity-75">Songs are performed in order. Each
                                            song has specific musician roles needed.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-lg min-w-fit">✨</span>
                                    <div>
                                        <p className="font-semibold">Suggest Songs</p>
                                        <p className="text-xs opacity-75">Want to add a new song? Suggest it and
                                            a new schedule slot will be created.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-2">
                                <button
                                    onClick={handleSuggestClick}
                                    className="btn btn-secondary w-full font-bold"
                                >
                                    🎵 Suggest a Song
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* QR Code Card */}
                    {jam.qrCode && (<div className="card bg-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-lg text-center">📱 QR Code</h2>
                            <div className="flex justify-center my-4">
                                <img
                                    src={jam.qrCode}
                                    alt="Jam QR Code"
                                    className="w-full max-w-xs border-2 border-base-300 rounded-lg"
                                />
                            </div>
                            <p className="text-xs text-center text-base-content/70">
                                Scan to share or join this jam
                            </p>
                        </div>
                    </div>)}

                    {/* Current Registrations Card */}
                    {userRegistration && (<div className="card bg-info text-info-content">
                            <div className="card-body">
                                <h2 className="card-title text-lg">{user?.name}, songs you applied to:</h2>
                                <div
                                    className="divider my-2 before:bg-info-content/20 after:bg-info-content/20"></div>
                                <div className="space-y-3">
                                    {jam?.registrations
                                        ?.filter((reg) => reg.musician?.contact === user?.contact || reg.musician?.id === user?.id)
                                        .map((reg, idx) => {
                                            const schedule = jam.schedules?.find(s => s.id === reg.scheduleId)
                                            return (<div key={idx} className="bg-info-content/20 p-3 rounded">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p>
                                                                <span className="text-xs">{ getInstrumentIcon(reg.instrument) }</span>
                                                                <span className="font-semibold text-sm truncate ml-1">{schedule?.music?.title}</span>
                                                                <span className="text-xs opacity-75 truncate ml-1">{schedule?.music?.artist}</span>
                                                            </p>
                                                        </div>
                                                        <span
                                                            className="badge badge-outline badge-sm flex-shrink-0">{(getStatusIcon(reg.status, false))}  {(getStatusLabel(reg.status, false))}</span>
                                                    </div>
                                                </div>)
                                        })}
                                </div>
                            </div>
                        </div>)}


                </div>
            </div>
        </div>

        {/* Enrollment Modal */}
        {selectedScheduleForEnroll && (<ScheduleEnrollmentModal
            schedule={selectedScheduleForEnroll}
            isOpen={showEnrollModal}
            onClose={() => {
                setShowEnrollModal(false)
                setSelectedScheduleForEnroll(null)
            }}
            onSuccess={() => refetch?.()}
        />)}

        {/* Suggest Song Modal */}
        {showSuggestModal && (<div className="modal modal-open">
            <div className="modal-box max-w-sm">
                <h3 className="font-bold text-lg mb-4">🎵 Suggest a Song</h3>

                {suggestError && (<div className="alert alert-error mb-4">
                    <p>{suggestError}</p>
                </div>)}

                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">Select Song *</span>
                    </label>
                    <select
                        value={selectedSongId}
                        onChange={(e) => setSelectedSongId(e.target.value)}
                        className="select select-bordered"
                    >
                        <option value="">Choose a song...</option>
                        {allSongs.map((song) => (<option key={song.id} value={song.id}>
                            {song.title} - {song.artist}
                        </option>))}
                    </select>
                </div>

                <div className="text-sm text-base-content/70 mb-4 p-3 bg-base-200 rounded">
                    <p className="font-semibold mb-2">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Select a song from the library</li>
                        <li>A new slot will be added to the schedule</li>
                        <li>The host will review and approve it</li>
                        <li>You can then register to perform</li>
                    </ul>
                </div>

                <div className="modal-action">
                    <button
                        onClick={() => {
                            setShowSuggestModal(false)
                            setSelectedSongId('')
                            setSuggestError(null)
                        }}
                        className="btn btn-ghost"
                        disabled={suggestLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSuggestSong}
                        className="btn btn-primary"
                        disabled={suggestLoading || !selectedSongId}
                    >
                        {suggestLoading ? (<>
                            <span className="loading loading-spinner loading-sm"></span>
                            Suggesting...
                        </>) : ('Suggest Song')}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={() => setShowSuggestModal(false)}></div>
        </div>)}
    </div>)
}

export default JamDetailPage

