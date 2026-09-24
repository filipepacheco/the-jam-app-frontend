import {useCallback, useEffect, useMemo, useState} from 'react'
import type {DashboardMusicianDto, DashboardSongDto} from '../../types/api.types'

export interface Join {
  key: string
  songId: string
  title: string
  musician: DashboardMusicianDto
}

/** One announcement: the names that fly in, plus a count of the rest. */
export interface JoinMoment {
  id: number
  joins: Join[]
  extra: number
}

/** Names that fly in one announcement; the rest read "and N more". */
const MAX_NAMES = 3
/** Announcements waiting their turn; later joins merge into the last one. */
const MAX_QUEUED = 3
/** Every announcement ends, so a sign-up never stays hidden in its lineup. */
export const MOMENT_TIMEOUT_MS = 10000

export const joinKey = (songId: string, musicianId: string) => `${songId}:${musicianId}`

interface Tracker {
  signature: string
  currentId: string | null
  songs: ReadonlySet<string>
  musicians: ReadonlySet<string>
  pairs: ReadonlySet<string>
  queue: JoinMoment[]
  nextId: number
}

function readQueue(songs: DashboardSongDto[]) {
  const pairs = new Set<string>()
  const musicians = new Set<string>()
  for (const song of songs) {
    for (const {id} of song.musicians) {
      pairs.add(joinKey(song.id, id))
      musicians.add(id)
    }
  }
  const ids = songs.map(({id}) => id)
  return {pairs, musicians, songs: new Set(ids), signature: `${ids.join('|')}#${[...pairs].sort().join('|')}`}
}

/**
 * A join is a named musician new to the whole queue. A move between songs, or
 * a second sign-up by someone already queued, is not. When the queue moves on,
 * a song new to the list may only have slid into view, so it does not count.
 */
function findJoins(songs: DashboardSongDto[], before: Tracker, advanced: boolean) {
  const seen = new Set<string>()
  return songs.flatMap(song => advanced && !before.songs.has(song.id) ? [] : song.musicians
    .filter(({id, name}) => {
      if (!name || before.musicians.has(id) || seen.has(id)) return false
      seen.add(id)
      return true
    })
    .map(musician => ({key: joinKey(song.id, musician.id), songId: song.id, title: song.title, musician})))
}

function enqueue(queue: JoinMoment[], joins: Join[], id: number): JoinMoment[] {
  if (queue.length < MAX_QUEUED) {
    return [...queue, {id, joins: joins.slice(0, MAX_NAMES), extra: Math.max(0, joins.length - MAX_NAMES)}]
  }
  const last = queue[queue.length - 1]
  const merged = [...last.joins, ...joins]
  return [...queue.slice(0, -1), {...last, joins: merged.slice(0, MAX_NAMES), extra: last.extra + Math.max(0, merged.length - MAX_NAMES)}]
}

/**
 * Turns new sign-ups anywhere in the queue into spotlight moments, one at a
 * time. Decided during render, so an arriving name is hidden (`awaiting`) on
 * the very frame its lineup slot appears, until the spotlight flies it in.
 */
export function useJoinSpotlight(
  currentSong: DashboardSongDto | null,
  nextSongs: DashboardSongDto[],
  {enabled, flight, paused}: {enabled: boolean; flight: boolean; paused: boolean},
) {
  const songs = currentSong ? [currentSong, ...nextSongs] : nextSongs
  const snapshot = readQueue(songs)
  const currentId = currentSong?.id ?? null
  const [tracker, setTracker] = useState<Tracker>(() => ({...snapshot, currentId, queue: [], nextId: 1}))

  let next = tracker
  if (snapshot.signature !== tracker.signature || currentId !== tracker.currentId) {
    const joins = enabled ? findJoins(songs, tracker, currentId !== tracker.currentId) : []
    next = joins.length > 0
      ? {...snapshot, currentId, queue: enqueue(tracker.queue, joins, tracker.nextId), nextId: tracker.nextId + 1}
      : {...snapshot, currentId, queue: tracker.queue, nextId: tracker.nextId}
  }
  // Nobody watches a hidden or other layout: drop the queue, show every name.
  if (!enabled && next.queue.length > 0) next = {...next, queue: []}
  if (next !== tracker) setTracker(next)

  const {queue} = next
  const moment = queue[0] ?? null
  const awaiting = useMemo<ReadonlySet<string>>(
    () => new Set(flight ? queue.flatMap(({joins}) => joins.map(({key}) => key)) : []),
    [queue, flight],
  )
  const finish = useCallback((id: number) => setTracker(current => current.queue.some(moment => moment.id === id)
    ? {...current, queue: current.queue.filter(moment => moment.id !== id)}
    : current), [])

  useEffect(() => {
    if (!moment || paused) return
    const timer = setTimeout(() => finish(moment.id), MOMENT_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [moment, paused, finish])

  return {moment, awaiting, finish}
}
