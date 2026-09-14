import type { Meta, StoryObj } from '@storybook/react-vite'
import { HelmetProvider } from 'react-helmet-async'
import { expect } from 'storybook/test'
import { AboutPage } from '../../pages/AboutPage'
import { NotFoundPage } from '../../pages/NotFoundPage'

const meta = { title: 'Pages/Stable compositions', parameters: { a11y: { test: 'error' }, layout: 'fullscreen' } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

const page = (content: React.ReactNode) => <HelmetProvider>{content}</HelmetProvider>

export const About: Story = {
  render: () => page(<AboutPage />),
  globals: { route: '/about', locale: 'pt', theme: 'light', viewport: { value: 'desktop', isRotated: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1 })).toBeVisible()
  },
}

export const AboutMobileSpanish: Story = {
  render: () => page(<AboutPage />),
  globals: { route: '/about', locale: 'es', theme: 'night', viewport: { value: 'phone', isRotated: false }, reducedMotion: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1 })).toBeVisible()
  },
}

export const NotFound: Story = {
  render: () => page(<NotFoundPage />),
  globals: { route: '/missing-route', locale: 'en', theme: 'cupcake', viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1 })).toBeVisible()
  },
}
