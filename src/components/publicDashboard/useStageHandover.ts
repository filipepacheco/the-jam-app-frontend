import {useCallback, useEffect, useRef, useState} from 'react'
import type {DashboardSongDto, PlaybackState} from '../../types/api.types'
import {TEMPO} from './venueMotion'

/** How long the stage thanks the band before the next song takes it: a real round of applause. */
export const APPLAUSE_MS = 10_000
/** Safety net for the up-next flight: its text never stays hidden longer. */
export const BOARDING_MS = 2400 * TEMPO

interface LiveShow {
  currentSong: DashboardSongDto | null
  nextSong: DashboardSongDto | null
  playbackState: PlaybackState
  finished: boolean
}

interface Hold {
  song: DashboardSongDto
  next: DashboardSongDto | null
}

/** The up-next song flying to the stage; its stage copy waits hidden until it lands. */
export interface Boarding {
  song: DashboardSongDto
  id: number
}

interface Tracker {
  song: DashboardSongDto | null
  next: DashboardSongDto | null
  finished: boolean
  /** The stage song played (or paused) while on stage: the room heard it. */
  heard: boolean
  hold: Hold | null
  boarding: Boarding | null
  boardings: number
}

const sameId = (a: DashboardSongDto | null, b: DashboardSongDto | null) => (a?.id ?? null) === (b?.id ?? null)

/** The song the up-next card showed takes the stage: it flies there. */
function board(tracker: Tracker, stage: DashboardSongDto | null, shownNext: DashboardSongDto | null, finished: boolean, flight: boolean) {
  const boards = flight && !finished && Boolean(stage) && sameId(stage, shownNext)
  return boards && stage
    ? {boarding: {song: stage, id: tracker.boardings + 1}, boardings: tracker.boardings + 1}
    : {boarding: null, boardings: tracker.boardings}
}

interface HandoverOptions {
  enabled?: boolean
  /** The up-next song may fly to the stage (motion on, page visible). */
  flight?: boolean
}

/**
 * Directs the handover between songs. When a song the room heard leaves the
 * stage, the stage applauds its band for APPLAUSE_MS while the next card
 * keeps the incoming song; then both cards move on to the latest live data.
 * When the stage takes the song the next card showed, that song boards: it
 * flies across until `land` (or BOARDING_MS) ends the boarding.
 * Decided during render, so the stage never paints the next song first.
 */
export function useStageHandover({currentSong, nextSong, playbackState, finished}: LiveShow, {enabled = true, flight = false}: HandoverOptions = {}) {
  const playing = Boolean(currentSong) && playbackState !== 'STOPPED'
  const [tracker, setTracker] = useState<Tracker>({song: currentSong, next: nextSong, finished, heard: playing, hold: null, boarding: null, boardings: 0})
  const flies = enabled && flight

  let next = tracker
  if (!sameId(tracker.song, currentSong) || tracker.finished !== finished) {
    let hold = tracker.hold
    if (hold && currentSong?.id === hold.song.id && !finished) {
      // The host went back to the same song: no applause after all.
      hold = null
    } else if (!hold && enabled && tracker.song && tracker.heard && !tracker.finished && tracker.song.musicians.some(({name}) => name)) {
      hold = {song: tracker.song, next: tracker.next}
    }
    // A newer handover replaces any flight still in the air.
    const flying = !hold && !tracker.hold ? board(tracker, currentSong, tracker.next, finished, flies) : {boarding: null, boardings: tracker.boardings}
    next = {song: currentSong, next: nextSong, finished, heard: playing, hold, ...flying}
  } else if (tracker.song !== currentSong || tracker.next !== nextSong || (playing && !tracker.heard)) {
    next = {...tracker, song: currentSong, next: nextSong, heard: tracker.heard || playing}
  }
  if (next !== tracker) setTracker(next)

  // Read at release time, so a tab switch during the applause keeps its timer.
  const fliesAtRelease = useRef(flies)
  useEffect(() => {
    fliesAtRelease.current = flies
  })

  const {hold, boarding} = next
  useEffect(() => {
    if (!hold) return
    const timer = setTimeout(() => setTracker(current => current.hold === hold
      ? {...current, hold: null, ...board(current, current.song, hold.next, current.finished, fliesAtRelease.current)}
      : current), APPLAUSE_MS)
    return () => clearTimeout(timer)
  }, [hold])

  const land = useCallback((id: number) => {
    setTracker(current => current.boarding?.id === id ? {...current, boarding: null} : current)
  }, [])
  useEffect(() => {
    if (!boarding) return
    const timer = setTimeout(() => land(boarding.id), BOARDING_MS)
    return () => clearTimeout(timer)
  }, [boarding, land])

  const flying = flies ? boarding : null
  if (enabled && hold) return {stage: null, next: hold.next, finished: false, applause: hold.song, boarding: null, land}
  return {stage: currentSong, next: nextSong, finished, applause: null, boarding: flying, land}
}
