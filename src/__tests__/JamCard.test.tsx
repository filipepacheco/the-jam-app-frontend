import {render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe, expect, it, vi} from 'vitest'
import {JamCard} from '../components/JamCard'
import {jamFixtures} from '../workbench/jamMusicFixtures'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {language: 'en'},
    t: (key: string, fallback?: string) => ({
      'jams.date_tba': 'Date TBA',
      'jams.live_dashboard': 'Live dashboard',
      'jams.listen_on_spotify': 'Listen on Spotify',
      'jams.songs_count': '4 songs',
    }[key] ?? fallback ?? key),
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
    expect(screen.queryByRole('link', {name: 'common.details'})).toBeNull()
  })

  it('shows the existing date fallback when a Jam has no start date', () => {
    render(<MemoryRouter><JamCard jam={{...jamFixtures.active, date: undefined}} /></MemoryRouter>)

    expect(screen.getByText('Date TBA')).toBeVisible()
  })
})
