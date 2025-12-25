/**
 * Music Library Page
 * Public page for browsing music catalog
 * Hosts can add, edit, delete. Users can browse.
 * Route: /music
 */

import {useEffect, useMemo, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {useAuth} from '../hooks'
import {musicService} from '../services/musicService'
import type {CreateMusicDto, MusicResponseDto, UpdateMusicDto} from '../types/api.types'
import {
    ErrorAlert,
    MusicEmptyState,
    MusicFilters,
    MusicModalFormFields,
    MusicTableRow,
    SuccessAlert
} from '../components'
import {filterAndSortMusic, formatDuration, isDuplicate as checkDuplicate, parseDuration} from '../lib/musicUtils'
import {GENRES} from '../lib/musicConstants'
import {useTranslation} from 'react-i18next'

type SortBy = 'title' | 'artist' | 'date'
type StatusFilter = 'all' | 'approved' | 'suggested'

export function MusicPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const {user, isAuthenticated} = useAuth()
    const [musicList, setMusicList] = useState<MusicResponseDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [genreFilter, setGenreFilter] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('approved')
    const [sortBy, setSortBy] = useState<SortBy>('title')

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false)
    const [showSuggestModal, setShowSuggestModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingMusic, setEditingMusic] = useState<MusicResponseDto | null>(null)

    useEffect(() => {
        loadMusic()
    }, [])

    const loadMusic = async () => {
        setLoading(true)
        setError(null)

        try {
            const result = await musicService.findAll()
            setMusicList(result.data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load music')
        } finally {
            setLoading(false)
        }
    }

    // ...existing code...

    const handleClearFilters = () => {
        setSearchTerm('')
        setGenreFilter('')
        setSortBy('title')
    }

    const isDuplicate = (title: string, artist: string, excludeId?: string): boolean => {
        return checkDuplicate(musicList, title, artist, excludeId)
    }

    // Filter and sort music
    const filteredAndSortedMusic = useMemo(() => {
        return filterAndSortMusic(musicList, {
            status: statusFilter, searchTerm, genreFilter, sortBy,
        })
    }, [musicList, searchTerm, genreFilter, statusFilter, sortBy])

    const handleEdit = (music: MusicResponseDto) => {
        setEditingMusic(music)
        setShowEditModal(true)
    }

    const handleApprove = async (music: MusicResponseDto) => {
        if (!confirm(`Approve "${music.title}" by ${music.artist}?`)) {
            return
        }

        setLoading(true)
        setError(null)

        try {
            await musicService.update(music.id, {status: 'APPROVED'})
            setSuccess(`Song "${music.title}" approved!`)
            loadMusic()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to approve song')
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async (music: MusicResponseDto) => {
        if (!confirm(`Reject "${music.title}" by ${music.artist}? This will delete it.`)) {
            return
        }

        setLoading(true)
        setError(null)

        try {
            await musicService.remove(music.id)
            setSuccess(`Song "${music.title}" rejected!`)
            loadMusic()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reject song')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (music: MusicResponseDto) => {
        // TODO: Calculate usage count from schedules
        const usageCount = 0

        if (!confirm(`Are you sure you want to delete "${music.title}" by ${music.artist}?${usageCount > 0 ? `\n\nThis song has been performed ${usageCount} times.` : ''}`)) {
            return
        }

        setLoading(true)
        setError(null)

        try {
            await musicService.remove(music.id)
            setSuccess(`Song "${music.title}" deleted successfully!`)
            loadMusic()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete song')
        } finally {
            setLoading(false)
        }
    }

    if (loading && musicList.length === 0) {
        return (<div className="min-h-screen flex items-center justify-center bg-base-100">
            <div className="loading loading-spinner loading-lg"></div>
        </div>)
    }

    return (<div className="min-h-screen bg-base-100">
        {/* Header */}
        <div className="bg-base-200 border-b border-base-300">
            <div className="container mx-auto max-w-7xl px-4 py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <h1 className="text-4xl font-bold">🎵 Music Library</h1>
                    <div className="flex gap-2">
                        {user?.isHost && (<button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            + Add Song
                        </button>)}
                        {isAuthenticated && (<button
                            onClick={() => setShowSuggestModal(true)}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            💡 Suggest Song
                        </button>)}
                        {!isAuthenticated && (<button
                            onClick={() => navigate(`/login?redirect=/music`)}
                            className="btn btn-secondary"
                        >
                            💡 Suggest Song
                        </button>)}
                    </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setStatusFilter('approved')}
                        className={`tab ${statusFilter === 'approved' ? 'tab-active' : ''}`}
                    >
                        ✅ Approved
                    </button>
                    <button
                        onClick={() => setStatusFilter('suggested')}
                        className={`tab ${statusFilter === 'suggested' ? 'tab-active' : ''}`}
                    >
                        💡 Suggested
                    </button>
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`tab ${statusFilter === 'all' ? 'tab-active' : ''}`}
                    >
                        All Songs
                    </button>
                </div>
            </div>
        </div>

        {/* Alerts */}
        <div className="container mx-auto max-w-7xl px-4 mt-4">
            {error && <ErrorAlert message={error} onDismiss={() => setError(null)}/>}
            {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)}/>}
        </div>

        {/* Search & Filter */}
        <div className="container mx-auto max-w-7xl px-4 py-4">
            <MusicFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                genreFilter={genreFilter}
                onGenreChange={setGenreFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onClearFilters={handleClearFilters}
                genres={GENRES}
            />
        </div>

        {/* Music Table */}
        <div className="container mx-auto max-w-7xl px-4 pb-8">
            {filteredAndSortedMusic.length > 0 ? (<div className="overflow-x-auto bg-base-200 rounded-lg shadow">
                <table className="table table-zebra w-full">
                    <thead>
                    <tr className="bg-base-300">
                        <th className="text-base">Title</th>
                        <th className="text-base">Artist</th>
                        <th className="text-base">Genre</th>
                        <th className="text-base">Duration</th>
                        <th className="text-base">Link</th>
                        <th className="text-base">Status</th>
                        <th className="text-base">Musicians Needed</th>
                        <th className="text-base">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredAndSortedMusic.map((music) => (<MusicTableRow
                            key={music.id}
                            music={music}
                            formatDuration={formatDuration}
                            isHost={user?.isHost || false}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onApprove={user?.isHost ? handleApprove : undefined}
                            onReject={user?.isHost ? handleReject : undefined}
                        />))}
                    </tbody>
                </table>
            </div>) : (<MusicEmptyState hasFilters={!!searchTerm || !!genreFilter} isHost={user?.isHost || false}/>)}
        </div>

        {/* Add Music Modal */}
        {showAddModal && (<MusicModal
            mode="add"
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
                setShowAddModal(false)
                loadMusic()
            }}
            isDuplicate={isDuplicate}
            parseDuration={parseDuration}
            setError={setError}
            setSuccess={setSuccess}
        />)}

        {/* Suggest Song Modal */}
        {showSuggestModal && (<MusicModal
            mode="suggest"
            onClose={() => setShowSuggestModal(false)}
            onSuccess={() => {
                setShowSuggestModal(false)
                loadMusic()
            }}
            isDuplicate={isDuplicate}
            parseDuration={parseDuration}
            setError={setError}
            setSuccess={setSuccess}
        />)}

        {/* Edit Music Modal */}
        {showEditModal && editingMusic && (<MusicModal
            mode="edit"
            music={editingMusic}
            onClose={() => {
                setShowEditModal(false)
                setEditingMusic(null)
            }}
            onSuccess={() => {
                setShowEditModal(false)
                setEditingMusic(null)
                loadMusic()
            }}
            isDuplicate={isDuplicate}
            parseDuration={parseDuration}
            setError={setError}
            setSuccess={setSuccess}
        />)}
    </div>)
}

/**
 * Music Modal Component (Add/Edit/Suggest)
 */
interface MusicModalProps {
    mode: 'add' | 'edit' | 'suggest'
    music?: MusicResponseDto
    onClose: () => void
    onSuccess: () => void
    isDuplicate: (title: string, artist: string, excludeId?: string) => boolean
    parseDuration: (mmss: string) => number | null
    setError: (error: string | null) => void
    setSuccess: (success: string | null) => void
}

function MusicModal({
                        mode, music, onClose, onSuccess, isDuplicate, parseDuration, setError, setSuccess,
                    }: MusicModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: music?.title || '',
        artist: music?.artist || '',
        description: music?.description || '',
        link: music?.link || '',
        genre: music?.genre || '',
        duration: music?.duration ? `${Math.floor(music.duration / 60)}:${String(music.duration % 60).padStart(2, '0')}` : '',
        neededDrums: music?.neededDrums || 0,
        neededGuitars: music?.neededGuitars || 0,
        neededVocals: music?.neededVocals || 0,
        neededBass: music?.neededBass || 0,
        neededKeys: music?.neededKeys || 0,
    })

    const handleFieldChange = (field: keyof typeof formData, value: string | number) => {
        setFormData((prev) => ({...prev, [field]: value}))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (!formData.title.trim()) {
            setError('Title is required')
            return
        }
        if (!formData.artist.trim()) {
            setError('Artist is required')
            return
        }
        if (!formData.genre) {
            setError('Genre is required')
            return
        }

        // Check for duplicates (skip for suggest mode if editing existing)
        if (mode !== 'edit' && isDuplicate(formData.title, formData.artist, music?.id)) {
            setError(`Song "${formData.title}" by ${formData.artist}" already exists in the library`)
            return
        }

        // Parse duration
        const durationInSeconds = formData.duration ? parseDuration(formData.duration) : null
        if (formData.duration && durationInSeconds === null) {
            setError('Invalid duration format. Use mm:ss (e.g., 4:30)')
            return
        }

        setLoading(true)

        try {
            const status: 'APPROVED' | 'SUGGESTED' | undefined = mode === 'suggest' ? 'SUGGESTED' : mode === 'add' ? 'APPROVED' : undefined

            const payload: CreateMusicDto | UpdateMusicDto = {
                title: formData.title.trim(),
                artist: formData.artist.trim(),
                description: formData.description.trim() || undefined,
                link: formData.link.trim() || undefined,
                genre: formData.genre,
                duration: durationInSeconds || undefined,
                status,
                neededDrums: formData.neededDrums,
                neededGuitars: formData.neededGuitars,
                neededVocals: formData.neededVocals,
                neededBass: formData.neededBass,
                neededKeys: formData.neededKeys,
            }

            if (mode === 'add') {
                await musicService.create(payload as CreateMusicDto)
                setSuccess(`Song "${formData.title}" added successfully!`)
            } else if (mode === 'suggest') {
                await musicService.create(payload as CreateMusicDto)
                setSuccess(`Song "${formData.title}" suggested! Awaiting host approval.`)
            } else if (music) {
                await musicService.update(music.id, payload as UpdateMusicDto)
                setSuccess(`Song "${formData.title}" updated successfully!`)
            }

            onSuccess()
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to ${mode} song`)
        } finally {
            setLoading(false)
        }
    }

    const getModalTitle = () => {
        switch (mode) {
            case 'add':
                return 'Add New Song'
            case 'suggest':
                return 'Suggest a New Song'
            case 'edit':
                return `Edit "${music?.title}"`
            default:
                return ''
        }
    }

    return (<div className="modal modal-open">
        <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4">{getModalTitle()}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <MusicModalFormFields
                    formData={formData}
                    onChange={handleFieldChange}
                />

                {/* Actions */}
                <div className="modal-action">
                    <button type="button" onClick={onClose} className="btn btn-ghost" disabled={loading}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? (<>
                            <span className="loading loading-spinner loading-sm"></span>
                            {mode === 'add' ? 'Adding...' : mode === 'suggest' ? 'Suggesting...' : 'Updating...'}
                        </>) : mode === 'add' ? ('Add to Library') : mode === 'suggest' ? ('Suggest Song') : ('Update Song')}
                    </button>
                </div>
            </form>
        </div>
        <div className="modal-backdrop" onClick={onClose}></div>
    </div>)
}

export default MusicPage

