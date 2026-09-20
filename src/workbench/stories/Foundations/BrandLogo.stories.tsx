import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { BrandLogo, type BrandLogoSize, type BrandLogoSurface, type BrandLogoVariant } from '../../../components/BrandLogo'

const variants: readonly BrandLogoVariant[] = ['lockup', 'symbol']
const surfaces: readonly BrandLogoSurface[] = ['light', 'dark']
const sizes: readonly BrandLogoSize[] = ['sm', 'md', 'lg']

const meta = {
  title: 'Foundations/Brand logo candidate',
  component: BrandLogo,
  parameters: {
    a11y: { test: 'error' },
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BrandLogo>

export default meta
type Story = StoryObj<typeof meta>

export const ReferenceMatrix: Story = {
  render: () => (
    <div className="grid gap-6 p-6 md:grid-cols-2">
      {surfaces.map((surface) => (
        <section
          key={surface}
          data-brand-surface={surface}
          className="grid gap-5 rounded-box p-6"
          style={{
            backgroundColor: surface === 'dark' ? '#261733' : '#ffffff',
            color: surface === 'dark' ? '#ffffff' : '#261733',
          }}
        >
          <h2 className="text-lg font-semibold">{surface} surface</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {variants.map((variant) => (
              <div key={variant} className="grid justify-items-start gap-2">
                <span className="text-sm opacity-75">{variant}</span>
                <BrandLogo variant={variant} surface={surface} size="md" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const artwork = canvasElementQuery(canvasElement)
    await expect(artwork).toHaveLength(4)
    for (const logo of artwork) {
      await expect(logo).toHaveAttribute('aria-hidden', 'true')
      const svg = logo.querySelector('svg')
      if (!svg) throw new Error('BrandLogo artwork must contain an SVG.')
      await expect(svg).toHaveAttribute('focusable', 'false')
      await expect(svg).toHaveAttribute('aria-hidden', 'true')
      const fills = new Set(
        [...svg.querySelectorAll<SVGElement>('[fill]')]
          .map((element) => element.getAttribute('fill'))
          .filter((fill): fill is string => fill !== null),
      )
      const surface = logo.closest('[data-brand-surface]')?.getAttribute('data-brand-surface')
      await expect(fills).toContain(surface === 'dark' ? '#AF83ED' : '#7138C9')
      if (surface === 'dark') {
        await expect(fills).not.toContain('#261733')
      }
      await expect(logo.querySelector('script')).not.toBeInTheDocument()
      await expect(logo.querySelector('image')).not.toBeInTheDocument()
      await expect(logo.querySelector('foreignObject')).not.toBeInTheDocument()
    }
  },
}

export const ReservedSizes: Story = {
  render: () => (
    <div className="grid gap-6 bg-base-100 p-6 text-base-content">
      {sizes.map((size) => (
        <div key={size} className="grid grid-cols-[6rem_1fr] items-center gap-4">
          <span className="text-sm font-semibold">{size}</span>
          <BrandLogo variant="lockup" surface="light" size={size} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const logos = canvasElementQuery(canvasElement)
    await expect(logos).toHaveLength(3)
    await expect(logos[0]).toHaveAttribute('data-brand-logo-size', 'sm')
    await expect(logos[1]).toHaveAttribute('data-brand-logo-size', 'md')
    await expect(logos[2]).toHaveAttribute('data-brand-logo-size', 'lg')
  },
}

function canvasElementQuery(canvas: HTMLElement): HTMLElement[] {
  return [...canvas.querySelectorAll<HTMLElement>('[data-brand-logo]')]
}
