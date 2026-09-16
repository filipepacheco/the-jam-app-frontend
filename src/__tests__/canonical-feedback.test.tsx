import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  Alert,
  EmptyState,
  ErrorState,
  LoadingState,
  Skeleton,
  Status,
  SuccessState,
} from '../components'

describe('canonical feedback and state patterns', () => {
  it('uses polite status semantics for transient success and assertive alerts for failures', () => {
    render(
      <>
        <Alert type="success" title="Jam saved" message="The setlist is ready." />
        <Alert type="error" title="Save failed" message="Try again." />
      </>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Jam saved')
    expect(screen.getByRole('alert')).toHaveTextContent('Save failed')
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive')
  })

  it('announces persistent statuses with a text equivalent and recovery action', async () => {
    const user = userEvent.setup()
    const retry = vi.fn()

    render(
      <Status
        tone="warning"
        title="Connection paused"
        description="Your changes are safe. Reconnect to continue."
        action={{ label: 'Try again', onClick: retry }}
      />,
    )

    expect(screen.getByRole('status')).toHaveAccessibleName('Connection paused')
    expect(screen.getByRole('status')).toHaveTextContent('Your changes are safe')
    expect(screen.getByRole('status')).toHaveAttribute('data-feedback-presentation', 'inline')
    expect(screen.getByRole('status').querySelector('.ds-feedback__marker')).toHaveAttribute('aria-hidden', 'true')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it('distinguishes loading from content with a polite progress announcement', () => {
    render(<LoadingState label="Loading jam sessions" />)

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Loading jam sessions')
    expect(screen.getByTestId('feedback-spinner')).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders a recoverable request error as an assertive alert', async () => {
    const user = userEvent.setup()
    const retry = vi.fn()

    render(
      <ErrorState
        title="Could not load jams"
        description="Your saved filters are still here. Try again to refresh the list."
        action={{ label: 'Try again', onClick: retry }}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Your saved filters are still here')
    expect(screen.getByRole('alert')).toHaveAttribute('data-feedback-presentation', 'inline')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it('announces completion and keeps success copy near the changed result', () => {
    render(<SuccessState title="Jam saved" description="Everyone can now see the updated setlist." />)

    expect(screen.getByRole('status')).toHaveTextContent('Jam saved')
    expect(screen.getByRole('status')).toHaveTextContent('updated setlist')
  })

  it('supports first-use guidance and filtered empty results with an Action-family recovery button', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()

    render(
      <EmptyState
        icon="🎸"
        title="No jams found"
        description="Try fewer filters or create the first jam in your area."
        kind="first-use"
        action={{ label: 'Create a jam', onClick: onAction }}
      />,
    )

    expect(screen.getByRole('region', { name: 'No jams found' })).toHaveAttribute('data-empty-kind', 'first-use')
    await user.click(screen.getByRole('button', { name: 'Create a jam' }))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('gives skeleton content an accessible loading label without exposing decorative shapes', () => {
    render(<Skeleton label="Loading jam card" lines={2} />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading jam card')
    expect(screen.getAllByTestId('feedback-skeleton-line')).toHaveLength(2)
    expect(screen.getAllByTestId('feedback-skeleton-line')[0]).toHaveAttribute('aria-hidden', 'true')
  })
})
