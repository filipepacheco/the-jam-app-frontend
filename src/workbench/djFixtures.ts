import type { LiveStateMusic, LiveStateResponseDto, LiveStateSongDto } from '../types/jamControl.types'
import { musicFixtures } from './jamMusicFixtures'

const song = (
  id: string,
  order: number,
  status: LiveStateSongDto['status'],
  music: LiveStateMusic,
): LiveStateSongDto => ({
  id,
  order,
  status,
  music,
  musicians: [
    { id: `${id}-voice`, name: 'Yuri', instrument: 'vocals' },
    { id: `${id}-guitar`, name: 'Alexandra with a long stage name', instrument: 'guitars' },
  ],
})

export const djSongs = {
  previous: song('live-previous', 1, 'COMPLETED', musicFixtures.approved),
  current: song('live-current', 2, 'IN_PROGRESS', musicFixtures.longContent),
  next: song('live-next', 3, 'SCHEDULED', musicFixtures.approved),
  suggested: song('live-suggested', 4, 'SUGGESTED', musicFixtures.suggested),
}

export const liveStateFixture: LiveStateResponseDto = {
  previousSongs: [djSongs.previous],
  currentSong: djSongs.current,
  nextSongs: [djSongs.next],
  suggestedSongs: [djSongs.suggested],
  jamStatus: 'ACTIVE',
  playbackState: 'PLAYING',
}

export const djWorkbenchCoverage = [
  { id: 'ui.0011', disposition: 'story' },
  { id: 'ui.0012', disposition: 'story' },
  { id: 'ui.0013', disposition: 'story' },
  { id: 'ui.0015', disposition: 'story' },
  { id: 'ui.0016', disposition: 'story', owner: 'parent' },
  { id: 'ui.0104', disposition: 'exempt', reason: 'Polling and reorder hooks are internal; remove when deterministic adapters are injectable.' },
  { id: 'ui.0105', disposition: 'exempt', reason: 'Private child is inspected through LiveJamControlPanel once its hooks are injectable.' },
  { id: 'ui.0106', disposition: 'exempt', reason: 'Private child is inspected through LiveJamControlPanel once its hooks are injectable.' },
  { id: 'ui.0159', disposition: 'exempt', reason: 'Route-level control orchestration has no injectable polling seam; primitives are covered directly.' },
] as const
