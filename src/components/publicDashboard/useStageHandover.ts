import {useEffect, useState} from 'react'
import type {DashboardSongDto, PlaybackState} from '../../types/api.types'
import {TEMPO} from './venueMotion'

/** How long the stage thanks the band before the next song takes it. */
export const APPLAUSE_MS = 3000 * TEMPO

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

interface Tracker {
  song: DashboardSongDto | null
  next: DashboardSongDto | null
  finished: boolean
  /** The stage song played (or paused) while on stage: the room heard it. */
  heard: boolean
  hold: Hold | null
}

const sameId = (a: DashboardSongDto | null, b: DashboardSongDto | null) => (a?.id ?? null) === (b?.id ?? null)

/**
 * Directs the handover between songs. When a song the room heard leaves the
 * stage, the stage applauds its band for APPLAUSE_MS while the next card
 * keeps the incoming song; then both cards move on to the latest live data.
 * Decided during render, so the stage never paints the next song first.
 */
export function useStageHandover({currentSong, nextSong, playbackState, finished}: LiveShow, enabled = true) {
  const playing = Boolean(currentSong) && playbackState !== 'STOPPED'
  const [tracker, setTracker] = useState<Tracker>({song: currentSong, next: nextSong, finished, heard: playing, hold: null})

  let next = tracker
  if (!sameId(tracker.song, currentSong) || tracker.finished !== finished) {
    let hold = tracker.hold
    if (hold && currentSong?.id === hold.song.id && !finished) {
      // The host went back to the same song: no applause after all.
      hold = null
    } else if (!hold && enabled && tracker.song && tracker.heard && !tracker.finished && tracker.song.musicians.some(({name}) => name)) {
      hold = {song: tracker.song, next: tracker.next}
    }
    next = {song: currentSong, next: nextSong, finished, heard: playing, hold}
  } else if (tracker.song !== currentSong || tracker.next !== nextSong || (playing && !tracker.heard)) {
    next = {...tracker, song: currentSong, next: nextSong, heard: tracker.heard || playing}
  }
  if (next !== tracker) setTracker(next)

  const {hold} = next
  useEffect(() => {
    if (!hold) return
    const timer = setTimeout(() => setTracker(current => current.hold === hold ? {...current, hold: null} : current), APPLAUSE_MS)
    return () => clearTimeout(timer)
  }, [hold])

  if (enabled && hold) return {stage: null, next: hold.next, finished: false, applause: hold.song}
  return {stage: currentSong, next: nextSong, finished, applause: null}
}
