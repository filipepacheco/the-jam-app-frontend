import type { Meta, StoryObj } from '@storybook/react-vite'
import CallToAction from '../../components/CallToAction'
import { EnhancedHero } from '../../components/EnhancedHero'
import Footer from '../../components/Footer'
import { HeroDashboardMockup } from '../../components/hero/HeroDashboardMockup'
import { HowItWorks } from '../../components/HowItWorks'
import { Testimonials } from '../../components/Testimonials'

const meta = { title: 'Marketing/Current sections', parameters: { a11y: { test: 'todo' }, layout: 'fullscreen' } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const GuestHero: Story = {
  render: () => <><EnhancedHero /><HeroDashboardMockup /></>,
  globals: { authRole: 'guest', locale: 'pt', theme: 'light', viewport: { value: 'phone', isRotated: false } },
}

export const HostHeroLongLocalization: Story = {
  render: () => <EnhancedHero />,
  globals: { authRole: 'host', locale: 'es', theme: 'synthwave', viewport: { value: 'desktop', isRotated: false }, reducedMotion: true },
}

export const ProcessAndTestimonials: Story = {
  render: () => <><HowItWorks /><Testimonials /></>,
  globals: { locale: 'en', theme: 'cupcake' },
}

export const ConversionAndFooter: Story = {
  render: () => <><CallToAction /><Footer /></>,
  globals: { locale: 'es', theme: 'dark', reducedMotion: true },
}
