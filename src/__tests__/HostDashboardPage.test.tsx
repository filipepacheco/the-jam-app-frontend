import {render, screen, waitFor} from '@testing-library/react'
import type {ReactNode} from 'react'
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
    Action: ({children, onClick}: {children: ReactNode; onClick?: () => void}) => (
        <button onClick={onClick}>{children}</button>
    ),
    EmptyState: ({action}: {action?: {label: string; onClick: () => void}}) => (
        action ? <button onClick={action.onClick}>{action.label}</button> : null
    ),
    JamCardSkeleton: () => null,
    PageAlerts: () => null,
    SpotifyImportModal: () => null,
}))

describe('HostDashboardPage', () => {
    it('offers Create Jam in the header and first-use recovery without an overflow duplicate', async () => {
        render(
            <MemoryRouter>
                <HostDashboardPage/>
            </MemoryRouter>,
        )

        await waitFor(() => expect(screen.getAllByRole('button', {
            name: 'jam_management.host_dashboard.create_jam_btn',
        })).toHaveLength(2))
    })
})
