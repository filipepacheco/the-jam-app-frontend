import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'
import {CreateJamPage} from '../pages/host/CreateJamPage'
import {MusiciansPage} from '../pages/host/MusiciansPage'
import type {MusiciansPagePort} from '../pages/host/MusiciansPage'
import type {ReactNode} from 'react'

vi.mock('react-i18next', () => {
  const t = (key: string) => {
      const labels: Record<string, string> = {
        'create_jam.title_create': 'Create Jam',
        'create_jam.form.jam_name': 'Jam Name',
        'create_jam.form.placeholder_name': 'Jam Name',
        'create_jam.form.location': 'Location',
        'create_jam.form.placeholder_location': 'Location',
        'create_jam.form.slug': 'Slug',
        'create_jam.form.placeholder_slug': 'jam-slug',
        'create_jam.form.slug_hint': 'url slug',
        'create_jam.form.date': 'Date',
        'create_jam.form.time': 'Time',
        'create_jam.form.description': 'Description',
        'create_jam.form.placeholder_description': 'description',
        'create_jam.form.spotify_playlist_url': 'Spotify Playlist URL',
        'create_jam.form.placeholder_spotify_playlist_url': 'https://open.spotify.com',
        'create_jam.spotify_import_inline': 'Import from Spotify',
        'create_jam.spotify_import_btn': 'Import',
        'create_jam.actions.cancel': 'Cancel',
        'create_jam.actions.create': 'Create',
        'create_jam.actions.saving': 'Saving',
        'create_jam.info.create_hint': 'Create hint',
        'common.try_again': 'Try Again',
        'common.error': 'Error',
        'jam_management.musicians.title': 'Musicians',
        'jam_management.musicians.subtitle': 'Musician management',
        'jam_management.musicians.loading': 'Loading musicians',
        'jam_management.musicians.no_musicians_title': 'No musicians',
        'jam_management.musicians.no_musicians': 'No musicians available',
        'jam_management.musicians.no_match_title': 'No match',
        'jam_management.musicians.no_match': 'No match found',
        'jam_management.musicians.search_label': 'Search',
        'jam_management.musicians.search_placeholder': 'Search',
        'jam_management.musicians.filter_label': 'Filter',
        'jam_management.musicians.results_count': 'Results',
        'jam_management.musicians.options.all_levels': 'All',
        'jam_management.musicians.actions.edit': 'Edit',
        'jam_management.musicians.table.name': 'Name',
        'jam_management.musicians.table.instrument': 'Instrument',
        'jam_management.musicians.table.level': 'Level',
        'jam_management.musicians.table.contact': 'Contact',
        'jam_management.musicians.table.phone': 'Phone',
        'jam_management.musicians.table.joined': 'Joined',
        'jam_management.musicians.table.actions': 'Actions',
        'music_library.pagination.page_size': 'Page size',
        'music_library.pagination.previous': 'Previous',
        'music_library.pagination.next': 'Next',
        'music_library.pagination.first': 'First',
        'music_library.pagination.last': 'Last',
        'music_library.pagination.page_number': 'Page number',
        'schedule.levels.not_specified': 'Not specified',
        'schedule.levels.BEGINNER': 'Beginner',
        'schedule.levels.INTERMEDIATE': 'Intermediate',
        'schedule.levels.ADVANCED': 'Advanced',
        'schedule.levels.PROFESSIONAL': 'Professional',
      }

      return labels[key] ?? key
    }

  return {useTranslation: () => ({t, i18n: {hasResourceBundle: () => true, language: 'en'}})}
})

vi.mock('../hooks', () => {
  const alerts = {
    error: null,
    setError: vi.fn(),
    clearError: vi.fn(),
    success: null,
    setSuccess: vi.fn(),
    clearSuccess: vi.fn(),
  }
  return {
    useAuth: () => ({
    user: {id: 'host-1', isHost: true},
    isAuthenticated: true,
    isLoading: false,
    }),
    usePageAlerts: () => alerts,
  }
})

vi.mock('../components', () => ({
  Action: ({children, onClick}: {children: ReactNode; onClick?: () => void}) => (
    <button onClick={onClick}>{children}</button>
  ),
  Alert: ({message, title, action}: {message: string; title?: string; action?: ReactNode}) => (
    <div role="alert">
      {title && <h2>{title}</h2>}
      <p>{message}</p>
      {action}
    </div>
  ),
  ConfirmDialog: () => null,
  PageAlerts: () => null,
  SpotifyImportModal: () => null,
  EmptyState: () => <div>Empty</div>,
  LoadingState: ({label}: {label: string}) => <div>{label}</div>,
}))

function rejectedMusiciansPort(errorMessage: string): MusiciansPagePort {
  const list = vi.fn().mockRejectedValue(new Error(errorMessage))

  return {
    list,
    update: vi.fn(),
  }
}

describe('Track 8 page-level seams', () => {
  it('create mode blocks submit with required jam name and focuses the name field', async () => {
    render(
      <MemoryRouter>
        <CreateJamPage />
      </MemoryRouter>,
    )

    const jamNameInput = screen.getByRole('textbox', {name: /Jam Name/})

    await userEvent.setup().click(screen.getByRole('button', {name: 'Create'}))

    await waitFor(() => {
      expect(jamNameInput).toHaveAttribute('aria-invalid', 'true')
      expect(document.activeElement).toBe(jamNameInput)
    })
  })

  it('shows exact MusiciansPage list error and retries via port on Try Again', async () => {
    const port = rejectedMusiciansPort('Unable to fetch musicians')
    render(<MusiciansPage port={port} />)

    expect(await screen.findByText('Unable to fetch musicians')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Try Again'})).toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', {name: 'Try Again'}))
    await waitFor(() => expect(port.list).toHaveBeenCalledTimes(2))
  })
})
