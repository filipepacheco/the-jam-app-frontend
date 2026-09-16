import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {BrowseJamsPage} from '../pages/BrowseJamsPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      const labels: Record<string, string> = {
        'jams.browse.title': 'Browse Jams',
        'jams.browse.subtitle': 'Discover live jams',
        'jams.browse.search_label': 'Search jams',
        'jams.browse.search_placeholder': 'Search',
        'jams.browse.sort_label': 'Sort',
        'jams.browse.sort.newest': 'Newest',
        'jams.browse.sort.oldest': 'Oldest',
        'jams.browse.sort.upcoming': 'Upcoming',
        'jams.browse.filter_label': 'Filter by status',
        'jams.browse.tabs.all': 'All',
        'jams.browse.tabs.live': 'Live',
        'jams.browse.tabs.active': 'Active',
        'jams.browse.tabs.inactive': 'Inactive',
        'jams.browse.tabs.finished': 'Finished',
        'jams.browse.loading': 'Loading jams',
        'jams.browse.results.other': 'items',
        'jams.browse.clear_filters': 'Clear filters',
        'jams.browse.empty_title': 'No jams yet',
        'jams.browse.empty_no_jams': 'No results yet',
        'jams.browse.section_current': 'Current jams',
        'jams.browse.section_past': 'Past jams',
        'jams.browse.section_no_current': 'No current jams',
        'jams.browse.section_no_past': 'No past jams',
        'jams.browse.empty_try_filters': 'Try removing filters',
        'jams.browse.error_title': 'Error loading jams',
        'jams.browse.error_description': 'Unable to load data',
        'jams.browse.retry': 'Try Again',
      }
      if (typeof fallback === 'object' && fallback !== null && 'count' in fallback) {
        return `${key} ${String((fallback as {count?: unknown}).count)}`
      }
      return labels[key] ?? (typeof fallback === 'string' ? fallback : key)
    },
  }),
}))

vi.mock('../components', () => {
  const Field: any = ({children}: {children: any}) => <div>{children}</div>
  Field.Input = ({children, ...props}: Record<string, any>) => <input {...props}>{children}</input>
  Field.Select = ({children, ...props}: Record<string, any>) => <select {...props}>{children}</select>

  return {
    Action: ({children, onClick}: {children: any; onClick?: () => void}) => (
      <button onClick={onClick}>{children}</button>
    ),
    Badge: ({children}: {children: any}) => <span>{children}</span>,
    EmptyState: ({title, description}: {title: string; description?: string}) => (
      <section>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </section>
    ),
    ErrorState: ({title, description, action}: {title: string; description?: string; action?: {label: string; onClick: () => void}}) => (
      <div role="alert">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        {action && <button onClick={action.onClick}>{action.label}</button>}
      </div>
    ),
    Field,
    LoadingState: ({label}: {label: string}) => <div>{label}</div>,
    NavigationTabs: () => <div />,
    JamCard: ({jam}: {jam: {name: string}}) => <article>{jam.name}</article>,
    JamCardSkeleton: () => <div data-testid="jam-skeleton" />,
  }
})

vi.mock('../components/SEO', () => ({
  SEO: () => null,
}))

describe('BrowseJamsPage', () => {
  it('renders canonical global empty state for empty loaded data without section empty copy', () => {
    render(<BrowseJamsPage viewState={{status: 'loaded', data: []}} />)

    expect(screen.getByText('No jams yet')).toBeInTheDocument()
    expect(screen.getByText('No results yet')).toBeInTheDocument()
    expect(screen.queryByText('No current jams')).toBeNull()
    expect(screen.queryByText('No past jams')).toBeNull()
  })

  it('renders error view with stale jam data plus retry action', async () => {
    const onRetry = vi.fn()

    render(
      <BrowseJamsPage
        viewState={{
          status: 'error',
          message: 'Failed to refresh live data',
          data: [
            {
              id: 'jam-1',
              name: 'Friday Jam',
              hostName: 'DJ Alice',
              status: 'ACTIVE',
              createdAt: '2026-09-13T00:00:00.000Z',
              updatedAt: '2026-09-13T00:00:00.000Z',
            },
          ],
        }}
        onRetry={onRetry}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Error loading jams')
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load data')
    expect(screen.getByText('Friday Jam')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', {name: 'Try Again'}))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
