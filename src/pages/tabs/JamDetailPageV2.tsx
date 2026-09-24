/**
 * JamDetailPageV2
 * Waveform Pulse Timeline Design - Modern minimal with music-themed elements
 */

import {useNavigate, useParams} from 'react-router-dom'
import {SITE_URL} from '../../lib/api'
import {useAuth, useJamParticipationController} from '../../hooks'
import useSWR from 'swr'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {SEO} from '../../components/SEO'
import {getJamPath} from '../../utils/jamUrl'
import {authPath} from '../../utils/navigationUtils'
import {translationKey} from '../../lib/i18n/translationKeys'
import {formatDateTime, normalizeLocale} from '../../lib/i18n/applicationLocale'
import {musicianService} from '../../services/musicianService'
import {
    Action,
    DropdownMenu,
    IconAction,
    ScheduleEnrollmentModal,
    useToast,
} from '../../components'
import {ShareModal} from '../../components/ShareModal'
import {SpotifyLogo} from '../../components/SpotifyPreview'
import {
    CollapsibleSection,
    DualActionFAB,
    JamDetailLoadingSkeleton,
    REACTION_BAR_SPACE,
    ReactionBar,
    PerformanceSelectionModal,
    SuggestSongModal,
    SuggestNewSongModal,
    TimelineShowcaseV2Waveform,
} from '../../components/jam-detail-v2/'
import type {JamResponseDto, RegistrationResponseDto, ScheduleResponseDto} from '../../types/api.types'
import {getInstrumentIcon} from "../../lib/schedule/instrumentHelpers.tsx";
import {activeRegistrations} from '../../utils/musicianUtils'
import {formatJamDuration} from '../../lib/formatters'
import {MapPin, Calendar, Share2, Music, Users, Clock3, ChevronDown} from 'lucide-react'
import './JamDetailPageV2.css'

export type JamDetailViewState =
    | {status: 'loaded'; jam: JamResponseDto}
    | {status: 'loading'}
    | {status: 'error'; message: string}
    | {status: 'not-found'}

interface JamDetailPageV2Props {
    /** Deterministic route-state seam for direct composition evidence. */
    viewState?: JamDetailViewState
    onNavigate?: (path: string) => void
    onRetry?: () => void | Promise<void>
}

const JAM_DETAIL_CONTAINER_CLASS = 'mx-auto w-full max-w-4xl px-4 sm:px-6'

export function JamDetailPageV2({viewState, onNavigate, onRetry}: JamDetailPageV2Props = {}) {
    const {t, i18n} = useTranslation()
    const {showToast} = useToast()
    const {jamId} = useParams<{ jamId: string }>()
    const navigate = useNavigate()
    const {isAuthenticated, user} = useAuth()

    const {data: routeJam, error: routeError, isLoading: routeLoading, mutate: mutateJam} = useSWR<JamResponseDto | null>(
        jamId && !viewState ? `/jams/${jamId}` : null,
        // A Jam about to start or on stage refreshes, so the reaction bar comes and goes by itself.
        {refreshInterval: (latest?: JamResponseDto | null) => latest?.status === 'ACTIVE' || latest?.status === 'LIVE' ? 60000 : 0},
    )
    const jam = viewState?.status === 'loaded' ? viewState.jam : routeJam
    const {data: hostProfileResponse} = useSWR(
        jam?.hostMusicianId && (!jam.hostName || !jam.hostContact) ? `/musicos/${jam.hostMusicianId}` : null,
        () => musicianService.findOne(jam!.hostMusicianId!),
    )
    const hostName = jam?.hostName || hostProfileResponse?.data?.name || ''
    const hostContact = jam?.hostContact || hostProfileResponse?.data?.contact || hostProfileResponse?.data?.email || hostProfileResponse?.data?.phone || ''
    const jamError = viewState?.status === 'error' ? new Error(viewState.message) : routeError
    const isLoading = viewState?.status === 'loading' || (!viewState && routeLoading)
    const goTo = useCallback((path: string) => {
        if (onNavigate) {
            onNavigate(path)
            return
        }
        void navigate(path)
    }, [navigate, onNavigate])
    const reloadJam = useCallback(async () => {
        if (viewState?.status === 'loaded') return viewState.jam
        return mutateJam()
    }, [mutateJam, viewState])

    const {state: participation, commands: participationCommands} = useJamParticipationController(
        jam,
        isAuthenticated,
        user?.id ?? null,
        reloadJam,
    )

    useEffect(() => {
        if (!participation.feedback) return
        const message = participation.feedback === 'withdrawal_success'
            ? t('registration.withdraw_success')
            : participation.feedback === 'registration_success'
            ? t('jams.enroll_success')
            : participation.feedback === 'new_music_success'
                ? t('jams.song_created_success')
                : t('jams.suggest_success')
        showToast({message})
    }, [participation.feedback, showToast, t])

    // State for suggested songs section collapse
    const [isSuggestedExpanded, setIsSuggestedExpanded] = useState(true)

    // State for copy location feedback
    const [locationCopied, setLocationCopied] = useState(false)

    // State for description truncation
    const [descriptionExpanded, setDescriptionExpanded] = useState(false)

    // Handle copy location to clipboard
    const handleCopyLocation = useCallback(async () => {
        if (jam?.location) {
            try {
                await navigator.clipboard.writeText(jam.location)
                setLocationCopied(true)
                setTimeout(() => setLocationCopied(false), 2000)
            } catch (error) {
                console.error('Failed to copy location:', error)
            }
        }
    }, [jam?.location])

    // Derive all schedule data in a single pass
    const { allSchedules, nonSuggestedSchedules, suggestedSchedules } = useMemo(() => {
        const all = jam?.schedules || []
        const nonSuggested: ScheduleResponseDto[] = []
        const suggested: ScheduleResponseDto[] = []

        for (const s of all) {
            if (s.status !== 'SUGGESTED') {
                nonSuggested.push(s)
            } else {
                suggested.push(s)
            }
        }

        return { allSchedules: all, nonSuggestedSchedules: nonSuggested, suggestedSchedules: suggested }
    }, [jam?.schedules])

    // Get user's registrations with schedule data (supports multiple registrations per schedule)
    const userRegistrations = useMemo(() => {
        if (!jam?.schedules || !user?.id) return []
        const registrations: Array<{ schedule: ScheduleResponseDto; registration: RegistrationResponseDto }> = []
        for (const schedule of jam.schedules) {
            for (const reg of activeRegistrations(schedule.registrations)) {
                if ((reg.musician?.id ?? reg.musicianId) === user.id) {
                    registrations.push({ schedule, registration: reg })
                }
            }
        }
        return registrations
    }, [jam?.schedules, user?.id])

    const jamFacts = useMemo(() => {
        const musiciansFromSchedules = new Set(
            nonSuggestedSchedules
                .flatMap(({registrations}) => registrations ?? [])
                .filter(({status}) => status === 'PENDING' || status === 'APPROVED')
                .map(({musicianId, musician}) => musician?.id ?? musicianId)
                .filter(Boolean),
        ).size
        const musicians = jam?.registeredMusicianCount ?? musiciansFromSchedules
        const duration = nonSuggestedSchedules.reduce(
            (total, schedule) => total + (schedule.music?.duration ?? 0),
            0,
        )
        return {musicians, duration, performances: nonSuggestedSchedules.length}
    }, [jam?.registeredMusicianCount, nonSuggestedSchedules])

    const eligibleSchedules = useMemo(() => {
        const eligibleIds = new Set(participation.eligiblePerformances.map(({id}) => id))
        return allSchedules.filter(({id}) => eligibleIds.has(id))
    }, [allSchedules, participation.eligiblePerformances])
    const selectedScheduleForEnroll = allSchedules.find(({id}) => id === participation.selectedPerformanceId) ?? null

    // Handle enrollment click
    const handleEnrollClick = useCallback((schedule: ScheduleResponseDto) => {
        const outcome = participationCommands.beginRegistration(schedule.id)
        if (outcome.code === 'auth_required') goTo(authPath('/login', window.location))
    }, [goTo, participationCommands])

    // Handle FAB register click
    const handleFABRegisterClick = useCallback(() => {
        const outcome = participationCommands.beginRegistration()
        if (outcome.code === 'auth_required') goTo(authPath('/login', window.location))
    }, [goTo, participationCommands])

    // Handle suggest click
    const handleSuggestClick = useCallback(() => {
        const outcome = participationCommands.beginSuggestion()
        if (outcome.code === 'auth_required') goTo(authPath('/login', window.location))
    }, [goTo, participationCommands])

    // Handle create new song click (from SuggestSongModal)
    const handleCreateNewSong = useCallback(() => {
        participationCommands.beginNewMusic()
    }, [participationCommands])

    // Loading state
    if (isLoading && !jam) {
        return <JamDetailLoadingSkeleton />
    }

    // Error state
    if (jamError) {
        return (
            <main className="min-h-screen bg-base-100 px-4 py-12 sm:py-20">
                <div className="container mx-auto max-w-xl">
                    <h1 className="ds-type-heading text-3xl font-extrabold text-base-content sm:text-4xl">
                        {t('jams.error_loading_jam')}
                    </h1>
                    <p className="mt-3 text-base-content/70" role="alert">{jamError.message}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Action onClick={() => {
                            if (onRetry) void onRetry()
                            else void mutateJam()
                        }}>
                            {t('common.try_again')}
                        </Action>
                        <Action variant="quiet" onClick={() => goTo('/jams')}>
                            {t('jams.back_to_jams')}
                        </Action>
                    </div>
                </div>
            </main>
        )
    }

    if (!jam) {
        return (
            <main className="min-h-screen bg-base-100 px-4 py-12 sm:py-20">
                <div className="container mx-auto max-w-xl">
                    <h1 className="ds-type-heading text-3xl font-extrabold text-base-content sm:text-4xl">
                        {t('jams.not_found')}
                    </h1>
                    <Action className="mt-8" onClick={() => goTo('/jams')}>
                        {t('jams.back_to_jams')}
                    </Action>
                </div>
            </main>
        )
    }

    const siteUrl = SITE_URL
    const canonicalUrl = `${siteUrl}${getJamPath(jam)}`

    const eventStatusMap: Record<string, string> = {
        ACTIVE: 'https://schema.org/EventScheduled',
        INACTIVE: 'https://schema.org/EventPostponed',
        LIVE: 'https://schema.org/EventScheduled',
        FINISHED: 'https://schema.org/EventPast',
    }

    const jamJsonLd: Record<string, unknown>[] = [
        {
            '@type': 'MusicEvent',
            name: jam.name,
            description: jam.description || t('seo.jam.fallback_description'),
            ...(jam.date && { startDate: jam.date }),
            location: jam.location
                ? { '@type': 'Place', name: jam.location }
                : { '@type': 'VirtualLocation', url: canonicalUrl },
            url: canonicalUrl,
            image: `${siteUrl}/brand/v1/social-1200x630.png`,
            eventStatus: eventStatusMap[jam.status] || 'https://schema.org/EventScheduled',
            eventAttendanceMode: jam.location
                ? 'https://schema.org/OfflineEventAttendanceMode'
                : 'https://schema.org/OnlineEventAttendanceMode',
            organizer: {
                '@type': 'Organization',
                name: jam.hostName || 'Jam App',
                url: siteUrl,
            },
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'BRL',
                availability: 'https://schema.org/InStock',
                url: canonicalUrl,
            },
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Jam Sessions', item: `${siteUrl}/jams` },
                { '@type': 'ListItem', position: 2, name: jam.name, item: canonicalUrl },
            ],
        },
    ]

    // The audience reacts from here while the Jam is on stage.
    const showReactions = jam.status === 'LIVE'

    return (
        <div className="min-h-screen bg-linear-to-br from-base-100 to-base-200">
            <SEO
                title={jam.name}
                description={jam.description || undefined}
                canonical={canonicalUrl}
                ogType="website"
                jsonLd={jamJsonLd}
            />
            {/* Header - compact: title + meta on one line, details muted below */}
            <div className="bg-base-200 border-b border-base-300">
                <div className={`${JAM_DETAIL_CONTAINER_CLASS} py-4 sm:py-5`} data-jam-detail-container>
                    {/* Title and Jam-level actions share one aligned identity row. */}
                    <div className="flex items-center gap-3">
                        <h1 className="ds-type-heading ds-wrap-user-content min-w-0 flex-1 font-extrabold leading-tight sm:text-3xl md:text-4xl">{jam.name}</h1>
                        <div className="ml-auto flex shrink-0 items-center gap-2">
                            {jam.spotifyPlaylistUrl && (
                                <a
                                    href={jam.spotifyPlaylistUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ds-action ds-control ds-focusable ds-action--spotify ds-action--idle ds-action--icon-only jam-detail-icon-action"
                                    aria-label={t('jams.listen_on_spotify')}
                                    title={t('jams.listen_on_spotify')}
                                >
                                    <SpotifyLogo />
                                </a>
                            )}
                            <IconAction
                                variant="secondary"
                                onClick={participationCommands.beginShare}
                                label={t('share.share_button')}
                                title={t('share.share_button')}
                            >
                                <Share2 className="size-4" aria-hidden="true" />
                            </IconAction>
                        </div>
                    </div>

                    <div className="mt-3 space-y-1 border-y border-base-300 py-2 text-sm text-base-content/70">
                        <div className="flex min-w-0 items-center gap-x-2 sm:gap-x-4">
                            {jam.date && (
                                <span className="inline-flex min-h-11 min-w-0 flex-[0_1_auto] items-center gap-1.5 tabular-nums">
                                    <Calendar className="size-4 shrink-0" aria-hidden="true" />
                                    <span className="min-w-0 leading-tight">
                                        {formatDateTime(jam.date, normalizeLocale(i18n.resolvedLanguage ?? i18n.language) ?? 'pt-BR')}
                                    </span>
                                </span>
                            )}
                            {jam.location && (
                                <DropdownMenu
                                    label={t('jams.info.full_address')}
                                    className="jam-detail-location"
                                    trigger={
                                        <span className="inline-flex min-w-0 items-center gap-1.5 text-base-content/70">
                                            <MapPin className="size-4 shrink-0" aria-hidden="true" />
                                            <span className="truncate">{jam.location}</span>
                                            <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
                                        </span>
                                    }
                                >
                                    <div className="w-64 max-w-[calc(100vw-2rem)] space-y-1 p-2">
                                        <p className="ds-wrap-user-content text-sm leading-relaxed text-base-content/80">{jam.location}</p>
                                        <Action variant="quiet" onClick={() => void handleCopyLocation()} className="min-h-11 justify-start px-0 text-sm text-primary underline underline-offset-4">
                                            {locationCopied ? t('common.copied') : t('common.copy_address')}
                                        </Action>
                                    </div>
                                </DropdownMenu>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap">
                                <Music className="size-4 shrink-0" aria-hidden="true" />
                                {jamFacts.performances} {t('jams.info.performances').toLowerCase()}
                            </span>
                            <span className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap">
                                <Users className="size-4 shrink-0" aria-hidden="true" />
                                {jamFacts.musicians} {t('jams.info.musicians').toLowerCase()}
                            </span>
                            <span className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap">
                                <Clock3 className="size-4 shrink-0" aria-hidden="true" />
                                {formatJamDuration(jamFacts.duration)}
                            </span>
                        </div>
                        {(hostName || hostContact) && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-base-content/80">
                                {hostName && <span className="ds-wrap-user-content">{t('jams.hosted_by')} {hostName}</span>}
                                {hostContact && <span className="ds-wrap-user-content">{t('jams.info.host_contact')}: {hostContact}</span>}
                            </div>
                        )}
                    </div>

                    {/* Description follows the event details so the schedule context
                        is available before reading the longer supporting copy. */}
                    {jam.description && (
                        <div className="mt-3">
                            <p className={`max-w-3xl whitespace-pre-line text-sm text-pretty text-base-content/70 ${!descriptionExpanded ? 'line-clamp-3' : ''}`}>
                                {jam.description}
                            </p>
                            {jam.description.length > 100 && (
                                <Action
                                    variant="quiet"
                                    onClick={() => setDescriptionExpanded(prev => !prev)}
                                    className="mt-1 justify-start px-0 text-primary"
                                    style={{paddingInline: 0}}
                                >
                                    <span className="text-xs">
                                        {descriptionExpanded ? t('common.show_less') : t('common.show_more')}
                                    </span>
                                </Action>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Finished/Inactive banner */}
            {(jam.status === 'FINISHED' || jam.status === 'INACTIVE') && (
                <div className="bg-base-300/50 border-b border-base-300">
                    <div className={`${JAM_DETAIL_CONTAINER_CLASS} py-2 text-center`} data-jam-detail-container>
                        <p className="text-xs text-base-content/50 font-medium">
                            {t(translationKey('jams.banner', jam.status.toLowerCase()))}
                        </p>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {jam && (
                <ShareModal
                    isOpen={participation.activeOverlay === 'share'}
                    onClose={participationCommands.closeOverlay}
                    jamId={jam.id}
                    jamSlug={jam.slug}
                    jamName={jam.name}
                    nativeShareAvailable={participation.shareCapability.native}
                    onCopy={participationCommands.shareCopy}
                    onWhatsApp={participationCommands.shareWhatsApp}
                    onNativeShare={participationCommands.shareNative}
                />
            )}

            {/* Main Content */}
            <div className={`${JAM_DETAIL_CONTAINER_CLASS} py-6 sm:py-8 ${showReactions ? 'pb-52 sm:pb-40' : 'pb-24'}`} data-jam-detail-container>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Timeline Column - full width, schedule is the hero */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Performance Schedule - the centerpiece */}
                        <TimelineShowcaseV2Waveform
                            schedules={nonSuggestedSchedules}
                            user={user}
                            onRegisterClick={handleEnrollClick}
                            jamStatus={jam.status}
                        />

                        {/* Suggested Songs Section */}
                        {suggestedSchedules.length > 0 && (
                            <CollapsibleSection
                                title={t('jams.suggested_songs_short')}
                                isExpanded={isSuggestedExpanded}
                                onToggle={() => setIsSuggestedExpanded(!isSuggestedExpanded)}
                                badge={`${suggestedSchedules.length}`}
                            >
                                <p className="text-xs text-base-content/50 mb-2">{t('jams.suggested_songs_hint')}</p>
                                <div className="divide-y divide-base-300/40">
                                    {suggestedSchedules.map((schedule) => (
                                        <div
                                            key={schedule.id}
                                            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="ds-wrap-user-content font-semibold text-sm">
                                                    {schedule.music?.title}
                                                </p>
                                                <p className="ds-wrap-user-content text-xs text-base-content/60">
                                                    {schedule.music?.artist}
                                                </p>
                                                {schedule.registrations && schedule.registrations.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {schedule.registrations.map((reg) => (
                                                            <span
                                                                key={reg.id}
                                                                className="inline-flex items-center gap-1 text-[11px] text-base-content/60"
                                                            >
                                                                <span aria-hidden="true">{getInstrumentIcon(reg.instrument || '')}</span>
                                                                {reg.musician?.name || reg.musician?.contact}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}

                    </div>

                </div>
            </div>

            {/* Floating Action Button - Combined register + suggest */}
            <DualActionFAB
                isVisible={isAuthenticated && participation.eligiblePerformances.length > 0}
                registrationCount={userRegistrations.length}
                onRegisterClick={handleFABRegisterClick}
                onSuggestClick={handleSuggestClick}
                primaryAction="register"
                offset={showReactions ? REACTION_BAR_SPACE : 0}
            />

            {showReactions && <ReactionBar jamId={jam.id} live={!viewState} />}

            {/* Modals */}
            {selectedScheduleForEnroll && (
                <ScheduleEnrollmentModal
                schedule={selectedScheduleForEnroll}
                isOpen={participation.activeOverlay === 'enrollment'}
                musicianId={user?.id}
                preferredInstrument={user?.instrument}
                onClose={participationCommands.closeOverlay}
                onSubmit={participationCommands.register}
                onWithdraw={participationCommands.withdrawRegistration}
                />
            )}

            <SuggestSongModal
                isOpen={participation.activeOverlay === 'suggestion'}
                onClose={participationCommands.closeOverlay}
                onSuggest={participationCommands.suggestMusic}
                onCreateNewSong={handleCreateNewSong}
            />

            <SuggestNewSongModal
                isOpen={participation.activeOverlay === 'new_music'}
                onClose={participationCommands.closeOverlay}
                onSubmit={participationCommands.createAndSuggestMusic}
            />

            <PerformanceSelectionModal
                performances={eligibleSchedules}
                isOpen={participation.activeOverlay === 'performance_picker'}
                onClose={participationCommands.closeOverlay}
                onSelectPerformance={handleEnrollClick}
                userId={user?.id}
            />
        </div>
    )
}

export default JamDetailPageV2
