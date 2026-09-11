import { fn } from 'storybook/test'
import type { AuthContextType, AuthUser } from '../types/auth.types'
import type { ScheduleResponseDto } from '../types/api.types'

export const hostUser: AuthUser = {
  id: 'host-fixture',
  name: 'Ana Host',
  email: 'ana@example.test',
  role: 'host',
  isHost: true,
  registrationComplete: true,
}

export function createAuthFixture(overrides: Partial<AuthContextType> = {}): AuthContextType {
  return {
    user: hostUser,
    isAuthenticated: true,
    isLoading: false,
    role: 'host',
    isNewUser: false,
    isLoggingOut: false,
    loginWithEmail: fn(async () => ({ success: true })),
    signUpWithEmail: fn(async () => ({ success: true })),
    loginWithOAuth: fn(async () => ({ success: true })),
    logout: fn(async () => ({ success: true })),
    resetPassword: fn(async () => ({ success: true })),
    login: fn(),
    setRole: fn(),
    updateUser: fn(),
    updateProfile: fn(async () => ({ success: true })),
    completeOnboarding: fn(async () => ({ success: true })),
    clearNewUserFlag: fn(),
    isUser: () => false,
    isViewer: () => false,
    ...overrides,
  }
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
