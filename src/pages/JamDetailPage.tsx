/**
 * Jam Detail Page
 * Display jam information with registration button and QR code
 */

import {useNavigate, useParams} from 'react-router-dom'
import {useAuth} from '../hooks'
import {
    ErrorAlert,
    PageHeaderSkeleton,
    ScheduleCardSkeleton,
    ScheduleDisplayItem,
    ScheduleEnrollmentModal,
    SidebarSectionSkeleton
} from '../components'
import {jamService, musicService, scheduleService} from '../services'
import type {JamResponseDto, MusicResponseDto, ScheduleResponseDto} from "../types/api.types.ts";
import {useEffect, useState} from "react";
import {getStatusIcon, getStatusLabel} from "../components/schedule/ScheduleDisplayItem.tsx";
import {getInstrumentIcon} from "../components/schedule/RegistrationList.tsx";
import {useTranslation} from 'react-i18next'

export function JamDetailPage() {
    const { t } = useTranslation()
    const {jamId} = useParams<{ jamId: string }>()
    const navigate = useNavigate()
    const {isAuthenticated, user} = useAuth()
    const [jam, setJam] = useState<JamResponseDto | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [showSuggestModal, setShowSuggestModal] = useState(false)
    const [suggestLoading, setSuggestLoading] = useState(false)
    const [suggestError, setSuggestError] = useState<string | null>(null)
    const [suggestSuccess, setSuggestSuccess] = useState<string | null>(null)
    const [allSongs, setAllSongs] = useState<MusicResponseDto[]>([])
    const [selectedSongId, setSelectedSongId] = useState('')

    const [showEnrollModal, setShowEnrollModal] = useState(false)
    const [selectedScheduleForEnroll, setSelectedScheduleForEnroll] = useState<ScheduleResponseDto | null>(null)
    const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null)

    useEffect(() => {
        if (jamId) {
            loadJamData(jamId)
        }
    }, [jamId, navigate])

    const loadJamData = async (id: string) => {
        setLoading(true)
        setError(null)
        try {
            const result = await jamService.findOne(id)
            setJam(result.data)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load jam'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    // Handle enrollment success - reload jam data from API
    const handleEnrollmentSuccess = async () => {
        // Close modal immediately for better UX
        setShowEnrollModal(false)
        setSelectedScheduleForEnroll(null)

        // Show success toast briefly
        setEnrollSuccess('✅ Successfully enrolled!')

        // Reload jam data from API to get the latest state
        if (jamId) {
            loadJamData(jamId)
        }

        // Clear success message after 2 seconds
        setTimeout(() => setEnrollSuccess(null), 2000)
    }

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
            setShowSuggestModal(true)
            setSuggestLoading(true)
            setSuggestError(null)

            // Load all songs for the modal
            try {
                const songs = await musicService.findAll()
                setAllSongs(songs.data || [])
            } catch (err) {
                setSuggestError('Failed to load songs')
            } finally {
                setSuggestLoading(false)
            }
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

            loadJamData(jamId)
        } catch (err) {
            setSuggestError(err instanceof Error ? err.message : 'Failed to suggest song')
        } finally {
            setSuggestLoading(false)
        }
    }

    if (loading && !jam) {
        return (
            <div className="min-h-screen bg-base-100">
                {/* Page Header Skeleton */}
                <PageHeaderSkeleton />

                {/* Loading Text and Spinner */}
                <div className="container mx-auto max-w-4xl px-2 sm:px-4 py-6 sm:py-8">
                    <div className="flex justify-center items-center gap-3 mb-8">
                        <span className="loading loading-spinner loading-md sm:loading-lg"></span>
                        <span className="font-semibold text-sm sm:text-base text-base-content/70">Loading jam details...</span>
                    </div>

                    {/* Main Content Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {/* Main Content Skeletons */}
                        <div className="md:col-span-2 lg:col-span-3 space-y-4 sm:space-y-6 order-2 md:order-1">
                            <ScheduleCardSkeleton />
                            <ScheduleCardSkeleton />
                        </div>

                        {/* Sidebar Skeletons */}
                        <div className="md:col-span-1 lg:col-span-1 space-y-4 order-1 md:order-2">
                            <SidebarSectionSkeleton />
                            <SidebarSectionSkeleton />
                            <SidebarSectionSkeleton />
                        </div>
                    </div>
                </div>
            </div>
        )
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

    return (<div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 animate-in fade-in duration-300">
        {/* Success Alert at Top - for Suggest */}
        {suggestSuccess && (
            <div className="bg-success text-success-content sticky top-0 z-50 animate-in fade-in duration-300">
                <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-center gap-4">
                    <p className="font-semibold text-center flex-1">{suggestSuccess}</p>
                    <button onClick={() => setSuggestSuccess(null)} className="btn btn-ghost btn-sm flex-shrink-0">✕</button>
                </div>
            </div>
        )}

        {/* Success Alert at Top - for Enrollment */}
        {enrollSuccess && (
            <div className="bg-info text-info-content sticky top-0 z-50 animate-in fade-in duration-300">
                <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="loading loading-spinner loading-sm"></span>
                        <p className="font-semibold">{enrollSuccess}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-base-200 to-base-300 border-b border-base-300">
            <div className="container mx-auto max-w-4xl px-2 sm:px-4 py-4 sm:py-6">
                <button
                    onClick={() => navigate('/jams')}
                    className="btn btn-ghost btn-sm mb-4"
                >
                    ← Back to Jams
                </button>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">{jam.name}</h1>
                <p className="text-base-content/70 mt-2">{jam.description}</p>

                {/* Jam Info Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mt-6">
                    <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-base-100/50 rounded">
                        <span className="text-base sm:text-lg">📍</span>
                        <div className="min-w-0">
                            <p className="text-xs text-base-content/60">Location</p>
                            <p className="font-semibold text-xs sm:text-sm truncate">{jam.location || 'TBA'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-base-100/50 rounded">
                        <span className="text-base sm:text-lg">📅</span>
                        <div className="min-w-0">
                            <p className="text-xs text-base-content/60">Date</p>
                            <p className="font-semibold text-xs sm:text-sm">{jam.date ? new Date(jam.date).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                            }) : 'TBA'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-base-100/50 rounded">
                        <span className="text-base sm:text-lg">🎭</span>
                        <div className="min-w-0">
                            <p className="text-xs text-base-content/60">Status</p>
                            <span
                                className={`badge badge-xs sm:badge-sm ${jam.status === 'ACTIVE' ? 'badge-success' : jam.status === 'INACTIVE' ? 'badge-warning' : 'badge-error'}`}>
                                    {jam.status || 'Unknown'}
                                </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-base-100/50 rounded">
                        <span className="text-base sm:text-lg">🎵</span>
                        <div className="min-w-0">
                            <p className="text-xs text-base-content/60">Performances</p>
                            <p className="font-semibold text-xs sm:text-sm">{(jam.schedules?.filter(s => s.status !== 'SUGGESTED')?.length || 0)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-base-100/50 rounded">
                        <span className="text-base sm:text-lg">⏱️</span>
                        <div className="min-w-0">
                            <p className="text-xs text-base-content/60">Duration</p>
                            <p className="font-semibold text-xs sm:text-sm">{(() => {
                                const totalSeconds = (jam.schedules?.filter(s => s.status !== 'SUGGESTED')?.reduce((acc, s) => acc + (s.music?.duration || 0), 0) || 0)
                                const minutes = Math.floor(totalSeconds / 60)
                                const seconds = totalSeconds % 60
                                return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
                            })()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-base-100/50 rounded">
                        <span className="text-base sm:text-lg">👥</span>
                        <div className="min-w-0">
                            <p className="text-xs text-base-content/60">Musicians</p>
                            <p className="font-semibold text-xs sm:text-sm">{new Set(jam.registrations?.map(reg => reg.musician?.id || reg.musician?.contact)).size}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 lg:col-span-3 space-y-4 sm:space-y-6 order-2 md:order-1">

                    {/* Performance Schedule Card - with nested Musicians */}
                    {jam.schedules && jam.schedules.length > 0 ? (<div className="space-y-6">
                        {/* Non-Suggested Schedules */}
                        {(() => {
                            const nonSuggestedSchedules = jam.schedules.filter(s => s.status !== 'SUGGESTED')
                            return nonSuggestedSchedules.length > 0 ? (<div className="card bg-gradient-to-br from-base-200 to-base-300">
                                <div className="card-body p-3 sm:p-6">
                                    <h2 className="card-title text-base sm:text-lg">📋 Performance Schedule</h2>
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
                                <div className="card bg-gradient-to-br from-base-200 to-base-300 border-t-2 border-info/30">
                                    <div className="card-body p-3 sm:p-6">
                                        <h2 className="card-title text-base sm:text-lg flex items-center gap-2">
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
                    </div>) : (<div className="card bg-gradient-to-br from-base-200 to-base-300">
                        <div className="card-body text-center py-6 sm:py-8 px-3 sm:px-6">
                            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📋</div>
                            <h3 className="font-semibold text-base sm:text-lg mb-2">No Performance Schedule Yet</h3>
                            <p className="text-xs sm:text-sm text-base-content/70">
                                Schedule will be organized once musicians are registered.
                            </p>
                        </div>
                    </div>)}

                </div>

                {/* Sidebar - QR Code and Registration */}
                <div className="md:col-span-1 lg:col-span-1 space-y-4 order-1 md:order-2">

                    {/* How This Jam Works Card */}
                    <div className="card bg-gradient-to-br from-primary to-primary-focus text-primary-content">
                        <div className="card-body p-3 sm:p-6">
                            <h2 className="card-title text-base sm:text-lg">{t('jams.how_it_works.title')}</h2>
                            <div
                                className="divider my-2 before:bg-primary-content/20 after:bg-primary-content/20"></div>

                            {/* Jam Description */}
                            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm opacity-95 mb-4">
                                <div className="flex gap-1 sm:gap-2">
                                    <span className="text-base sm:text-lg min-w-fit">📋</span>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-xs sm:text-sm">{t('jams.how_it_works.view_schedule')}</p>
                                        <p className="text-xs opacity-75">{t('jams.how_it_works.view_schedule_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 sm:gap-2">
                                    <span className="text-base sm:text-lg min-w-fit">📝</span>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-xs sm:text-sm">{t('jams.how_it_works.register_songs')}</p>
                                        <p className="text-xs opacity-75">{t('jams.how_it_works.register_songs_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 sm:gap-2">
                                    <span className="text-base sm:text-lg min-w-fit">✨</span>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-xs sm:text-sm">{t('jams.how_it_works.suggest_songs')}</p>
                                        <p className="text-xs opacity-75">{t('jams.how_it_works.suggest_songs_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 sm:gap-2">
                                    <span className="text-base sm:text-lg min-w-fit">👥</span>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-xs sm:text-sm">{t('jams.how_it_works.collaborate')}</p>
                                        <p className="text-xs opacity-75">{t('jams.how_it_works.collaborate_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 sm:gap-2">
                                    <span className="text-base sm:text-lg min-w-fit">🎵</span>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-xs sm:text-sm">{t('jams.how_it_works.performance_time')}</p>
                                        <p className="text-xs opacity-75">{t('jams.how_it_works.performance_time_desc')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-2">
                                <button
                                    onClick={handleSuggestClick}
                                    className="btn btn-secondary w-full font-bold"
                                >
                                    {t('jams.how_it_works.suggest_btn')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* QR Code Card */}
                    {jam.qrCode && (<div className="card bg-gradient-to-br from-base-200 to-base-300">
                        <div className="card-body p-3 sm:p-6">
                            <h2 className="card-title text-base sm:text-lg text-center">{t('jams.qr_code')}</h2>
                            <div className="flex justify-center my-4">
                                <img
                                    src={jam.qrCode}
                                    alt="Jam QR Code"
                                    className="w-full max-w-xs border-2 border-base-300 rounded-lg"
                                />
                            </div>
                            <p className="text-xs text-center text-base-content/70">
                                {t('jams.scan_to_share')}
                            </p>
                        </div>
                    </div>)}

                    {/* Current Registrations Card */}
                    {userRegistration && (<div className="card bg-info  text-info-content">
                            <div className="card-body p-3 sm:p-6">
                                <h2 className="card-title text-sm sm:text-lg">{t('jams.applied_to_title', { name: user?.name })}</h2>
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
                                                            className="badge badge-outline badge-sm flex-shrink-0">{(getStatusIcon(reg.status, false))}  {(getStatusLabel(reg.status, false, t))}</span>
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
            onSuccess={handleEnrollmentSuccess}
        />)}

        {/* Suggest Song Modal */}
        {showSuggestModal && (<div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-sm">
                <h3 className="font-bold text-base sm:text-lg mb-4">{t('jams.suggest_modal_title')}</h3>

                {suggestError && (<div className="alert alert-error mb-4 animate-in fade-in duration-300">
                    <p>{suggestError}</p>
                </div>)}

                {suggestLoading && !allSongs.length && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="loading loading-spinner loading-sm"></span>
                            <span className="text-sm text-base-content/70 font-semibold">{t('jams.loading_songs')}</span>
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">{t('jams.select_song')}</span>
                            </label>
                            <div className="skeleton h-12 w-full rounded"></div>
                        </div>
                    </div>
                )}

                {!suggestLoading && (
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text">{t('jams.select_song')}</span>
                        </label>
                        <select
                            value={selectedSongId}
                            onChange={(e) => setSelectedSongId(e.target.value)}
                            className="select select-bordered"
                            disabled={suggestLoading}
                        >
                            <option value="">{t('jams.choose_song')}</option>
                            {allSongs.map((song) => (<option key={song.id} value={song.id}>
                                {song.title} - {song.artist}
                            </option>))}
                        </select>
                    </div>
                )}

                <div className="text-sm text-base-content/70 mb-4 p-3 bg-base-200 rounded">
                    <p className="font-semibold mb-2">{t('jams.how_it_works_short')}</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>{t('jams.how_it_works_list.select')}</li>
                        <li>{t('jams.how_it_works_list.slot')}</li>
                        <li>{t('jams.how_it_works_list.review')}</li>
                        <li>{t('jams.how_it_works_list.register')}</li>
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

