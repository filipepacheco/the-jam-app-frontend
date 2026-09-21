import type { CSSProperties } from 'react'
import brandMaster from '../../brand/jam-hybrid-v1/brand-master.svg?raw'
import symbolDark from '../../brand/jam-hybrid-v1/symbol-dark.svg?raw'
import symbolLight from '../../brand/jam-hybrid-v1/symbol-light.svg?raw'

/** The two compositions that are allowed to consume the Jam App hybrid identity. */
export type BrandLogoVariant = 'lockup' | 'symbol'

/** The surrounding surface determines the fixed, approved brand treatment. */
export type BrandLogoSurface = 'light' | 'dark'

/** Named dimensions keep the artwork's intrinsic ratio and reserve layout space. */
export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg'

export interface BrandLogoProps {
  variant?: BrandLogoVariant
  surface: BrandLogoSurface
  size?: BrandLogoSize
  className?: string
}

const LIGHT_VIOLET = '#7138C9'
const DARK_VIOLET = '#AF83ED'
const DARK_PLUM = '#261733'

const DIMENSIONS: Record<BrandLogoVariant, Record<BrandLogoSize, {width: number; height: number}>> = {
  lockup: {
    xs: {width: 96, height: 40},
    sm: {width: 144, height: 60},
    md: {width: 192, height: 80},
    lg: {width: 286, height: 119},
  },
  symbol: {
    xs: {width: 40, height: 42},
    sm: {width: 48, height: 50},
    md: {width: 64, height: 67},
    lg: {width: 96, height: 100},
  },
}

function withDarkLockupTreatment(source: string): string {
  return source
    .replace(`fill="${LIGHT_VIOLET}"`, `fill="${DARK_VIOLET}"`)
    .replace(`fill="${DARK_PLUM}"`, `fill="${DARK_VIOLET}"`)
}

function prepareArtwork(source: string): string {
  return source
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<metadata>[\s\S]*?<\/metadata>/, '')
    .replace('<svg ', '<svg width="100%" height="100%" focusable="false" aria-hidden="true" ')
}

function getArtwork(variant: BrandLogoVariant, surface: BrandLogoSurface): string {
  if (variant === 'lockup') {
    return prepareArtwork(surface === 'dark' ? withDarkLockupTreatment(brandMaster) : brandMaster)
  }

  return prepareArtwork(surface === 'dark' ? symbolDark : symbolLight)
}

/**
 * Jam App hybrid identity: the Together symbol paired with the custom vector wordmark.
 *
 * This component intentionally owns no accessible name: interactive consumers
 * must provide the single product name on their link or button. The dimensions
 * are fixed named sizes so loading or switching treatments cannot shift layout.
 */
export function BrandLogo({
  className = '',
  size = 'md',
  surface,
  variant = 'lockup',
}: BrandLogoProps) {
  const dimensions = DIMENSIONS[variant][size]
  const style: CSSProperties = {
    display: 'inline-block',
    flexShrink: 0,
    height: dimensions.height,
    width: dimensions.width,
  }

  return (
    <span
      aria-hidden="true"
      className={className}
      data-brand-logo
      data-brand-logo-size={size}
      data-brand-logo-surface={surface}
      data-brand-logo-variant={variant}
      style={style}
    >
      <span dangerouslySetInnerHTML={{__html: getArtwork(variant, surface)}} />
    </span>
  )
}
