import { http, HttpResponse } from 'msw'
import { liveStateFixture } from './djFixtures'
import { musicFixtures } from './jamMusicFixtures'

export const feedbackHandlers = [
  http.post('*/feedback', () => HttpResponse.json({
    success: true,
    data: {
      id: 'feedback-fixture',
      rating: 5,
      comment: 'Great flow',
      createdAt: '2026-09-11T12:00:00.000Z',
    },
  })),
]

export const architectureCloseoutHandlers = [
  http.get('*/musicas', () => HttpResponse.json({
    success: true,
    data: [musicFixtures.approved, musicFixtures.suggested],
    meta: { total: 2, skip: 0, take: 50 },
  })),
  http.get('*/jams/jam-live-control/live/state', () => HttpResponse.json({
    success: true,
    data: {
      ...liveStateFixture,
      nextSongs: [
        liveStateFixture.nextSongs[0],
        {
          ...liveStateFixture.suggestedSongs[0],
          id: 'live-later',
          order: 4,
          status: 'SCHEDULED',
        },
      ],
    },
  })),
]

export const workbenchRequestHandlers = feedbackHandlers
