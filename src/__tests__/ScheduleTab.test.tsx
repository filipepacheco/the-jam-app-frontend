import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'
import type {JamResponseDto} from '../types/api.types'
import {ScheduleTab} from '../pages/tabs/ScheduleTab'
import {musicService} from '../services'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../services', () => ({
    musicService: {
        findAll: vi.fn().mockResolvedValue({
            data: [{
                id: 'music-1',
                title: 'Psycho Killer',
                artist: 'Talking Heads',
                createdAt: '2026-09-24T18:00:00.000Z',
            }, {
                id: 'music-2',
                title: 'Creep',
                artist: 'Radiohead',
                createdAt: '2026-09-24T18:00:00.000Z',
            }],
            meta: {total: 2, skip: 0, take: 100, hasMore: false},
        }),
        linkToJam: vi.fn(),
        updateJamMusic: vi.fn(),
    },
    scheduleService: {create: vi.fn(), update: vi.fn(), remove: vi.fn()},
    registrationService: {update: vi.fn(), remove: vi.fn()},
}))

const jam: JamResponseDto = {
    id: 'jam-1',
    name: 'Test jam',
    hostName: 'Host',
    status: 'ACTIVE',
    createdAt: '2026-09-24T18:00:00.000Z',
    updatedAt: '2026-09-24T18:00:00.000Z',
    schedules: [],
    jamMusics: [],
}

describe('ScheduleTab', () => {
    it('loads searchable music options when the add-entry modal opens', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter>
                <ScheduleTab jam={jam} onReload={vi.fn()}/>
            </MemoryRouter>,
        )

        await user.click(screen.getByRole('button', {name: 'jam_management.schedule.add_new_song'}))

        await waitFor(() => expect(musicService.findAll).toHaveBeenCalledWith(0, 100, 'APPROVED'))
        await user.click(await screen.findByLabelText('jam_management.schedule.song_label'))

        const searchInput = screen.getByPlaceholderText('common.search')
        await user.type(searchInput, 'psycho')

        expect(screen.getByText('Psycho Killer')).toBeInTheDocument()
        expect(screen.queryByText('Creep')).not.toBeInTheDocument()
    })
})
