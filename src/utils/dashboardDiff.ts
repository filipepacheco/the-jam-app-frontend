// Dashboard diff utility
// Compares two dashboard snapshots and reports which fields changed.

import type {DashboardSongDto, LiveDashboardResponseDto} from '../types/api.types'

export type MusicianDiff = { added: string[]; removed: string[] }
export type SongChange = { from: string | null; to: string | null }

export type DashboardChangeSet = {
  currentSong?: SongChange
  currentMusicians?: MusicianDiff
  nextSong?: SongChange
  nextMusicians?: MusicianDiff
}

function musicianIdsFrom(song?: DashboardSongDto | null | undefined): string[] {
  if (!song?.musicians || !Array.isArray(song.musicians)) return []
  return song.musicians.map((m) => m.id).filter((id): id is string => id !== null)
}

export function compareDashboardSnapshots(
  prev: LiveDashboardResponseDto | null,
  next: LiveDashboardResponseDto
): DashboardChangeSet {
  const changes: DashboardChangeSet = {}

  // Current song change (by id)
  const prevCurrentId = prev?.currentSong?.id ?? null
  const nextCurrentId = next?.currentSong?.id ?? null
  if (prevCurrentId !== nextCurrentId) {
    changes.currentSong = { from: prevCurrentId, to: nextCurrentId }
  }

  // Current musicians change (by id)
  const prevCurrentMusicians = musicianIdsFrom(prev?.currentSong)
  const nextCurrentMusicians = musicianIdsFrom(next?.currentSong)
  const addedCurrent = nextCurrentMusicians.filter((id) => !prevCurrentMusicians.includes(id))
  const removedCurrent = prevCurrentMusicians.filter((id) => !nextCurrentMusicians.includes(id))
  if (addedCurrent.length > 0 || removedCurrent.length > 0) {
    changes.currentMusicians = { added: addedCurrent, removed: removedCurrent }
  }

  // Next songs: compare first song only (for "next song changed" detection)
  const prevNextId = prev?.nextSongs?.[0]?.id ?? null
  const nextNextId = next?.nextSongs?.[0]?.id ?? null
  if (prevNextId !== nextNextId) {
    changes.nextSong = { from: prevNextId, to: nextNextId }
  }

  // Next musicians: compare first song's musicians only
  const prevNextMusicians = musicianIdsFrom(prev?.nextSongs?.[0])
  const nextNextMusicians = musicianIdsFrom(next?.nextSongs?.[0])
  const addedNext = nextNextMusicians.filter((id) => !prevNextMusicians.includes(id))
  const removedNext = prevNextMusicians.filter((id) => !nextNextMusicians.includes(id))
  if (addedNext.length > 0 || removedNext.length > 0) {
    changes.nextMusicians = { added: addedNext, removed: removedNext }
  }

  return changes
}

