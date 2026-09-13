import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {MemoryRouter} from 'react-router-dom'
import type {ScheduleResponseDto} from '../types/api.types'
import {HostMusicianRegistrationModal} from '../components/schedule/HostMusicianRegistrationModal'

const services = vi.hoisted(() => ({
  findMusicians: vi.fn(),
  createRegistration: vi.fn(),
}))
const translate = vi.hoisted(() => (key: string) => key)

vi.mock('../services', () => ({
  musicianService: {findAll: services.findMusicians},
  registrationService: {create: services.createRegistration},
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({t: translate}),
}))

const performance: ScheduleResponseDto = {
  id: 'performance-1',
  jamId: 'jam-1',
  musicId: 'music-1',
  order: 1,
  status: 'SCHEDULED',
  createdAt: '2026-09-24T18:00:00.000Z',
  music: {
    id: 'music-1',
    title: 'Psycho Killer',
    artist: 'Talking Heads',
    neededDrums: 2,
    createdAt: '2026-09-24T18:00:00.000Z',
  },
  registrations: [],
}

describe('HostMusicianRegistrationModal', () => {
  beforeEach(() => {
    services.findMusicians.mockReset()
    services.createRegistration.mockReset()
    services.findMusicians.mockResolvedValue({
      success: true,
      data: [
        {id: 'musician-1', name: 'Tina', isHost: false, createdAt: '2026-09-24T18:00:00.000Z'},
        {id: 'musician-2', name: 'Chris', isHost: false, createdAt: '2026-09-24T18:00:00.000Z'},
      ],
    })
    services.createRegistration
      .mockResolvedValueOnce({success: true, data: {id: 'registration-1'}})
      .mockResolvedValueOnce({success: false, data: null, error: 'Already registered'})
  })

  it('keeps resolved-failure entries visible and retryable after partial batch success', async () => {
    const onClose = vi.fn()
    const onBatchComplete = vi.fn()
    render(
      <MemoryRouter>
        <HostMusicianRegistrationModal
          schedule={performance}
          isOpen
          onClose={onClose}
          onBatchComplete={onBatchComplete}
        />
      </MemoryRouter>,
    )

    await waitFor(() => expect(services.findMusicians).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByLabelText('schedule.select_musician')).toHaveTextContent('Tina'))
    fireEvent.change(screen.getByLabelText('schedule.select_musician'), {target: {value: 'musician-1'}})
    fireEvent.change(screen.getByLabelText('schedule.select_instrument'), {target: {value: 'drums'}})
    fireEvent.click(screen.getByRole('button', {name: 'schedule.batch.add_to_queue', hidden: true}))
    fireEvent.change(screen.getByLabelText('schedule.select_musician'), {target: {value: 'musician-2'}})
    fireEvent.change(screen.getByLabelText('schedule.select_instrument'), {target: {value: 'drums'}})
    fireEvent.click(screen.getByRole('button', {name: 'schedule.batch.add_to_queue', hidden: true}))

    fireEvent.click(screen.getByRole('button', {name: 'schedule.batch.submit_all', hidden: true}))

    await waitFor(() => expect(onBatchComplete).toHaveBeenCalledWith({
      kind: 'partial',
      succeeded: 1,
      failed: 1,
    }))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.queryByText(/Tina -/)).not.toBeInTheDocument()
    expect(screen.getByText(/Chris -/)).toBeInTheDocument()
    expect(screen.getByText('schedule.batch.partial_error')).toBeInTheDocument()

    services.createRegistration.mockResolvedValueOnce({success: true, data: {id: 'registration-2'}})
    fireEvent.click(screen.getByRole('button', {name: 'schedule.batch.submit_all', hidden: true}))

    await waitFor(() => expect(onBatchComplete).toHaveBeenLastCalledWith({kind: 'success'}))
    expect(services.createRegistration).toHaveBeenCalledTimes(3)
    expect(services.createRegistration).toHaveBeenLastCalledWith({
      musicianId: 'musician-2',
      scheduleId: 'performance-1',
      instrument: 'drums',
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('requests an authoritative refresh when every request throws', async () => {
    services.createRegistration.mockReset()
    services.createRegistration.mockRejectedValue(new Error('Connection lost'))
    const onClose = vi.fn()
    const onBatchComplete = vi.fn()
    render(
      <MemoryRouter>
        <HostMusicianRegistrationModal
          schedule={performance}
          isOpen
          onClose={onClose}
          onBatchComplete={onBatchComplete}
        />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByLabelText('schedule.select_musician')).toHaveTextContent('Tina'))
    fireEvent.change(screen.getByLabelText('schedule.select_musician'), {target: {value: 'musician-1'}})
    fireEvent.change(screen.getByLabelText('schedule.select_instrument'), {target: {value: 'drums'}})
    fireEvent.click(screen.getByRole('button', {name: 'schedule.batch.add_to_queue', hidden: true}))

    fireEvent.click(screen.getByRole('button', {name: 'schedule.batch.submit_all', hidden: true}))

    await waitFor(() => expect(onBatchComplete).toHaveBeenCalledWith({
      kind: 'failure',
      failed: 1,
      refreshRequired: true,
    }))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByText(/Tina -/)).toBeInTheDocument()
  })
})
