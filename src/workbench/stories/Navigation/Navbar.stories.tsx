import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { DesktopUserMenu } from '../../../components/DesktopUserMenu'
import Navbar from '../../../components/Navbar'
import { AuthContext } from '../../../contexts/AuthContext'
import { createAuthFixture } from '../../fixtures'

const meta = {
  title: 'Navigation/Application navigation',
  component: Navbar,
  parameters: { a11y: { test: 'error' }, layout: 'fullscreen' },
} satisfies Meta<typeof Navbar>

export default meta
type Story = StoryObj<typeof meta>

export const DesktopHost: Story = {
  globals: {
    authRole: 'host',
    route: '/host/dashboard',
    viewport: { value: 'desktop', isRotated: false },
  },
  play: async ({ canvas, userEvent }) => {
    const dashboardLink = canvas.getByRole('link', { name: /painel do host|host dashboard|panel del anfitrión/i })
    await expect(dashboardLink).toHaveClass('text-primary')

    const jamsLink = canvas.getByRole('link', { name: /^jams$/i })
    await userEvent.click(jamsLink)
    await expect(jamsLink).toHaveClass('text-primary')
  },
}

export const DesktopGuestWithSpanishLabels: Story = {
  globals: {
    authRole: 'guest',
    locale: 'es',
    route: '/jams',
    theme: 'jam-light',
    viewport: { value: 'desktop', isRotated: false },
  },
  play: async ({ canvas, userEvent }) => {
    const homeLink = canvas.getByRole('link', { name: /inicio|home/i })
    await userEvent.click(homeLink)
    await expect(homeLink).toHaveClass('text-primary')
  },
}

export const MobileHostKeyboardDismissal: Story = {
  globals: {
    authRole: 'host',
    route: '/host',
    viewport: { value: 'phone', isRotated: false },
  },
  play: async ({ canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    const trigger = page.getByRole('button', { name: /alternar menu|toggle navigation menu/i })

    await userEvent.click(trigger)
    const drawer = page.getByRole('dialog', { name: /menu de navegação|navigation menu/i })
    await expect(drawer).toBeInTheDocument()
    await waitFor(() => expect(page.getByRole('button', { name: /fechar menu|close menu/i })).toHaveFocus())

    const drawerView = within(drawer)
    const navigationRows = [
      drawerView.getByRole('link', { name: /início|home/i }),
      drawerView.getByRole('link', { name: /explorar jams|browse jams/i }),
      drawerView.getByRole('button', { name: /feedback/i }),
    ]
    const iconOffsets = navigationRows.map((row) => row.querySelector('svg')?.getBoundingClientRect().left ?? -1)
    await expect(Math.max(...iconOffsets) - Math.min(...iconOffsets)).toBeLessThan(1)

    const languagePicker = page.getByRole('button', { name: /selecionar idioma|select language/i })
    await userEvent.click(languagePicker)
    const languageList = page.getByRole('listbox')
    await expect(languageList).toBeVisible()
    await expect(page.queryByRole('textbox')).not.toBeInTheDocument()
    await userEvent.click(within(languageList).getByRole('option', { name: /english/i }))
    await expect(drawer).not.toHaveClass('pointer-events-none')

    const themePicker = page.getByRole('button', { name: /selecionar tema|select theme/i })
    await userEvent.click(themePicker)
    const themeList = page.getByRole('listbox')
    await expect(themeList).toBeVisible()
    await expect(page.queryByRole('textbox')).not.toBeInTheDocument()
    await userEvent.click(within(themeList).getByRole('option', { name: /jam dark/i }))
    await expect(drawer).not.toHaveClass('pointer-events-none')

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(drawer).toHaveClass('pointer-events-none')
  },
}

export const DesktopUserSettings: Story = {
  render: () => (
    <div className="flex min-h-64 justify-end p-4">
      <DesktopUserMenu />
    </div>
  ),
  globals: {
    authRole: 'host',
    locale: 'pt',
    theme: 'jam-light',
    viewport: { value: 'desktop', isRotated: false },
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const userMenu = canvas.getByRole('button', { name: /menu do usuário|user menu/i })
    await userEvent.click(userMenu)

    const settingsDialog = canvas.getByRole('dialog', { name: /menu do usuário|user menu/i })
    const languageSelect = canvas.getByRole('combobox', { name: /idioma|language/i })
    const themeSelect = canvas.getByRole('combobox', { name: /tema|theme/i })
    await userEvent.selectOptions(languageSelect, 'en')
    await userEvent.selectOptions(themeSelect, 'jam-dark')
    await waitFor(async () => {
      await expect(canvasElement.ownerDocument.documentElement.dataset.theme).toBe('jam-dark')
      await expect(userMenu).toHaveAttribute('aria-expanded', 'true')
      await expect(settingsDialog).toBeVisible()
    })
  },
}

export const DesktopUserLoading: Story = {
  render: () => (
    <AuthContext.Provider value={createAuthFixture('host', { isLoading: true })}>
      <div className="flex min-h-32 justify-end p-4">
        <DesktopUserMenu />
      </div>
    </AuthContext.Provider>
  ),
  globals: { authRole: 'host' },
  parameters: {
    a11y: { test: 'error' },
    designSystem: {
      interaction: {
        status: 'not-applicable',
        rationale: 'Static loading display with no user-operated behavior.',
      },
    },
  },
}
