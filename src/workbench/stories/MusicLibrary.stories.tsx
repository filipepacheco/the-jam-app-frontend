import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { MusicCard } from '../../components/MusicCard'
import { MusicEmptyState } from '../../components/MusicEmptyState'
import { MusicFilters } from '../../components/MusicFilters'
import {MusiciansBadges} from '../../components/music/MusiciansBadges'
import { musicFixtures } from '../jamMusicFixtures'

const meta = {
  title: 'Domain/Music/Library',
  component: MusicCard,
  parameters: { a11y: { test: 'todo' } },
  args: { music: musicFixtures.approved, isHost: true, onDelete: fn() },
} satisfies Meta<typeof MusicCard>

export default meta
type Story = StoryObj<typeof meta>

const removeMusic = fn()
const toggleMusic = fn()

export const ApprovedForHost: Story = {
  args: {
    music: musicFixtures.approved,
    isHost: true,
    onDelete: removeMusic,
    onToggleExpand: toggleMusic,
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /editar|edit|editar/i }))
    await expect(toggleMusic).toHaveBeenCalledWith(musicFixtures.approved.id)
    await userEvent.click(canvas.getByRole('button', { name: /excluir|delete|eliminar/i }))
    await expect(removeMusic).toHaveBeenCalledWith(musicFixtures.approved)
  },
}

const approveMusic = fn()
const rejectMusic = fn()

export const SuggestedForHost: Story = {
  args: {
    music: musicFixtures.suggested,
    isHost: true,
    onDelete: fn(),
    onApprove: approveMusic,
    onReject: rejectMusic,
  },
  globals: { locale: 'es', theme: 'jam-light' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /aprobar/i }))
    await expect(approveMusic).toHaveBeenCalledWith(musicFixtures.suggested)
  },
}

export const LongContentForViewer: Story = {
  args: { music: musicFixtures.longContent, isHost: false, onDelete: fn() },
  globals: {
    authRole: 'viewer',
    locale: 'en',
    theme: 'jam-dark',
    viewport: { value: 'phone', isRotated: false },
  },
}

export const SpotifyPlaylistLink: Story = {
  args: {
    music: {
      ...musicFixtures.approved,
      id: 'music-spotify-playlist-link',
      link: 'https://open.spotify.com/playlist/workbench-fixture',
    },
    isHost: false,
    onDelete: fn(),
  },
}

const changeSearch = fn()
const changeGenre = fn()
const changeSort = fn()
const clearFilters = fn()

export const FilterInteraction: Story = {
  render: () => (
    <MusicFilters
      searchTerm="Psycho"
      onSearchChange={changeSearch}
      genreFilter="New Wave"
      onGenreChange={changeGenre}
      sortBy="title"
      onSortChange={changeSort}
      onClearFilters={clearFilters}
      genres={['Rock', 'New Wave', 'MPB', 'Soul']}
    />
  ),
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox'), ' Killer')
    await expect(changeSearch).toHaveBeenCalled()
    await userEvent.selectOptions(canvas.getByLabelText(/gênero|genre|género/i), 'Rock')
    await expect(changeGenre).toHaveBeenCalledWith('Rock')
    await userEvent.click(canvas.getByRole('button', { name: /limpar|clear|borrar/i }))
    await expect(clearFilters).toHaveBeenCalledOnce()
  },
}

export const FilteredPhoneLayout: Story = {
  render: () => (
    <MusicFilters
      searchTerm="Psycho Killer"
      onSearchChange={() => undefined}
      genreFilter="New Wave"
      onGenreChange={() => undefined}
      sortBy="title"
      onSortChange={() => undefined}
      onClearFilters={() => undefined}
      genres={['Rock', 'New Wave', 'MPB', 'Soul']}
    />
  ),
  globals: { locale: 'pt', theme: 'jam-dark', viewport: { value: 'phone', isRotated: false } },
}

export const EmptyFilteredResults: Story = {
  render: () => <MusicEmptyState hasFilters isHost={false} />,
  globals: { authRole: 'guest', locale: 'en' },
}

export const EmptyLibraryForHost: Story = {
  render: () => <MusicEmptyState hasFilters={false} isHost />,
  globals: { authRole: 'host', locale: 'pt' },
}

export const InstrumentRequirements: Story = {
  render: () => (
    <div className="overflow-x-auto">
      <table className="table"><tbody><tr><td><MusiciansBadges music={musicFixtures.longContent} /></td></tr></tbody></table>
    </div>
  ),
}

export const NoInstrumentRequirements: Story = {
  render: () => (
    <MusiciansBadges
      music={{ ...musicFixtures.approved, neededDrums: 0, neededGuitars: 0, neededVocals: 0, neededBass: 0 }}
    />
  ),
}
