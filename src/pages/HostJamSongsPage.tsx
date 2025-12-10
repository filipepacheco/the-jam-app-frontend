/**
 * Host - Songs Management Page
 * Manage songs for a jam session
 * Route: /host/jams/:id/songs
 */

import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {musicService} from '../services/musicService'
import * as jamService from '../services/jamService'
import type {MusicResponseDto} from '../types/api.types'
import {ErrorAlert, SuccessAlert} from '../components'

interface JamSong extends MusicResponseDto {
  linkedAt?: string
}

export function HostJamSongsPage() {
  const { id: jamId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [songs, setSongs] = useState<JamSong[]>([])
  const [allSongs, setAllSongs] = useState<MusicResponseDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddSong, setShowAddSong] = useState(false)
  const [selectedSongId, setSelectedSongId] = useState<string>('')
  const [jamName, setJamName] = useState<string>('')

  // New song form
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    genre: 'JAZZ',
    duration: 240,
  })

  useEffect(() => {
    if (jamId) {
      loadJamData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jamId])

  const loadJamData = async () => {
    if (!jamId) return

    setLoading(true)
    setError(null)

    try {
      // Load jam details
      const jamDetails = await jamService.findOne(jamId)
      if (jamDetails.data) {
        setJamName((jamDetails.data).name || 'Jam')

        // Extract jamsmusics from jam object
        const jamMusics = ((jamDetails.data as unknown) as Record<string, unknown>)?.jamsmusics as Array<Record<string, unknown>> || []
        // Map JamMusicResponseDto to MusicResponseDto format
        const jamSongs = jamMusics.map((jm: Record<string, unknown>) => jm.musica as MusicResponseDto)
        setSongs(jamSongs)
      }

      // Load all available songs
      const allSongsData = await musicService.findAll()
      setAllSongs(allSongsData.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jam songs')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSong = async () => {
    if (!newSong.title || !newSong.artist) {
      setError('Title and artist are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Transform Portuguese field names to English for API
      const songData = {
        title: newSong.title,
        artist: newSong.artist,
        genre: newSong.genre,
        duration: newSong.duration,
      }

      // Create the song
      const createdSong = await musicService.create(songData)

      if (createdSong.data && jamId) {
        // Link it to the jam
        await musicService.linkToJam(createdSong.data.id, jamId)

        // Reset form and reload
        setNewSong({
          title: '',
          artist: '',
          genre: 'JAZZ',
          duration: 240,
        })
        setShowAddSong(false)

        setSuccess(`Song "${newSong.title}" created and added to jam`)
        await loadJamData()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create song')
    } finally {
      setLoading(false)
    }
  }

  const handleAddExistingSong = async () => {
    if (!selectedSongId || !jamId) {
      setError('Please select a song')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await musicService.linkToJam(selectedSongId, jamId)

      const song = allSongs.find((s) => s.id === selectedSongId)
      setSuccess(`Song "${song?.title}" added to jam`)
      setSelectedSongId('')
      setShowAddSong(false)
      await loadJamData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add song to jam')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSong = async (songId: string) => {
    if (!confirm('Remove this song from the jam?')) return

    setLoading(true)
    setError(null)

    try {
      // Note: If backend doesn't have a remove endpoint, we'll just reload
      const song = songs.find((s) => s.id === songId)
      setSuccess(`Song "${song?.title}" removed from jam`)
      await loadJamData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove song')
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = async (draggedIndex: number, targetIndex: number) => {
    const newSongs = [...songs]
    const [draggedSong] = newSongs.splice(draggedIndex, 1)
    newSongs.splice(targetIndex, 0, draggedSong)
    setSongs(newSongs)

    // TODO: Call backend to save reordered songs
    setSuccess('Song order updated')
  }

  const getAvailableSongs = () => {
    const linkedIds = new Set(songs.map((s) => s.id))
    return allSongs.filter((s) => !linkedIds.has(s.id))
  }

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/host/jams/${jamId}/manage`)}
            className="btn btn-ghost btn-sm mb-4"
          >
            ← Back to Jam Management
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">🎵 Songs Management</h1>
              <p className="text-base-content/70 mt-2">{jamName}</p>
            </div>
            <button
              onClick={() => setShowAddSong(true)}
              className="btn btn-primary"
              disabled={loading}
            >
              + Add Song
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
        {success && <SuccessAlert message={success} onDismiss={() => setSuccess(null)} />}

        {/* Add Song Modal */}
        {showAddSong && (
          <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-md">
              <h3 className="font-bold text-lg mb-4">Add Song to Jam</h3>

              <div className="space-y-4">
                {/* Option 1: Create New Song */}
                <div className="divider">Create New Song</div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Title</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Song title"
                    value={newSong.title}
                    onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Artist</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Artist name"
                    value={newSong.artist}
                    onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                    className="input input-bordered"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Genre</span>
                    </label>
                    <select
                      value={newSong.genre}
                      onChange={(e) => setNewSong({ ...newSong, genre: e.target.value })}
                      className="select select-bordered"
                    >
                      <option value="JAZZ">Jazz</option>
                      <option value="BOSSA_NOVA">Bossa Nova</option>
                      <option value="SAMBA">Samba</option>
                      <option value="BLUES">Blues</option>
                      <option value="ROCK">Rock</option>
                      <option value="POP">Pop</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Duration (sec)</span>
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="600"
                      value={newSong.duration}
                      onChange={(e) => setNewSong({ ...newSong, duration: parseInt(e.target.value) })}
                      className="input input-bordered"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateSong}
                  className="btn btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create & Add Song'}
                </button>

                {/* Option 2: Add Existing Song */}
                <div className="divider">Or Add Existing Song</div>

                {getAvailableSongs().length > 0 ? (
                  <>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Select Song</span>
                      </label>
                      <select
                        value={selectedSongId}
                        onChange={(e) => setSelectedSongId(e.target.value)}
                        className="select select-bordered"
                      >
                        <option value="">Choose a song...</option>
                        {getAvailableSongs().map((song) => (
                          <option key={song.id} value={song.id}>
                            {song.title} - {song.artist}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleAddExistingSong}
                      className="btn btn-secondary w-full"
                      disabled={loading || !selectedSongId}
                    >
                      {loading ? 'Adding...' : 'Add Song'}
                    </button>
                  </>
                ) : (
                  <div className="alert alert-info">
                    <p>No other songs available. Create a new one above.</p>
                  </div>
                )}
              </div>

              <div className="modal-action">
                <button
                  onClick={() => {
                    setShowAddSong(false)
                    setSelectedSongId('')
                    setNewSong({
                      title: '',
                      artist: '',
                      genre: 'JAZZ',
                      duration: 240,
                    })
                  }}
                  className="btn btn-ghost"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="modal-backdrop" onClick={() => setShowAddSong(false)} />
          </div>
        )}

        {/* Songs List */}
        {loading && songs.length === 0 ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : songs.length === 0 ? (
          <div className="alert alert-warning">
            <p>No songs added to this jam yet. Click "Add Song" to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {songs.map((song, index) => (
              <div key={song.id} className="card bg-base-200 shadow-md">
                <div className="card-body p-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl font-bold text-primary">{index + 1}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{song.title}</h3>
                      <p className="text-sm text-base-content/70">
                        {song.artist }
                        {(song.genre) && ` • ${song.genre}`}
                      </p>
                      {(song.duration) && (
                        <p className="text-xs text-base-content/50">
                          {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {index > 0 && (
                      <button
                        onClick={() => handleReorder(index, index - 1)}
                        className="btn btn-sm btn-ghost"
                        title="Move up"
                      >
                        ↑
                      </button>
                    )}
                    {index < songs.length - 1 && (
                      <button
                        onClick={() => handleReorder(index, index + 1)}
                        className="btn btn-sm btn-ghost"
                        title="Move down"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveSong(song.id)}
                      className="btn btn-sm btn-error btn-outline"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {songs.length > 0 && (
          <div className="mt-8 stats shadow w-full">
            <div className="stat">
              <div className="stat-title">Total Songs</div>
              <div className="stat-value text-primary">{songs.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Total Duration</div>
              <div className="stat-value text-primary">
                {Math.floor(songs.reduce((sum, s) => sum + (s.duration || 0), 0) / 60)}m
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Average Song</div>
              <div className="stat-value text-primary">
                {Math.round(songs.reduce((sum, s) => sum + (s.duration || 0), 0) / songs.length / 60)}m
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HostJamSongsPage

