import type { JamDetails } from '../services'
import type { ScheduleResponseDto } from '../types/api.types'
import type { AuthContextType, AuthUser, UserRole } from '../types/auth.types'

export type WorkbenchAuthRole = 'guest' | UserRole

const users: Record<UserRole, AuthUser> = {
  viewer: {
    id: 'viewer-fixture',
    name: 'Vera Viewer',
    email: 'viewer@example.test',
    role: 'viewer',
    isHost: false,
    registrationComplete: true,
  },
  user: {
    id: 'musician-fixture',
    name: 'Yuri Musician',
    email: 'musician@example.test',
    role: 'user',
    isHost: false,
    instrument: 'vocals',
    registrationComplete: true,
  },
  host: {
    id: 'host-fixture',
    name: 'Ana Host',
    email: 'host@example.test',
    role: 'host',
    isHost: true,
    registrationComplete: true,
  },
}

const successfulResult = async (): Promise<{ success: true }> => ({ success: true })
const noOperation = (): void => undefined

export function createAuthFixture(
  selectedRole: WorkbenchAuthRole = 'host',
  overrides: Partial<AuthContextType> = {},
): AuthContextType {
  const role = selectedRole === 'guest' ? 'viewer' : selectedRole
  const user = selectedRole === 'guest' ? null : users[role]

  return {
    user,
    isAuthenticated: selectedRole !== 'guest',
    isLoading: false,
    role,
    isNewUser: false,
    isLoggingOut: false,
    loginWithEmail: successfulResult,
    signUpWithEmail: successfulResult,
    loginWithOAuth: successfulResult,
    logout: successfulResult,
    resetPassword: successfulResult,
    login: noOperation,
    setRole: noOperation,
    updateUser: noOperation,
    updateProfile: successfulResult,
    completeOnboarding: successfulResult,
    clearNewUserFlag: noOperation,
    isUser: () => selectedRole === 'user',
    isViewer: () => selectedRole === 'viewer',
    ...overrides,
  }
}

export const registrationJam = {
  id: 'jam-fixture',
  name: 'Friday Night Jam',
  date: '2026-09-18',
  status: 'ACTIVE',
  specialtySlots: [
    { specialty: 'guitar', required: 2, registered: 1 },
    { specialty: 'vocals', required: 1, registered: 0 },
  ],
} satisfies JamDetails

export const nextSong = {
  id: 'dashboard-song-fixture',
  title: 'Psycho Killer',
  artist: 'Talking Heads',
  duration: 261,
  musicians: [
    { id: 'dashboard-musician-fixture', name: 'Yuri', instrument: 'vocals' },
  ],
}

export const searchableMusic = [
  { id: 'music-psycho-killer', title: 'Psycho Killer', artist: 'Talking Heads' },
  { id: 'music-satisfaction', title: "(I Can't Get No) Satisfaction", artist: 'The Rolling Stones' },
]

export const blankMusicForm = {
  title: '',
  artist: '',
  description: '',
  link: '',
  info: '',
  genre: '',
  duration: '',
  neededDrums: 1,
  neededGuitars: 2,
  neededVocals: 1,
  neededBass: 1,
  neededKeys: 0,
}

export const inProgressSchedule: ScheduleResponseDto = {
  id: 'schedule-fixture',
  jamId: 'jam-fixture',
  musicId: 'music-fixture',
  order: 3,
  status: 'IN_PROGRESS',
  createdAt: '2026-09-11T12:00:00.000Z',
  music: {
    id: 'music-fixture',
    title: 'Psycho Killer',
    artist: 'Talking Heads',
    genre: 'New Wave',
    duration: 261,
    neededDrums: 1,
    neededGuitars: 1,
    neededVocals: 1,
    neededBass: 1,
    neededKeys: 0,
    createdAt: '2026-09-11T12:00:00.000Z',
  },
  registrations: [
    {
      id: 'registration-fixture',
      musicianId: 'musician-fixture',
      jamId: 'jam-fixture',
      scheduleId: 'schedule-fixture',
      instrument: 'vocals',
      status: 'APPROVED',
      createdAt: '2026-09-11T12:00:00.000Z',
      musician: {
        id: 'musician-fixture',
        name: 'Yuri',
        instrument: 'vocals',
        level: 'ADVANCED',
        isHost: false,
        createdAt: '2026-09-11T12:00:00.000Z',
      },
    },
  ],
}
