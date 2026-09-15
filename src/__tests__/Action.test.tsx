import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Action, ActionGroup, IconAction } from '../components/Action'
import { ScheduleActionButtons } from '../components/schedule/ScheduleActionButtons'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('canonical action controls', () => {
  it('uses semantic variants and preserves native keyboard activation', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <Action variant="primary" onClick={onSave}>
        <Action.Icon>✓</Action.Icon>
        <Action.Label>Save setlist</Action.Label>
      </Action>,
    )

    const action = screen.getByRole('button', { name: 'Save setlist' })
    expect(action).toHaveClass('ds-action', 'ds-action--primary', 'ds-control', 'ds-focusable')

    action.focus()
    await user.keyboard('{Enter}')
    expect(onSave).toHaveBeenCalledOnce()
    onSave.mockClear()
    await user.keyboard(' ')
    expect(onSave).toHaveBeenCalledOnce()
  })

  it('represents loading and disabled behavior through one action state', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <>
        <Action variant="secondary" state="loading" loadingLabel="Saving setlist" onClick={onSave}>
          <Action.Label>Save setlist</Action.Label>
        </Action>
        <Action variant="quiet" state="disabled">
          <Action.Label>Unavailable action</Action.Label>
        </Action>
      </>,
    )

    const loadingAction = screen.getByRole('button', { name: 'Saving setlist' })
    expect(loadingAction).toBeDisabled()
    expect(loadingAction).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Saving setlist')
    await user.click(loadingAction)
    expect(onSave).not.toHaveBeenCalled()

    const disabledAction = screen.getByRole('button', { name: 'Unavailable action' })
    expect(disabledAction).toBeDisabled()
    expect(disabledAction).toHaveClass('ds-action--quiet', 'ds-action--disabled')
  })

  it('requires a label for icon-only actions and retains destructive meaning', () => {
    render(
      <IconAction variant="destructive" label="Remove song">
        🗑
      </IconAction>,
    )

    const action = screen.getByRole('button', { name: 'Remove song' })
    expect(action).toHaveClass('ds-action--destructive', 'ds-action--icon-only')
    expect(action).toHaveAccessibleName('Remove song')
  })

  it('styles every action role through semantic foundation tokens', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/Action.css'), 'utf8')

    expect(css).toContain('var(--ds-action-primary)')
    expect(css).toContain('var(--ds-action-secondary)')
    expect(css).toContain('var(--ds-action-danger)')
    expect(css).toContain('var(--ds-surface-raised)')
  })

  it('keeps primary, supporting, overflow, and danger choices in a stable action hierarchy', () => {
    render(
      <ActionGroup
        primary={<Action>Save jam</Action>}
        secondary={<Action variant="quiet">Cancel</Action>}
        overflow={<IconAction variant="quiet" label="More jam actions">•••</IconAction>}
        danger={<Action variant="destructive">Remove jam</Action>}
      />,
    )

    const slots = screen.getByRole('button', {name: 'Save jam'}).closest('.ds-action-group')
      ?.querySelectorAll('[data-action-group-slot]')
    expect(Array.from(slots ?? []).map((slot) => slot.getAttribute('data-action-group-slot')))
      .toEqual(['primary', 'supporting', 'danger'])
    expect(screen.getByRole('button', {name: 'Remove jam'}).closest('[data-action-group-slot]'))
      .toHaveAttribute('data-action-group-slot', 'danger')
  })

  it('keeps loading present while reserving reduced opacity for unavailable actions', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/Action.css'), 'utf8')

    expect(css).toMatch(/\.ds-action--loading\s*\{\s*cursor: wait;/)
    expect(css).toMatch(/\.ds-action--disabled\s*\{\s*cursor: not-allowed;\s*opacity: 0\.58;/)
  })

  it('integrates the family into schedule approval and destructive actions', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const onStatusChange = vi.fn()

    const { rerender } = render(
      <ScheduleActionButtons
        status="SUGGESTED"
        isSuggested
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />,
    )

    const actions = screen.getAllByRole('button')
    expect(actions[0]).toHaveAttribute('data-action-variant', 'primary')
    expect(actions[1]).toHaveAttribute('data-action-variant', 'destructive')
    expect(actions[0]).toHaveAttribute('type', 'submit')

    await user.click(actions[0])
    await user.click(actions[1])
    expect(onStatusChange).toHaveBeenCalledWith('SCHEDULED')
    expect(onDelete).toHaveBeenCalledOnce()

    rerender(<ScheduleActionButtons status="SCHEDULED" onDelete={onDelete} />)
    await user.click(screen.getByRole('button'))
    expect(onDelete).toHaveBeenCalledTimes(2)

    rerender(<ScheduleActionButtons status="SUGGESTED" isSuggested loading />)
    for (const action of screen.getAllByRole('button')) {
      expect(action).toBeDisabled()
      expect(action).toHaveAttribute('aria-busy', 'true')
    }
  })
})
