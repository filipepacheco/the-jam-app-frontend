import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import type {ScheduleResponseDto} from '../types/api.types'
import {ScheduleEnrollmentModal} from '../components/schedule/ScheduleEnrollmentModal'
import {PerformanceSelectionModal} from '../components/jam-detail-v2/PerformanceSelectionModal'
import {MemoryRouter} from 'react-router-dom'
import '../i18n'

const schedule: ScheduleResponseDto = {
  id: 'schedule-1', jamId: 'jam-1', musicId: 'music-1', order: 1, status: 'SCHEDULED',
  createdAt: '2026-09-24T18:00:00.000Z',
  music: {id: 'music-1', title: 'Test song', artist: 'Artist', createdAt: '2026-09-24T18:00:00.000Z'},
  registrations: [
    {id: 'mine', musicianId: 'musician-1', jamId: 'jam-1', instrument: 'guitars', status: 'PENDING'},
    {id: 'other', musicianId: 'musician-2', jamId: 'jam-1', instrument: 'bass', status: 'APPROVED'},
    {id: 'old', musicianId: 'musician-1', jamId: 'jam-1', instrument: 'vocals', status: 'WITHDRAWN'},
  ],
}

describe('ScheduleEnrollmentModal withdrawal', () => {
  it('offers withdrawal only for the current musician’s active registration', async () => {
    const onWithdraw = vi.fn().mockResolvedValue({code: 'success', operation: 'withdrawal', entityId: 'mine'})
    render(<MemoryRouter><ScheduleEnrollmentModal
      schedule={schedule} isOpen musicianId="musician-1"
      onClose={vi.fn()} onSubmit={vi.fn()} onWithdraw={onWithdraw}
    /></MemoryRouter>)

    const withdrawButtons = screen.getAllByRole('button', {name: /withdraw|retirar/i})
    expect(withdrawButtons).toHaveLength(1)
    fireEvent.click(withdrawButtons[0])
    await waitFor(() => expect(onWithdraw).toHaveBeenCalledWith('mine'))
  })

  it('permits restoring the musician’s withdrawn instrument when the slot appears full', async () => {
    const onSubmit = vi.fn().mockResolvedValue({code: 'success', operation: 'registration', entityId: schedule.id})
    const fullSchedule: ScheduleResponseDto = {
      ...schedule,
      music: {...schedule.music, neededGuitars: 1},
      registrations: [
        {id: 'other', musicianId: 'musician-2', jamId: 'jam-1', instrument: 'guitars', status: 'APPROVED'},
        {id: 'old', musicianId: 'musician-1', jamId: 'jam-1', instrument: 'guitars', status: 'WITHDRAWN'},
      ],
    }
    render(<MemoryRouter><ScheduleEnrollmentModal
      schedule={fullSchedule} isOpen musicianId="musician-1" preferredInstrument="guitar"
      onClose={vi.fn()} onSubmit={onSubmit}
    /></MemoryRouter>)

    const guitarChoice = screen.getByRole('button', {name: /guitarras/i})
    expect(guitarChoice).toBeEnabled()
    fireEvent.click(screen.getByRole('button', {name: /inscreva-se agora/i}))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('guitars'))
  })
})

describe('Performance selection for withdrawal', () => {
  it('keeps an already registered upcoming performance selectable', () => {
    const onSelectPerformance = vi.fn()
    render(<MemoryRouter><PerformanceSelectionModal
      performances={[schedule]} isOpen userId="musician-1"
      onClose={vi.fn()} onSelectPerformance={onSelectPerformance}
    /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', {name: /Test song/i}))
    expect(onSelectPerformance).toHaveBeenCalledWith(schedule)
  })
})
