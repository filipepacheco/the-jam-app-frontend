import {render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'
import {HostDashboardPage} from '../pages/host/HostDashboardPage'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../hooks', () => ({
    useAuth: () => ({isAuthenticated: true, isLoading: false}),
    usePageAlerts: () => ({
        error: null,
        setError: vi.fn(),
        clearError: vi.fn(),
        success: null,
        setSuccess: vi.fn(),
        clearSuccess: vi.fn(),
    }),
}))

vi.mock('../services/jamService.ts', () => ({
    findAll: vi.fn().mockResolvedValue({data: []}),
    deleteFn: vi.fn(),
}))

vi.mock('../components', () => ({
    Alert: () => null,
    JamCardSkeleton: () => null,
    PageAlerts: () => null,
    SpotifyImportModal: () => null,
}))

describe('HostDashboardPage', () => {
    it('offers Create Jam on both desktop and mobile', async () => {
        render(
            <MemoryRouter>
                <HostDashboardPage/>
            </MemoryRouter>,
        )

        const createJamActions = await screen.findAllByRole('button', {
            name: 'jam_management.host_dashboard.create_jam_btn',
        })

        expect(createJamActions).toHaveLength(2)
    })
})
