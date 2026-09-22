import type {JamManagementMode, JamResponseDto} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {useEffect, useId, useMemo, useState} from "react";
import type {ChangeEvent, FormEvent, ReactNode} from "react";
import {ExternalLink, Play, Square, RotateCcw, Download} from "lucide-react";
import {SpotifyImportModal} from "../../components";
import {Action, type ActionVariant} from "../../components/Action";
import {getJamDashboardPath} from "../../utils/jamUrl";

interface JamEditorData {
    name: string
    description: string
    date: string
    time: string
    location: string
    slug: string
    spotifyPlaylistUrl: string
    hostName: string
    hostContact: string
    autoApproveRegistrations: boolean
    managementMode: JamManagementMode
}

function editorDataFromJam(jam: JamResponseDto): JamEditorData {
    const parsedDate = jam.date ? new Date(jam.date) : null
    const date = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null

    return {
        name: jam.name ?? '',
        description: jam.description ?? '',
        date: date
            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            : '',
        time: date
            ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
            : '',
        location: jam.location ?? '',
        slug: jam.slug ?? '',
        spotifyPlaylistUrl: jam.spotifyPlaylistUrl ?? '',
        hostName: jam.hostName ?? '',
        hostContact: jam.hostContact ?? '',
        autoApproveRegistrations: jam.autoApproveRegistrations ?? true,
        managementMode: jam.managementMode ?? 'OWNER_ONLY',
    }
}

/**
 * Overview Tab Component
 * Clear, non-minimalist design with visible text labels
 */
export function OverviewTab({
                                jam,
                                onStatusChange,
                                onJamUpdate,
                                loading,
                            }: {
    jam: JamResponseDto
    onStatusChange: (status: 'ACTIVE' | 'INACTIVE' | 'LIVE' | 'FINISHED') => void
    onJamUpdate: (updates: Partial<JamResponseDto>) => Promise<void>
    loading: boolean
}) {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const formId = useId()
    const [showImportModal, setShowImportModal] = useState(false)
    const [formData, setFormData] = useState<JamEditorData>(() => editorDataFromJam(jam))
    const [dirty, setDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        setFormData(editorDataFromJam(jam))
        setDirty(false)
    }, [jam])

    const { musicianCount, performanceCount, registrationCount } = useMemo(() => {
        const allRegistrations = jam.schedules?.flatMap(s => s.registrations || []) || []
        const uniqueMusicians = new Set<string>()
        allRegistrations.forEach((reg) => uniqueMusicians.add(reg.musicianId))

        return {
            musicianCount: uniqueMusicians.size,
            performanceCount: jam._count?.schedules ?? jam.schedules?.length ?? 0,
            registrationCount: jam._count?.registrations ?? allRegistrations.length,
        }
    }, [jam.schedules, jam._count])

    // Get status control button config
    // New lifecycle: INACTIVE → ACTIVE → LIVE → FINISHED → INACTIVE
    const getStatusButton = (): {
        label: string
        icon: ReactNode
        variant: ActionVariant
        onClick: () => void
    } => {
        switch (jam.status) {
            case 'INACTIVE':
                return {
                    label: t('jam_management.overview.actions.activate'),
                    icon: <RotateCcw className="size-4" />,
                    variant: 'secondary',
                    onClick: () => onStatusChange('ACTIVE')
                }
            case 'ACTIVE':
                return {
                    label: t('jam_management.overview.actions.start'),
                    icon: <Play className="size-4" />,
                    variant: 'primary',
                    onClick: () => onStatusChange('LIVE')
                }
            case 'LIVE':
                return {
                    label: t('jam_management.overview.actions.finish'),
                    icon: <Square className="size-4" />,
                    variant: 'destructive',
                    onClick: () => onStatusChange('FINISHED')
                }
            case 'FINISHED':
            default:
                return {
                    label: t('jam_management.overview.actions.prepare_again'),
                    icon: <RotateCcw className="size-4" />,
                    variant: 'secondary',
                    onClick: () => onStatusChange('INACTIVE')
                }
        }
    }

    const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = event.target
        const nextValue = name === 'slug'
            ? value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            : value
        setFormData((current) => ({...current, [name]: nextValue}))
        setDirty(true)
        setFormError(null)
    }

    const handleAutoApproveChange = (event: ChangeEvent<HTMLInputElement>) => {
        setFormData((current) => ({
            ...current,
            autoApproveRegistrations: event.target.checked,
        }))
        setDirty(true)
        setFormError(null)
    }

    const handleSharedHostManagementChange = (event: ChangeEvent<HTMLInputElement>) => {
        setFormData((current) => ({
            ...current,
            managementMode: event.target.checked ? 'SHARED_HOSTS' : 'OWNER_ONLY',
        }))
        setDirty(true)
        setFormError(null)
    }

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        const missingField = !formData.name.trim()
            ? 'name'
            : !formData.location.trim()
                ? 'location'
                : !formData.date
                    ? 'date'
                    : !formData.time
                        ? 'time'
                        : null

        if (missingField) {
            const validationKeys = {
                name: 'create_jam.validation.name_required',
                location: 'create_jam.validation.location_required',
                date: 'create_jam.validation.date_required',
                time: 'create_jam.validation.time_required',
            } as const
            setFormError(t(validationKeys[missingField]))
            document.getElementById(`${formId}-${missingField}`)?.focus()
            return
        }

        setSaving(true)
        setFormError(null)
        try {
            const updates: Partial<JamResponseDto> = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                date: new Date(`${formData.date}T${formData.time}`).toISOString(),
                location: formData.location.trim(),
                slug: formData.slug.trim() || null,
                spotifyPlaylistUrl: formData.spotifyPlaylistUrl.trim() || null,
                hostName: formData.hostName.trim(),
                hostContact: formData.hostContact.trim() || undefined,
                autoApproveRegistrations: formData.autoApproveRegistrations,
            }
            if (formData.managementMode !== (jam.managementMode ?? 'OWNER_ONLY')) {
                updates.managementMode = formData.managementMode
            }
            await onJamUpdate(updates)
            setDirty(false)
        } catch {
            setFormError(t('create_jam.messages.save_error'))
        } finally {
            setSaving(false)
        }
    }

    const statusButton = getStatusButton()

    return (
        <>
            <div className="space-y-3">

                {/* Lifecycle Action - Full width, dominant */}
                <Action
                    onClick={statusButton.onClick}
                    className="w-full"
                    variant={statusButton.variant}
                    state={loading ? 'disabled' : 'idle'}
                >
                    <Action.Icon>{statusButton.icon}</Action.Icon>
                    <Action.Label>{statusButton.label}</Action.Label>
                </Action>

                {/* Secondary Actions Row */}
                <div className="flex flex-wrap items-center gap-2">
                    <a
                        href={getJamDashboardPath(jam)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-ghost gap-2"
                    >
                        <ExternalLink className="size-4" />
                        {t('jam_management.view_public_dashboard')}
                    </a>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="btn btn-sm btn-ghost gap-2"
                    >
                        <Download className="size-4" />
                        {t('spotify.import_button')}
                    </button>
                </div>

                {/* Stats - Single horizontal bar */}
                <div className="stats stats-horizontal w-full bg-base-200 shadow-sm">
                    <div className="stat place-items-center py-2 px-2">
                        <div className="stat-title text-xs">{t('jam_management.overview.stats.performances')}</div>
                        <div className="stat-value text-xl">{performanceCount}</div>
                    </div>
                    <div className="stat place-items-center py-2 px-2">
                        <div className="stat-title text-xs">{t('jam_management.overview.stats.registrations')}</div>
                        <div className="stat-value text-xl">{registrationCount}</div>
                    </div>
                    <div className="stat place-items-center py-2 px-2">
                        <div className="stat-title text-xs">{t('jam_management.overview.stats.musicians')}</div>
                        <div className="stat-value text-xl">{musicianCount}</div>
                    </div>
                </div>

                {/* Jam data stays editable in context so hosts do not leave
                    the management workflow for routine updates. */}
                <div className="card bg-base-200 shadow-sm">
                    <div className="card-body p-3 sm:p-4">
                        <div className="mb-2">
                            <h2 className="text-lg font-bold">{t('jam_management.overview.edit_jam')}</h2>
                            <p className="text-sm text-base-content/60">{t('create_jam.info.edit_hint')}</p>
                        </div>

                        <form onSubmit={(event) => { void handleSubmit(event) }} noValidate className="space-y-3">
                            {formError && <p role="alert" className="text-sm text-error">{formError}</p>}

                            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 [&>fieldset]:min-w-0">
                                <fieldset className="fieldset sm:col-span-2">
                                    <label className="fieldset-legend" htmlFor={`${formId}-name`}>{t('create_jam.form.jam_name')}</label>
                                    <input id={`${formId}-name`} name="name" value={formData.name} onChange={handleInputChange} className="input input-bordered w-full" disabled={saving} required />
                                </fieldset>
                                <fieldset className="fieldset sm:col-span-2">
                                    <label className="fieldset-legend" htmlFor={`${formId}-location`}>{t('create_jam.form.location')}</label>
                                    <input id={`${formId}-location`} name="location" value={formData.location} onChange={handleInputChange} className="input input-bordered w-full" disabled={saving} required />
                                </fieldset>
                                <fieldset className="fieldset">
                                    <label className="fieldset-legend" htmlFor={`${formId}-date`}>{t('create_jam.form.date')}</label>
                                    <input id={`${formId}-date`} type="date" name="date" value={formData.date} onChange={handleInputChange} className="input input-bordered w-full" disabled={saving} required />
                                </fieldset>
                                <fieldset className="fieldset">
                                    <label className="fieldset-legend" htmlFor={`${formId}-time`}>{t('create_jam.form.time')}</label>
                                    <input id={`${formId}-time`} type="time" name="time" value={formData.time} onChange={handleInputChange} className="input input-bordered w-full" disabled={saving} required />
                                </fieldset>
                                <fieldset className="fieldset sm:col-span-2">
                                    <label className="fieldset-legend" htmlFor={`${formId}-description`}>{t('create_jam.form.description')}</label>
                                    <textarea id={`${formId}-description`} name="description" value={formData.description} onChange={handleInputChange} className="textarea textarea-bordered min-h-24 w-full resize-y" disabled={saving} />
                                </fieldset>
                                <fieldset className="fieldset sm:col-span-2">
                                    <label className="fieldset-legend" htmlFor={`${formId}-slug`}>{t('create_jam.form.slug')}</label>
                                    <div className="flex min-w-0 items-stretch">
                                        <span className="inline-flex items-center rounded-l-lg border border-r-0 border-base-content/20 bg-base-300 px-3 text-xs text-base-content/70">jamapp.com.br/jams/</span>
                                        <input id={`${formId}-slug`} name="slug" value={formData.slug} onChange={handleInputChange} className="input input-bordered min-w-0 flex-1 rounded-l-none font-mono text-sm" disabled={saving} maxLength={80} />
                                    </div>
                                </fieldset>
                                <fieldset className="fieldset sm:col-span-2">
                                    <label className="fieldset-legend" htmlFor={`${formId}-spotifyPlaylistUrl`}>{t('create_jam.form.spotify_playlist_url')}</label>
                                    <input id={`${formId}-spotifyPlaylistUrl`} type="url" name="spotifyPlaylistUrl" value={formData.spotifyPlaylistUrl} onChange={handleInputChange} className="input input-bordered w-full" disabled={saving} />
                                </fieldset>
                                <fieldset className="fieldset">
                                    <label className="fieldset-legend" htmlFor={`${formId}-hostName`}>{t('create_jam.form.host_name')}</label>
                                    <input id={`${formId}-hostName`} name="hostName" value={formData.hostName} onChange={handleInputChange} className="input input-bordered w-full" disabled={saving} />
                                </fieldset>
                                <fieldset className="fieldset">
                                    <label className="fieldset-legend" htmlFor={`${formId}-hostContact`}>{t('create_jam.form.host_contact')}</label>
                                    <input id={`${formId}-hostContact`} name="hostContact" value={formData.hostContact} onChange={handleInputChange} className="input input-bordered w-full" disabled={saving} />
                                </fieldset>
                                <fieldset className="fieldset sm:col-span-2">
                                    <label className="label min-h-11 w-full min-w-0 cursor-pointer items-start justify-start gap-3" htmlFor={`${formId}-autoApproveRegistrations`}>
                                        <input
                                            id={`${formId}-autoApproveRegistrations`}
                                            type="checkbox"
                                            name="autoApproveRegistrations"
                                            checked={formData.autoApproveRegistrations}
                                            onChange={handleAutoApproveChange}
                                            aria-labelledby={`${formId}-autoApproveRegistrations-label`}
                                            aria-describedby={`${formId}-autoApproveRegistrations-hint`}
                                            className="toggle toggle-primary shrink-0"
                                            disabled={saving}
                                        />
                                        <span className="min-w-0 flex-1 whitespace-normal">
                                            <span id={`${formId}-autoApproveRegistrations-label`} className="block font-medium">{t('create_jam.form.auto_approve_registrations')}</span>
                                            <span id={`${formId}-autoApproveRegistrations-hint`} className="block text-sm font-normal text-base-content/60">
                                                {t('create_jam.form.auto_approve_registrations_hint')}
                                            </span>
                                        </span>
                                    </label>
                                </fieldset>
                                <fieldset className="fieldset sm:col-span-2">
                                    <label className="label min-h-11 w-full min-w-0 cursor-pointer items-start justify-start gap-3" htmlFor={`${formId}-sharedHostManagement`}>
                                        <input
                                            id={`${formId}-sharedHostManagement`}
                                            type="checkbox"
                                            name="sharedHostManagement"
                                            checked={formData.managementMode === 'SHARED_HOSTS'}
                                            onChange={handleSharedHostManagementChange}
                                            aria-labelledby={`${formId}-sharedHostManagement-label`}
                                            aria-describedby={`${formId}-sharedHostManagement-hint`}
                                            className="toggle toggle-primary shrink-0"
                                            disabled={saving}
                                        />
                                        <span className="min-w-0 flex-1 whitespace-normal">
                                            <span id={`${formId}-sharedHostManagement-label`} className="block font-medium">{t('create_jam.form.shared_host_management')}</span>
                                            <span id={`${formId}-sharedHostManagement-hint`} className="block text-sm font-normal text-base-content/60">
                                                {t('create_jam.form.shared_host_management_hint')}
                                            </span>
                                        </span>
                                    </label>
                                </fieldset>
                            </div>

                            <div className="flex justify-end border-t border-base-content/10 pt-3">
                                {saving ? (
                                    <Action type="submit" state="loading" loadingLabel={t('create_jam.actions.saving')}>
                                        {t('create_jam.actions.saving')}
                                    </Action>
                                ) : (
                                    <Action type="submit" state={loading || !dirty ? 'disabled' : 'idle'}>
                                        {t('create_jam.actions.update')}
                                    </Action>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <SpotifyImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={(jamId, isExistingJam) => {
                    setShowImportModal(false)
                    if (isExistingJam) {
                        window.location.reload()
                    } else {
                        void navigate(`/host/jams/${jamId}/manage`)
                    }
                }}
                preselectedJamId={jam.id}
                preselectedJamName={jam.name}
            />
        </>
    )
}
