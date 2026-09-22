import {render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'
import {JamCard} from '../components/JamCard'
import {jamFixtures} from '../workbench/jamMusicFixtures'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {language: 'en'},
    t: (key: string, fallback?: string | {count: number}) => ({
      'jams.date_tba': 'Date TBA',
      'jams.live_dashboard': 'Live dashboard',
      'jams.listen_on_spotify': 'Listen on Spotify',
      'jams.view_details': 'View jam',
      'jams.songs_count': '4 songs',
      'jams.musicians_count': `${typeof fallback === 'object' ? fallback.count : 0} musicians registered`,
    }[key] ?? (typeof fallback === 'string' ? fallback : key)),
  }),
}))

describe('JamCard', () => {
  it('makes the Jam name the card navigation action and includes its start time', () => {
    const jam = jamFixtures.active
    const expectedDateTime = new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(jam.date))

    render(<MemoryRouter><JamCard jam={jam} /></MemoryRouter>)

    expect(screen.getByRole('link', {name: jam.name})).toHaveAttribute('href', '/jams/friday-night-jam')
    expect(screen.getByText(expectedDateTime)).toBeVisible()
    expect(screen.getByText(jam.location)).toHaveAttribute('title', jam.location)
    expect(screen.getByText(jam.location)).toHaveClass('truncate')
    expect(screen.getByText('4 songs')).toBeVisible()
    expect(screen.getByText('2 musicians registered')).toBeVisible()
    expect(screen.getByRole('link', {name: 'View jam'})).toHaveAttribute('href', '/jams/friday-night-jam')
    expect(screen.getByRole('link', {name: 'View jam'})).toHaveAttribute('data-navigation-variant', 'primary')
    expect(screen.getByRole('link', {name: 'Live dashboard'})).toHaveAttribute('href', '/jams/friday-night-jam/dashboard')
    expect(screen.getByRole('link', {name: 'Live dashboard'})).toHaveClass('ds-navigation__link')
    expect(screen.getByRole('link', {name: 'Listen on Spotify'})).not.toHaveClass('ds-control')
  })

  it('shows the existing date fallback when a Jam has no start date', () => {
    render(<MemoryRouter><JamCard jam={{...jamFixtures.active, date: undefined}} /></MemoryRouter>)

    expect(screen.getByText('Date TBA')).toBeVisible()
  })

  it('shows distinct registered musicians rather than the registration row count', () => {
    render(
      <MemoryRouter>
        <JamCard jam={{...jamFixtures.active, registeredMusicianCount: 2, _count: {...jamFixtures.active._count, registrations: 5}}} />
      </MemoryRouter>,
    )

    expect(screen.getByText('2 musicians registered')).toBeVisible()
    expect(screen.queryByText('5 musicians registered')).not.toBeInTheDocument()
  })
})
