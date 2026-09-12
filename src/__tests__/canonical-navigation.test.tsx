import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  DropdownMenu,
  NavigationAction,
  NavigationLink,
  NavigationTabs,
  OverflowMenu,
} from '../components'

describe('canonical navigation and menu family', () => {
  it('uses the Action family for operations instead of styling destinations as buttons', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()

    render(
      <NavigationAction variant="secondary" onClick={onOpen}>
        Open jam controls
      </NavigationAction>,
    )

    const action = screen.getByRole('button', { name: 'Open jam controls' })
    expect(action).toHaveClass('ds-action', 'ds-action--secondary', 'ds-control')
    await user.keyboard('{Tab}')
    await user.keyboard('{Enter}')
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('keeps route links native while exposing the current destination', () => {
    render(
      <NavigationLink href="/jams/long-name" current>
        A localized jam destination with a deliberately long label
      </NavigationLink>,
    )

    const link = screen.getByRole('link', { name: /localized jam destination/i })
    expect(link).toHaveAttribute('href', '/jams/long-name')
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(link).toHaveClass('ds-navigation__link--current')
  })

  it('uses roving keyboard tabs and reports selection to the route consumer', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <NavigationTabs
        aria-label="Jam sections"
        value="overview"
        onValueChange={onValueChange}
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'schedule', label: 'Schedule' },
          { id: 'permissions', label: 'Permissions', disabled: true },
        ]}
      />,
    )

    const overview = screen.getByRole('tab', { name: 'Overview' })
    overview.focus()
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('tab', { name: 'Schedule' })).toHaveFocus()
    expect(onValueChange).toHaveBeenCalledWith('schedule')
    expect(screen.getByRole('tab', { name: 'Permissions' })).toBeDisabled()
  })

  it('dismisses overflow actions on Escape and restores focus to the named trigger', async () => {
    const user = userEvent.setup()
    const onArchive = vi.fn()

    render(
      <OverflowMenu
        label="More jam actions"
        items={[
          { id: 'archive', label: 'Archive this jam', onSelect: onArchive },
          { id: 'remove', label: 'Remove this jam', destructive: true },
        ]}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'More jam actions' })
    await user.click(trigger)
    expect(screen.getByRole('menu', { name: 'More jam actions' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Archive this jam' })).toHaveFocus())

    await user.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(screen.queryByRole('menu', { name: 'More jam actions' })).not.toBeInTheDocument()
    expect(onArchive).not.toHaveBeenCalled()
  })

  it('supports permission-filtered and router-compatible overflow destinations', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()

    render(
      <OverflowMenu
        label="Jam actions"
        items={[
          { id: 'edit', label: 'Edit jam details', href: '/jams/1/edit', onSelect: onEdit },
          { id: 'admin', label: 'Admin-only action', hidden: true },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Jam actions' }))
    expect(screen.queryByRole('menuitem', { name: 'Admin-only action' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Edit jam details' }))
    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('closes a dropdown with Escape and returns focus to its trigger', async () => {
    const user = userEvent.setup()

    render(
      <DropdownMenu label="Display settings" trigger="Settings">
        <label htmlFor="locale">Language</label>
        <select id="locale" aria-label="Language"><option>Português</option></select>
      </DropdownMenu>,
    )

    const trigger = screen.getByRole('button', { name: 'Display settings' })
    await user.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Display settings' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Language' })).toHaveFocus())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(screen.queryByRole('dialog', { name: 'Display settings' })).not.toBeInTheDocument()
  })
})
