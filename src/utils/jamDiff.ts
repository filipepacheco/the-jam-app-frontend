// Jam diff utility
// Compares two jam snapshots and reports which of the four tracked fields changed.

export type JamSnapshot = {
  currentSong?: { id: string } | null
  currentMusicians?: Array<{ id: string }> | null
  nextSong?: { id: string } | null
  nextMusicians?: Array<{ id: string }> | null
  [k: string]: any
}

export type MusicianDiff = { added: string[]; removed: string[] }
export type SongChange = { from: string | null; to: string | null }

export type ChangeSet = {
  currentSong?: SongChange
  currentMusicians?: MusicianDiff
  nextSong?: SongChange
  nextMusicians?: MusicianDiff
}

function idsFrom(list?: Array<{ id?: string } | null> | null | undefined): string[] {
  if (!list || !Array.isArray(list)) return []
  return list
    .map((i) => (i && typeof i.id === 'string' ? i.id : null))
    .filter((id): id is string => id !== null)
}

export function compareJamSnapshots(prev: JamSnapshot | null, next: JamSnapshot): ChangeSet {
  const changes: ChangeSet = {}

  // Current song
  const prevCurrentId = prev?.currentSong?.id ?? null
  const nextCurrentId = next?.currentSong?.id ?? null
  if (prevCurrentId !== nextCurrentId) {
    changes.currentSong = { from: prevCurrentId, to: nextCurrentId }
  }

  // Next song
  const prevNextId = prev?.nextSong?.id ?? null
  const nextNextId = next?.nextSong?.id ?? null
  if (prevNextId !== nextNextId) {
    changes.nextSong = { from: prevNextId, to: nextNextId }
  }

  // Current musicians
  const prevCurrentMusicianIds = idsFrom(prev?.currentMusicians)
  const nextCurrentMusicianIds = idsFrom(next?.currentMusicians)
  const addedCurrent = nextCurrentMusicianIds.filter((id) => !prevCurrentMusicianIds.includes(id))
  const removedCurrent = prevCurrentMusicianIds.filter((id) => !nextCurrentMusicianIds.includes(id))
  if (addedCurrent.length > 0 || removedCurrent.length > 0) {
    changes.currentMusicians = { added: addedCurrent, removed: removedCurrent }
  }

  // Next musicians
  const prevNextMusicianIds = idsFrom(prev?.nextMusicians)
  const nextNextMusicianIds = idsFrom(next?.nextMusicians)
  const addedNext = nextNextMusicianIds.filter((id) => !prevNextMusicianIds.includes(id))
  const removedNext = prevNextMusicianIds.filter((id) => !nextNextMusicianIds.includes(id))
  if (addedNext.length > 0 || removedNext.length > 0) {
    changes.nextMusicians = { added: addedNext, removed: removedNext }
  }

  return changes
}

