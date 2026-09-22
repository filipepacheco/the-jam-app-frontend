import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {CreateJamPage} from '../pages/host/CreateJamPage'
import {MusiciansPage} from '../pages/host/MusiciansPage'
import type {MusiciansPagePort} from '../pages/host/MusiciansPage'
import type {ReactNode} from 'react'
import * as jamService from '../services/jamService.ts'
import {spotifyService} from '../services/spotifyService.ts'

vi.mock('../services/jamService.ts', () => ({
  create: vi.fn(),
  update: vi.fn(),
  findOne: vi.fn(),
  deleteFn: vi.fn(),
}))

vi.mock('../services/spotifyService.ts', () => ({
  spotifyService: {importPlaylist: vi.fn()},
}))

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
        'create_jam.form.host_name': 'Host Name',
        'create_jam.form.host_contact': 'Host Contact',
        'create_jam.form.auto_approve_registrations': 'Automatically approve registrations',
        'create_jam.form.auto_approve_registrations_hint': 'New registrations are approved automatically.',
        'create_jam.form.placeholder_contact': 'Email or phone',
        'create_jam.form.description': 'Description',
        'create_jam.form.placeholder_description': 'description',
        'create_jam.form.spotify_playlist_url': 'Spotify Playlist URL',
        'create_jam.form.placeholder_spotify_playlist_url': 'https://open.spotify.com',
        'create_jam.spotify_import_inline': 'Import from Spotify',
        'create_jam.spotify_import_btn': 'Import',
        'create_jam.actions.cancel': 'Cancel',
        'create_jam.actions.create': 'Create',
        'create_jam.actions.saving': 'Saving',
        'create_jam.actions.retry_spotify_import': 'Retry Spotify import',
        'create_jam.actions.retrying_spotify_import': 'Retrying import',
        'create_jam.actions.continue_without_import': 'Continue without importing',
        'create_jam.validation.date_required': 'Date is required',
        'create_jam.validation.time_required': 'Time is required',
        'create_jam.messages.spotify_import_pending': 'Jam created; Spotify import needs attention. Your jam is safe. Retry the song import.',
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
    user: {id: 'host-1', name: 'Ana Host', email: 'ana@example.test', isHost: true},
    isAuthenticated: true,
    isLoading: false,
    }),
    useAppLanguage: () => ({currentLang: 'en', changeLanguage: vi.fn()}),
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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

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

  it('requires date and time and exposes prefilled host details in create mode', async () => {
    render(
      <MemoryRouter>
        <CreateJamPage />
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', {name: /Jam Name/}), 'Friday Night Jam')
    await user.type(screen.getByRole('textbox', {name: /Location/}), 'Benjamin Social Club')
    await user.click(screen.getByRole('button', {name: 'Create'}))

    const dateInput = screen.getByLabelText(/Date/)
    expect(dateInput).toHaveAttribute('aria-invalid', 'true')
    expect(document.activeElement).toBe(dateInput)
    expect(screen.getByLabelText(/Time/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('textbox', {name: /Host Name/})).toHaveValue('Ana Host')
    expect(screen.getByRole('textbox', {name: /Host Contact/})).toHaveValue('ana@example.test')
  })

  it('creates the jam first and then imports its Spotify playlist into the new jam', async () => {
    vi.mocked(jamService.create).mockResolvedValue({
      data: {id: 'jam-new', name: 'Friday Night Jam'},
      status: 201,
    } as Awaited<ReturnType<typeof jamService.create>>)
    vi.mocked(spotifyService.importPlaylist).mockResolvedValue({
      success: true,
      data: {
        jam: {id: 'jam-new', name: 'Friday Night Jam'},
        importedTracks: 4,
        reusedTracks: 0,
        skippedTracks: 0,
        addedTracks: 4,
        duplicateTracks: 0,
        isExistingJam: true,
      },
    })

    render(
      <MemoryRouter>
        <CreateJamPage />
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', {name: /Jam Name/}), 'Friday Night Jam')
    await user.type(screen.getByRole('textbox', {name: /Location/}), 'Benjamin Social Club')
    await user.type(screen.getByLabelText(/Date/), '2026-09-18')
    await user.type(screen.getByLabelText(/Time/), '17:00')
    await user.type(screen.getByRole('textbox', {name: /Spotify Playlist URL/}), 'https://open.spotify.com/playlist/abc')
    await user.click(screen.getByRole('button', {name: 'Create'}))

    await waitFor(() => expect(jamService.create).toHaveBeenCalledTimes(1))
    expect(spotifyService.importPlaylist).toHaveBeenCalledWith({
      playlistUrl: 'https://open.spotify.com/playlist/abc',
      jamId: 'jam-new',
    })
  })

  it('sends the selected automatic-approval setting when it creates a jam', async () => {
    vi.mocked(jamService.create).mockResolvedValue({
      data: {id: 'jam-new', name: 'Friday Night Jam'},
      status: 201,
    } as Awaited<ReturnType<typeof jamService.create>>)

    render(
      <MemoryRouter>
        <CreateJamPage />
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', {name: /Jam Name/}), 'Friday Night Jam')
    await user.type(screen.getByRole('textbox', {name: /Location/}), 'Benjamin Social Club')
    await user.type(screen.getByLabelText(/Date/), '2026-09-18')
    await user.type(screen.getByLabelText(/Time/), '17:00')
    expect(screen.getByRole('checkbox', {name: /Automatically approve registrations/})).toBeChecked()
    await user.click(screen.getByRole('button', {name: 'Create'}))

    await waitFor(() => expect(jamService.create).toHaveBeenCalledWith(expect.objectContaining({
      autoApproveRegistrations: true,
    })))
  })

  it('keeps a created jam safe and retries only the failed Spotify import', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(jamService.create).mockResolvedValue({
      data: {id: 'jam-new', name: 'Friday Night Jam'},
      status: 201,
    } as Awaited<ReturnType<typeof jamService.create>>)
    vi.mocked(spotifyService.importPlaylist)
      .mockRejectedValueOnce(new Error('Spotify unavailable'))
      .mockResolvedValueOnce({
        success: true,
        data: {
          jam: {id: 'jam-new', name: 'Friday Night Jam'},
          importedTracks: 4,
          reusedTracks: 0,
          skippedTracks: 0,
          addedTracks: 4,
          duplicateTracks: 0,
          isExistingJam: true,
        },
      })

    render(
      <MemoryRouter>
        <CreateJamPage />
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', {name: /Jam Name/}), 'Friday Night Jam')
    await user.type(screen.getByRole('textbox', {name: /Location/}), 'Benjamin Social Club')
    await user.type(screen.getByLabelText(/Date/), '2026-09-18')
    await user.type(screen.getByLabelText(/Time/), '17:00')
    await user.type(screen.getByRole('textbox', {name: /Spotify Playlist URL/}), 'https://open.spotify.com/playlist/abc')
    await user.click(screen.getByRole('button', {name: 'Create'}))

    expect(await screen.findByText(/Jam created; Spotify import needs attention/)).toBeVisible()
    await user.click(screen.getByRole('button', {name: 'Retry Spotify import'}))

    await waitFor(() => expect(spotifyService.importPlaylist).toHaveBeenCalledTimes(2))
    expect(jamService.create).toHaveBeenCalledTimes(1)
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
