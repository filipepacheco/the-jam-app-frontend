import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { DropdownMenu, NavigationTabs, OverflowMenu, ResponsiveNavigation } from '../../../components/Navigation'

const meta = {
  title: 'Navigation/Canonical navigation and menus',
  component: NavigationTabs,
  parameters: { a11y: { test: 'todo' }, layout: 'padded' },
} satisfies Meta<typeof NavigationTabs>

export default meta
type Story = StoryObj<typeof meta>

export const LongLocalizedTabs: Story = {
  args: {
    'aria-label': 'Seções de gerenciamento da jam',
    items: [
      { id: 'overview', label: 'Visão geral da apresentação' },
      { id: 'schedule', label: 'Programação e inscrições dos músicos' },
      { id: 'permissions', label: 'Permissões da equipe', disabled: true },
    ],
    defaultValue: 'overview',
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: /programação/i }))
    await expect(canvas.getByRole('tab', { name: /programação/i })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('tab', { name: /permissões/i })).toBeDisabled()
  },
}

export const PermissionFilteredOverflow: Story = {
  args: { 'aria-label': 'Navigation tabs', items: [] },
  render: () => (
    <div className="flex justify-end">
      <OverflowMenu
        label="Ações secundárias da jam"
        items={[
          { id: 'edit', label: 'Editar detalhes da jam', href: '/jams/1/edit' },
          { id: 'moderate', label: 'Moderar inscrições', hidden: true },
          { id: 'delete', label: 'Excluir jam', destructive: true },
        ]}
      />
    </div>
  ),
}

export const ResponsiveDenseActions: Story = {
  args: { 'aria-label': 'Navigation tabs', items: [] },
  render: () => (
    <ResponsiveNavigation
      desktop={<div className="flex items-center gap-2"><span>Desktop navigation</span><OverflowMenu label="More actions" items={[{ id: 'one', label: 'Secondary action' }]} /><DropdownMenu label="Display settings" trigger="Settings"><p>Theme and language</p></DropdownMenu></div>}
      mobile={<div className="flex min-h-11 items-center justify-between"><span>Mobile navigation</span><button className="ds-control ds-focusable">Menu</button></div>}
    />
  ),
}
