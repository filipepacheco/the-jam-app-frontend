import type { HTMLAttributes, ReactNode } from 'react'
import './DataDisplay.css'

export type DataDisplayTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'
export type BadgeSize = 'sm' | 'md' | 'lg'
export type DataDisplayDensity = 'compact' | 'comfortable'
export type StatusTone = DataDisplayTone | 'live' | 'offline' | 'pending' | 'completed'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  tone?: DataDisplayTone
  size?: BadgeSize
  truncate?: boolean
}

export function Badge({ children, className = '', size = 'md', tone = 'neutral', truncate = false, ...props }: BadgeProps) {
  const classes = [
    'ds-badge',
    `ds-badge--${tone}`,
    `ds-badge--${size}`,
    truncate && 'ds-truncate-single',
    className,
  ].filter(Boolean).join(' ')

  return (
    <span {...props} className={classes} data-display-component="badge" data-display-presentation="filled" data-display-tone={tone}>
      {tone !== 'neutral' && <span className="ds-badge__marker" aria-hidden="true" />}
      <span className="ds-badge__label">{children}</span>
    </span>
  )
}

export interface StatusIndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  label: ReactNode
  status?: StatusTone
}

export function StatusIndicator({ className = '', label, status = 'neutral', ...props }: StatusIndicatorProps) {
  const classes = ['ds-status-indicator', `ds-status-indicator--${status}`, className].filter(Boolean).join(' ')
  const accessibleLabel = typeof label === 'string' || typeof label === 'number' ? String(label) : undefined
  return (
    <span {...props} aria-label={accessibleLabel} className={classes} data-display-component="status-indicator" data-display-status={status} role="status">
      <span className="ds-status-indicator__dot" aria-hidden="true" />
      <span className="ds-wrap-user-content">{label}</span>
    </span>
  )
}

type DataCardElement = 'article' | 'div' | 'section'

export interface DataCardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  density?: DataDisplayDensity
  selected?: boolean
  as?: DataCardElement
}

export function DataCard({
  as: Element = 'article',
  children,
  className = '',
  density = 'comfortable',
  selected = false,
  ...props
}: DataCardProps) {
  const classes = [
    'ds-data-card',
    `ds-data-card--${density}`,
    selected && 'ds-data-card--selected',
    className,
  ].filter(Boolean).join(' ')

  return (
    <Element
      {...props}
      className={classes}
      data-display-component="card"
      data-display-density={density}
      data-selected={selected || undefined}
    >
      {children}
    </Element>
  )
}

export interface ListRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode
  leading?: ReactNode
  metadata?: ReactNode
  trailing?: ReactNode
  density?: DataDisplayDensity
  selected?: boolean
}

export function ListRow({
  children,
  className = '',
  density = 'comfortable',
  leading,
  metadata,
  selected = false,
  trailing,
  ...props
}: ListRowProps) {
  const classes = [
    'ds-list-row',
    `ds-list-row--${density}`,
    selected && 'ds-list-row--selected',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div
      {...props}
      className={classes}
      data-display-component="list-row"
      data-display-density={density}
      data-selected={selected || undefined}
    >
      <span className="ds-list-row__leading">{leading}</span>
      <span className="ds-list-row__content">
        <span className="ds-list-row__primary ds-wrap-user-content">{children}</span>
        {metadata && <span className="ds-list-row__metadata ds-wrap-user-content">{metadata}</span>}
      </span>
      <span className="ds-list-row__trailing">{trailing}</span>
    </div>
  )
}

export interface CompactMetadataItem {
  label: ReactNode
  value: ReactNode
}

export interface CompactMetadataProps extends HTMLAttributes<HTMLDListElement> {
  items: ReadonlyArray<CompactMetadataItem>
}

export function CompactMetadata({ className = '', items, ...props }: CompactMetadataProps) {
  const classes = ['ds-compact-metadata', className].filter(Boolean).join(' ')
  return (
    <dl {...props} className={classes} data-display-component="compact-metadata">
      {items.map((item, index) => (
        <div className="ds-compact-metadata__item" key={index}>
          <dt className="ds-compact-metadata__label">{item.label}</dt>
          <dd className="ds-compact-metadata__value ds-wrap-user-content">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
