import type {
  JamResponseDto,
  MusicResponseDto,
  MusicianResponseDto,
  RegistrationResponseDto,
  ScheduleResponseDto,
} from '../types/api.types'

export interface WorkbenchCoverageRecord {
  id: string
  disposition: 'story' | 'exempt'
  reason?: string
}

const story = (id: string): WorkbenchCoverageRecord => ({ id, disposition: 'story' })
const exempt = (id: string, reason: string): WorkbenchCoverageRecord => ({ id, disposition: 'exempt', reason })

export const jamMusicWorkbenchCoverage: WorkbenchCoverageRecord[] = [
  story('ui.0034'),
  story('ui.0036'),
  exempt('ui.0039', 'Loading patterns are catalogued together by #34.'),
  exempt('ui.0040', 'Domain overlays are catalogued together by #33.'),
  exempt('ui.0041', 'Domain overlays and forms are catalogued together by #33.'),
  exempt('ui.0042', 'Domain overlays and forms are catalogued together by #33.'),
  story('ui.0043'),
  story('ui.0044'),
  story('ui.0049'),
  story('ui.0050'),
  story('ui.0051'),
  exempt('ui.0052', 'Loading patterns are catalogued together by #34.'),
  story('ui.0053'),
  story('ui.0057'),
  story('ui.0058'),
  story('ui.0059'),
  story('ui.0060'),
  exempt('ui.0061', 'Domain overlays are catalogued together by #33.'),
  exempt('ui.0062', 'Domain overlays and forms are catalogued together by #33.'),
  exempt('ui.0063', 'Domain forms are catalogued together by #33.'),
  exempt('ui.0064', 'Local helper has no exported render seam; revisit when its unexported table row is made public.'),
  story('ui.0065'),
  story('ui.0173'),
  story('ui.0174'),
  story('ui.0175'),
  story('ui.0176'),
  exempt('ui.0137', 'Route-level data composition is reviewed with page catalogue work, not reusable UI.'),
  exempt('ui.0138', 'Route-level data composition is reviewed with page catalogue work, not reusable UI.'),
  exempt('ui.0141', 'Route-level data composition is reviewed with page catalogue work, not reusable UI.'),
  exempt('ui.0142', 'Local host-dashboard implementation detail is covered by its route composition.'),
  exempt('ui.0143', 'Route-level data composition is reviewed with page catalogue work, not reusable UI.'),
  exempt('ui.0144', 'Route-level data composition is reviewed with page catalogue work, not reusable UI.'),
  exempt('ui.0149', 'Route-level data composition is reviewed with page catalogue work, not reusable UI.'),
  exempt('ui.0155', 'Route-level data composition is reviewed with page catalogue work, not reusable UI.'),
  exempt('ui.0157', 'Route-level data composition is reviewed with page catalogue work, not reusable UI.'),
  exempt('ui.0160', 'Route-level data composition is reviewed with page catalogue work, not reusable UI.'),
  exempt('ui.0161', 'Route-level data composition is reviewed with page catalogue work, not reusable UI.'),
]

export const musicianFixtures = {
  host: {
    id: 'host-fixture',
    name: 'Ana Host',
    instrument: 'guitars',
    level: 'PROFESSIONAL',
    email: 'ana@example.test',
    isHost: true,
    createdAt: '2026-09-01T12:00:00.000Z',
  },
  vocalist: {
    id: 'musician-fixture',
    name: 'Yuri Musician',
    instrument: 'vocals',
    level: 'ADVANCED',
    isHost: false,
    createdAt: '2026-09-02T12:00:00.000Z',
  },
  drummer: {
    id: 'drummer-fixture',
    name: 'Marina Oliveira com um nome artisticamente muito comprido',
    instrument: 'drums',
    level: 'INTERMEDIATE',
    isHost: false,
    createdAt: '2026-09-03T12:00:00.000Z',
  },
} satisfies Record<string, MusicianResponseDto>

const registrations: RegistrationResponseDto[] = [
  {
    id: 'registration-vocals',
    musicianId: musicianFixtures.vocalist.id,
    jamId: 'jam-friday',
    scheduleId: 'schedule-in-progress',
    instrument: 'vocals',
    status: 'APPROVED',
    createdAt: '2026-09-10T12:00:00.000Z',
    musician: musicianFixtures.vocalist,
  },
  {
    id: 'registration-drums',
    musicianId: musicianFixtures.drummer.id,
    jamId: 'jam-friday',
    scheduleId: 'schedule-in-progress',
    instrument: 'drums',
    status: 'APPROVED',
    createdAt: '2026-09-10T12:01:00.000Z',
    musician: musicianFixtures.drummer,
  },
]

export const musicFixtures = {
  approved: {
    id: 'music-psycho-killer',
    title: 'Psycho Killer',
    artist: 'Talking Heads',
    genre: 'New Wave',
    duration: 261,
    description: 'A tight, danceable arrangement with the original call-and-response ending.',
    info: 'Count in: four clicks.\nEnd on the final “fa-fa-fa” phrase.',
    link: 'https://open.spotify.com/track/7dSCxR4LqkmxoBrq9MzVSD',
    status: 'APPROVED',
    createdAt: '2026-09-04T12:00:00.000Z',
    neededDrums: 1,
    neededGuitars: 1,
    neededVocals: 1,
    neededBass: 1,
    neededKeys: 0,
  },
  suggested: {
    id: 'music-satisfaction',
    title: "(I Can't Get No) Satisfaction",
    artist: 'The Rolling Stones',
    genre: 'Rock',
    duration: 223,
    description: 'Suggested by a guest musician; host approval is still required.',
    status: 'SUGGESTED',
    createdAt: '2026-09-05T12:00:00.000Z',
    neededDrums: 1,
    neededGuitars: 2,
    neededVocals: 1,
    neededBass: 1,
    neededKeys: 0,
  },
  longContent: {
    id: 'music-long-content',
    title: 'A Song Title Deliberately Long Enough to Exercise Narrow Cards and Truncation Safely',
    artist: 'The International Collective of Musicians with an Equally Long Stage Name',
    genre: 'Alternative / Experimental',
    duration: 487,
    description: 'Play the extended arrangement, repeat the bridge twice, leave eight bars for the guitar solo, and return quietly for the last chorus.',
    info: 'Capo on the second fret. Watch the host for the final stop. This note intentionally exercises wrapping across several lines.',
    status: 'APPROVED',
    createdAt: '2026-09-06T12:00:00.000Z',
    neededDrums: 1,
    neededGuitars: 3,
    neededVocals: 2,
    neededBass: 1,
    neededKeys: 1,
  },
} satisfies Record<string, MusicResponseDto>

const schedule = (
  id: string,
  order: number,
  status: ScheduleResponseDto['status'],
  music: MusicResponseDto,
  assigned: RegistrationResponseDto[] = [],
): ScheduleResponseDto => ({
  id,
  jamId: 'jam-friday',
  musicId: music.id,
  order,
  status,
  createdAt: '2026-09-07T12:00:00.000Z',
  music,
  registrations: assigned.map((registration) => ({ ...registration, scheduleId: id })),
})

export const scheduleFixtures: ScheduleResponseDto[] = [
  schedule('schedule-upcoming', 1, 'SCHEDULED', musicFixtures.longContent),
  schedule('schedule-in-progress', 2, 'IN_PROGRESS', musicFixtures.approved, registrations),
  schedule('schedule-completed', 3, 'COMPLETED', musicFixtures.approved, registrations),
  schedule('schedule-suggested', 4, 'SUGGESTED', musicFixtures.suggested),
]

export const jamFixtures = {
  active: {
    id: 'jam-friday',
    name: 'Friday Night Jam',
    hostName: 'Ana Host',
    description: 'An open stage for musicians to meet, choose a song, and build a band together.',
    date: '2026-09-18T20:00:00.000Z',
    location: 'Benjamin Social Club',
    slug: 'friday-night-jam',
    shortCode: 'FNJ26',
    spotifyPlaylistUrl: 'https://open.spotify.com/playlist/workbench-fixture',
    status: 'ACTIVE',
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-11T12:00:00.000Z',
    _count: { jamMusics: 4, registrations: 12, schedules: 4 },
    schedules: scheduleFixtures,
  },
  longContent: {
    id: 'jam-long-content',
    name: 'Jam Session with a Deliberately Long Venue and Event Name for Responsive Review',
    hostName: 'Ana Host and the Benjamin Social Club Production Collective',
    description: 'Bring your instrument, arrive before soundcheck, and speak with the host about arrangements. This intentionally long description checks three-line truncation and translated layouts.',
    date: '2026-10-24T19:30:00.000Z',
    status: 'LIVE',
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-11T12:00:00.000Z',
    _count: { jamMusics: 27, registrations: 48, schedules: 27 },
    schedules: scheduleFixtures,
  },
} satisfies Record<string, JamResponseDto>
