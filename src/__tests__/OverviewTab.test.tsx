import {render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'
import type {JamResponseDto} from '../types/api.types'
import {OverviewTab} from '../pages/tabs/OverviewTab'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../lib/spotify/pkce', () => ({
    initiateSpotifyAuth: vi.fn(),
}))

vi.mock('../components', () => ({
    SpotifyImportModal: () => null,
}))

const jam: JamResponseDto = {
    id: 'jam-1',
    name: 'Test jam',
    hostName: 'Host',
    status: 'ACTIVE',
    createdAt: '2026-09-24T18:00:00.000Z',
    updatedAt: '2026-09-24T18:00:00.000Z',
}

describe('OverviewTab', () => {
    it('presents Spotify actions like the other secondary actions', () => {
        render(
            <MemoryRouter>
                <OverviewTab jam={jam} onStatusChange={vi.fn()} loading={false}/>
            </MemoryRouter>,
        )

        const editAction = screen.getByRole('button', {name: 'jam_management.overview.edit_jam'})
        const exportAction = screen.getByRole('button', {name: 'spotify.export_button'})
        const importAction = screen.getByRole('button', {name: 'spotify.import_button'})

        expect(exportAction.className).toBe(editAction.className)
        expect(importAction.className).toBe(editAction.className)
        expect(exportAction.closest('.dropdown')).toBeNull()
        expect(importAction.closest('.dropdown')).toBeNull()
    })
})
