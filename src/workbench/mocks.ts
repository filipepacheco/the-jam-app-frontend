import { http, HttpResponse } from 'msw'

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

export const workbenchRequestHandlers = [...feedbackHandlers]
