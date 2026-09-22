import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import CallToAction from '../../components/CallToAction'
import { EnhancedHero } from '../../components/EnhancedHero'
import Footer from '../../components/Footer'
import { HeroDashboardMockup } from '../../components/hero/HeroDashboardMockup'
import { HowItWorks } from '../../components/HowItWorks'
import { Testimonials } from '../../components/Testimonials'

const meta = { title: 'Marketing/Current sections', parameters: { a11y: { test: 'error' }, layout: 'fullscreen' } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const GuestHero: Story = {
  render: () => <><EnhancedHero /><HeroDashboardMockup /></>,
  globals: { authRole: 'guest', locale: 'pt', theme: 'jam-light', viewport: { value: 'phone', isRotated: false }, reducedMotion: true },
  play: async ({ canvas }) => {
    const heroHeading = canvas.getByRole('heading', { level: 1 })
    const dashboardHeading = canvas.getAllByRole('heading', { name: /Don't Stop Believin/i })[0]
    await waitFor(() => {
      expect(heroHeading).toHaveStyle({ opacity: 1 })
      expect(dashboardHeading.closest('[style]')).toHaveStyle({ opacity: 1 })
    })
  },
}

export const HostHeroLongLocalization: Story = {
  render: () => <EnhancedHero />,
  globals: { authRole: 'host', locale: 'es', theme: 'jam-dark', viewport: { value: 'desktop', isRotated: false }, reducedMotion: true },
  play: async ({ canvas }) => {
    const heroHeading = canvas.getByRole('heading', { level: 1 })
    await waitFor(() => expect(heroHeading).toHaveStyle({ opacity: 1 }))
  },
}

export const ProcessAndTestimonials: Story = {
  render: () => <><HowItWorks /><Testimonials /></>,
  globals: { locale: 'en', theme: 'jam-light' },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading')[0]).toHaveAccessibleName(/.+/)
  },
}

export const ConversionAndFooter: Story = {
  render: () => <><CallToAction /><Footer /></>,
  globals: { locale: 'es', theme: 'jam-dark', reducedMotion: true },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading')[0]).toHaveAccessibleName(/.+/)
  },
}

export const ConversionAndFooterMobile: Story = {
  render: () => <><CallToAction /><Footer /></>,
  globals: {
    locale: 'pt',
    theme: 'jam-light',
    reducedMotion: true,
    viewport: { value: 'phone', isRotated: false },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('navigation', { name: /rodapé|footer/i })).toBeVisible()
    await expect(canvas.getByRole('link', { name: /política de privacidade/i })).toBeVisible()
  },
}
