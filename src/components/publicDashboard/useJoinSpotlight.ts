import {useCallback, useEffect, useMemo, useState} from 'react'
import type {DashboardMusicianDto, DashboardSongDto} from '../../types/api.types'

export interface Join {
  key: string
  songId: string
  title: string
  musician: DashboardMusicianDto
}

/**
 * Where an announcement plays: `next` in the up-next card, where the names
 * fly into its lineup; `queue` under the QR code, for every other song.
 */
export type JoinLane = 'next' | 'queue'

/** One announcement: the names that fly in, plus a count of the rest. */
export interface JoinMoment {
  id: number
  lane: JoinLane
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
  /** Whether the lineup was on screen, and loaded, when it was read. */
  watching: boolean
  songs: ReadonlySet<string>
  pairs: ReadonlySet<string>
  lanes: Record<JoinLane, JoinMoment[]>
  nextId: number
}

function readQueue(songs: DashboardSongDto[]) {
  const pairs = new Set<string>()
  for (const song of songs) {
    for (const {id} of song.musicians) pairs.add(joinKey(song.id, id))
  }
  const ids = songs.map(({id}) => id)
  return {pairs, songs: new Set(ids), signature: `${ids.join('|')}#${[...pairs].sort().join('|')}`}
}

/**
 * A join is a named musician new to a song's lineup, on stage or in the queue:
 * a second song for someone already queued counts, and so does a move. When
 * the queue moves on, a song new to the list may only have slid into view, so
 * its lineup does not count.
 */
function findJoins(songs: DashboardSongDto[], before: Tracker, advanced: boolean) {
  const seen = new Set<string>()
  return songs.flatMap(song => advanced && !before.songs.has(song.id) ? [] : song.musicians
    .filter(({id, name}) => {
      const key = joinKey(song.id, id)
      if (!name || before.pairs.has(key) || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(musician => ({key: joinKey(song.id, musician.id), songId: song.id, title: song.title, musician})))
}

function enqueue(queue: JoinMoment[], lane: JoinLane, joins: Join[], id: number): JoinMoment[] {
  if (joins.length === 0) return queue
  if (queue.length < MAX_QUEUED) {
    return [...queue, {id, lane, joins: joins.slice(0, MAX_NAMES), extra: Math.max(0, joins.length - MAX_NAMES)}]
  }
  const last = queue[queue.length - 1]
  const merged = [...last.joins, ...joins]
  return [...queue.slice(0, -1), {...last, joins: merged.slice(0, MAX_NAMES), extra: last.extra + Math.max(0, merged.length - MAX_NAMES)}]
}

/**
 * Turns new sign-ups into spotlight moments, one at a time in each lane: the
 * up-next song in its own card, the rest under the QR code. Decided during
 * render, so an up-next name is hidden (`awaiting`) on the very frame its
 * lineup slot appears, until the spotlight flies it in.
 */
export function useJoinSpotlight(
  currentSong: DashboardSongDto | null,
  nextSongs: DashboardSongDto[],
  {enabled, flight, paused}: {enabled: boolean; flight: boolean; paused: boolean},
) {
  const songs = currentSong ? [currentSong, ...nextSongs] : nextSongs
  const snapshot = readQueue(songs)
  const currentId = currentSong?.id ?? null
  const [tracker, setTracker] = useState<Tracker>(() => ({...snapshot, currentId, watching: enabled, lanes: {next: [], queue: []}, nextId: 1}))
  const upNextId = nextSongs[0]?.id ?? null

  let next = tracker
  if (snapshot.signature !== tracker.signature || currentId !== tracker.currentId || enabled !== tracker.watching) {
    // A lineup nobody watched (hidden, another layout, still loading) is not
    // news: the first one on screen only sets what the room already knows.
    const joins = enabled && tracker.watching ? findJoins(songs, tracker, currentId !== tracker.currentId) : []
    const upNext = joins.filter(({songId}) => songId === upNextId)
    const later = joins.filter(({songId}) => songId !== upNextId)
    // An up-next song that moved on (to the stage) announces under the QR code
    // instead; one that left the board has nothing left to announce.
    const stillNext = tracker.lanes.next.filter(({joins: waiting}) => waiting.every(({songId}) => songId === upNextId))
    const movedOn = tracker.lanes.next
      .filter(moment => !stillNext.includes(moment))
      .map(moment => ({...moment, lane: 'queue' as const, joins: moment.joins.filter(({songId}) => snapshot.songs.has(songId))}))
      .filter(({joins: waiting}) => waiting.length > 0)
    next = {
      ...snapshot,
      currentId,
      watching: enabled,
      lanes: {
        next: enqueue(stillNext, 'next', upNext, tracker.nextId),
        queue: enqueue([...tracker.lanes.queue, ...movedOn], 'queue', later, tracker.nextId + 1),
      },
      nextId: tracker.nextId + 2,
    }
  }
  // Nobody watches a hidden or other layout: drop the queue, show every name.
  if (!enabled && (next.lanes.next.length > 0 || next.lanes.queue.length > 0)) next = {...next, lanes: {next: [], queue: []}}
  if (next !== tracker) setTracker(next)

  const {lanes} = next
  const upNextMoment = lanes.next[0] ?? null
  const queueMoment = lanes.queue[0] ?? null
  // Only up-next names fly; a later song is not on screen, so nothing waits for it.
  const awaiting = useMemo<ReadonlySet<string>>(
    () => new Set(flight ? lanes.next.flatMap(({joins}) => joins.map(({key}) => key)) : []),
    [lanes.next, flight],
  )
  const finish = useCallback((id: number) => setTracker(current => {
    const {next: waitingNext, queue: waitingQueue} = current.lanes
    if (!waitingNext.some(moment => moment.id === id) && !waitingQueue.some(moment => moment.id === id)) return current
    return {...current, lanes: {next: waitingNext.filter(moment => moment.id !== id), queue: waitingQueue.filter(moment => moment.id !== id)}}
  }), [])

  useMomentTimeout(upNextMoment, paused, finish)
  useMomentTimeout(queueMoment, paused, finish)

  return {next: upNextMoment, queue: queueMoment, awaiting, finish}
}

function useMomentTimeout(moment: JoinMoment | null, paused: boolean, finish: (id: number) => void) {
  useEffect(() => {
    if (!moment || paused) return
    const timer = setTimeout(() => finish(moment.id), MOMENT_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [moment, paused, finish])
}
