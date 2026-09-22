import {render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'
import type {JamResponseDto} from '../types/api.types'
import {OverviewTab} from '../pages/tabs/OverviewTab'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../hooks', () => ({
    useAppLanguage: () => ({currentLang: 'en', changeLanguage: vi.fn()}),
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
    it('uses a clear primary Jam lifecycle action', () => {
        render(
            <MemoryRouter>
                <OverviewTab jam={jam} onStatusChange={vi.fn()} onJamUpdate={vi.fn()} loading={false}/>
            </MemoryRouter>,
        )

        expect(screen.getByRole('button', {name: 'jam_management.overview.actions.start'}))
            .toHaveAttribute('data-action-variant', 'primary')
    })

    it('keeps Jam editing in the overview instead of linking to another page', () => {
        render(
            <MemoryRouter>
                <OverviewTab jam={jam} onStatusChange={vi.fn()} onJamUpdate={vi.fn()} loading={false}/>
            </MemoryRouter>,
        )

        expect(screen.getByRole('textbox', {name: 'create_jam.form.jam_name'})).toHaveValue('Test jam')
        expect(screen.getByRole('button', {name: 'create_jam.actions.update'})).toBeDisabled()
        expect(screen.getByRole('button', {name: 'spotify.import_button'}).closest('.dropdown')).toBeNull()
        expect(screen.queryByRole('button', {name: 'spotify.export_button'})).not.toBeInTheDocument()
    })
})
