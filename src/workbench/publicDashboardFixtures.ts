import type { DashboardSongDto, LiveDashboardResponseDto } from '../types/api.types'

export const dashboardSongs = {
  current: {
    id: 'dashboard-current',
    title: 'Psycho Killer',
    artist: 'Talking Heads',
    duration: 261,
    musicians: [
      { id: 'dashboard-vocal', name: 'Yuri', instrument: 'vocals' },
      { id: 'dashboard-guitar', name: 'Alexandra de la Cruz', instrument: 'guitars' },
      { id: 'dashboard-drums', name: 'Marina', instrument: 'drums' },
    ],
  },
  next: {
    id: 'dashboard-next',
    title: 'A Song Title Deliberately Long Enough for a Shared Venue Display',
    artist: 'The International Collective with an Equally Long Stage Name',
    duration: 487,
    musicians: [{ id: 'dashboard-next-bass', name: 'Benjamin', instrument: 'bass' }],
  },
} satisfies Record<string, DashboardSongDto>

export const venueDashboard: LiveDashboardResponseDto = {
  jamId: 'jam-public',
  jamName: 'Friday Night Jam at Benjamin Social Club',
  qrCode: null,
  slug: 'friday-night-jam',
  shortCode: 'FNJ26',
  jamStatus: 'LIVE',
  playbackState: 'PLAYING',
  currentSong: dashboardSongs.current,
  nextSongs: [{
    ...dashboardSongs.next,
    title: 'Valerie',
    artist: 'Amy Winehouse',
    musicians: [
      {id: 'next-vocal', name: 'Camila', instrument: 'vocals'},
      {id: 'next-guitar', name: 'Rafael', instrument: 'guitars'},
      {id: 'next-bass', name: 'Benjamin', instrument: 'bass'},
      {id: 'next-drums', name: 'Luiza', instrument: 'drums'},
    ],
  }],
}

export const publicDashboardCoverage = [
  'ui.0074', 'ui.0075', 'ui.0076', 'ui.0077', 'ui.0078', 'ui.0079', 'ui.0080',
  'ui.0081', 'ui.0082', 'ui.0083', 'ui.0084', 'ui.0085', 'ui.0086', 'ui.0087',
  'ui.0088', 'ui.0090', 'ui.0091', 'ui.0092', 'ui.0152',
] as const
