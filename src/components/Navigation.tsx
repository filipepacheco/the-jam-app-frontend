import { useEffect, useId, useRef, useState, type AnchorHTMLAttributes, type HTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type ReactNode, type RefAttributes } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Action, IconAction, type ActionProps } from './Action'
import './Navigation.css'

export interface NavigationTabItem {
  id: string
  label: string
  icon?: ReactNode
  disabled?: boolean
  panelId?: string
}

export interface NavigationTabsProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  items: NavigationTabItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  'aria-label': string
}

/**
 * A compact, keyboard-operable tablist for switching related content in one
 * route. Use NavigationLink for destinations that should change the URL.
 */
export function NavigationTabs({
  'aria-label': ariaLabel,
  className = '',
  defaultValue,
  items,
  onValueChange,
  value,
  ...props
}: NavigationTabsProps) {
  const firstEnabled = items.find((item) => !item.disabled)?.id ?? ''
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? firstEnabled)
  const selectedValue = value ?? uncontrolledValue
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const select = (nextValue: string) => {
    if (value === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
  }

  const moveFocus = (index: number, direction: -1 | 1) => {
    const enabled = items.filter((item) => !item.disabled)
    if (!enabled.length) return
    const current = enabled.findIndex((item) => item.id === items[index]?.id)
    const nextIndex = (current + direction + enabled.length) % enabled.length
    const next = enabled[nextIndex]
    if (!next) return
    tabRefs.current[next.id]?.focus()
    select(next.id)
  }

  return (
    <nav {...props} className={`ds-tabs ${className}`} aria-label={ariaLabel}>
      <div role="tablist" className="ds-tabs__list" aria-label={ariaLabel}>
        {items.map((item) => {
          const selected = selectedValue === item.id
          return (
            <button
              key={item.id}
              ref={(element) => { tabRefs.current[item.id] = element }}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls={item.panelId}
              aria-disabled={item.disabled || undefined}
              disabled={item.disabled}
              tabIndex={selected ? 0 : -1}
              className={`ds-tab ${selected ? 'ds-tab--selected' : ''}`}
              onClick={() => select(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                  event.preventDefault()
                  moveFocus(items.indexOf(item), 1)
                } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                  event.preventDefault()
                  moveFocus(items.indexOf(item), -1)
                } else if (event.key === 'Home' || event.key === 'End') {
                  event.preventDefault()
                  const enabled = items.filter((candidate) => !candidate.disabled)
                  const next = event.key === 'Home' ? enabled[0] : enabled[enabled.length - 1]
                  if (next) {
                    tabRefs.current[next.id]?.focus()
                    select(next.id)
                  }
                }
              }}
            >
              {item.icon && <span className="ds-navigation__icon" aria-hidden="true">{item.icon}</span>}
              <span className="ds-navigation__label">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export const Tabs = NavigationTabs

export interface NavigationLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'aria-current'> {
  current?: boolean
  icon?: ReactNode
  variant?: NavigationLinkVariant
}

/**
 * Destination emphasis stays separate from Action's operation semantics while
 * sharing the same semantic palette. Quiet is the default for ordinary
 * navigation; primary and secondary are for destinations that intentionally
 * carry call-to-action emphasis (for example, a marketing hero).
 */
export type NavigationLinkVariant = 'quiet' | 'primary' | 'secondary'

/** A route-preserving navigation link with a visible current-page state. */
export function NavigationLink({
  children,
  className = '',
  current = false,
  icon,
  variant = 'quiet',
  ...props
}: NavigationLinkProps) {
  return (
    <a
      {...props}
      aria-current={current ? 'page' : undefined}
      className={`ds-navigation__link ${current ? 'ds-navigation__link--current' : ''} ${variant !== 'quiet' ? `ds-navigation__link--${variant}` : ''} ${className}`}
      data-navigation-variant={variant}
    >
      {icon && <span className="ds-navigation__icon" aria-hidden="true">{icon}</span>}
      <span className="ds-navigation__label">{children}</span>
    </a>
  )
}

export const NavLink = NavigationLink

export type NavigationActionProps = ActionProps & RefAttributes<HTMLButtonElement>

/** Action-family entry point for navigation controls that perform work. */
export function NavigationAction(props: NavigationActionProps) {
  return <Action {...props} />
}

export interface NavigationMenuItem {
  id: string
  label: string
  href?: string
  icon?: ReactNode
  destructive?: boolean
  disabled?: boolean
  hidden?: boolean
  onSelect?: () => void
}

export interface OverflowMenuProps {
  items: NavigationMenuItem[]
  label: string
  className?: string
}

/**
 * Secondary actions behind an explicitly named, keyboard-operable overflow
 * trigger. The menu closes on Escape, outside click, and item activation.
 */
export function OverflowMenu({ className = '', items, label }: OverflowMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<Record<string, HTMLButtonElement | HTMLAnchorElement | null>>({})
  const menuId = useId()
  const visibleItems = items.filter((item) => !item.hidden)

  const close = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus())
  }

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    const firstEnabled = visibleItems.find((item) => !item.disabled)
    if (firstEnabled) requestAnimationFrame(() => itemRefs.current[firstEnabled.id]?.focus())
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, visibleItems])

  const activate = (item: NavigationMenuItem, event?: MouseEvent) => {
    if (item.disabled) {
      event?.preventDefault()
      return
    }
    item.onSelect?.()
    close()
  }

  const moveMenuFocus = (currentId: string, direction: -1 | 1) => {
    const enabled = visibleItems.filter((item) => !item.disabled)
    const index = enabled.findIndex((item) => item.id === currentId)
    const next = enabled[(index + direction + enabled.length) % enabled.length]
    if (next) itemRefs.current[next.id]?.focus()
  }

  return (
    <div ref={rootRef} className={`ds-menu ${className}`}>
      <IconAction
        ref={triggerRef}
        variant="quiet"
        label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal aria-hidden="true" />
      </IconAction>
      {open && (
        <div id={menuId} role="menu" aria-label={label} className="ds-menu__content">
          {visibleItems.map((item) => {
            const common = {
              ref: (element: HTMLButtonElement | HTMLAnchorElement | null) => { itemRefs.current[item.id] = element },
              role: 'menuitem' as const,
              tabIndex: -1,
              'aria-disabled': item.disabled || undefined,
              className: `ds-menu__item ${item.destructive ? 'ds-menu__item--destructive' : ''}`,
              onClick: (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => activate(item, event),
              onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement | HTMLAnchorElement>) => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault()
                  moveMenuFocus(item.id, event.key === 'ArrowDown' ? 1 : -1)
                } else if (event.key === 'Home' || event.key === 'End') {
                  event.preventDefault()
                  const enabled = visibleItems.filter((candidate) => !candidate.disabled)
                  const next = event.key === 'Home' ? enabled[0] : enabled[enabled.length - 1]
                  if (next) itemRefs.current[next.id]?.focus()
                }
              },
            }
            return item.href
              ? <a key={item.id} {...common} href={item.href}>{item.icon && <span className="ds-navigation__icon" aria-hidden="true">{item.icon}</span>}{item.label}</a>
              : <button key={item.id} {...common} type="button" disabled={item.disabled}>{item.icon && <span className="ds-navigation__icon" aria-hidden="true">{item.icon}</span>}{item.label}</button>
          })}
        </div>
      )}
    </div>
  )
}

export interface DropdownMenuProps {
  label: string
  children: ReactNode
  className?: string
  trigger?: ReactNode
}

/** A small popover for settings or other secondary content. */
export function DropdownMenu({ children, className = '', label, trigger }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const dismiss = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        requestAnimationFrame(() => triggerRef.current?.focus())
      }
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    requestAnimationFrame(() => {
      contentRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus()
    })
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`ds-dropdown ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="ds-dropdown__trigger ds-control ds-focusable"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
      >
        {trigger ?? label}
      </button>
      {open && <div ref={contentRef} id={menuId} role="dialog" aria-label={label} className="ds-dropdown__content">{children}</div>}
    </div>
  )
}

export interface ResponsiveNavigationProps {
  desktop: ReactNode
  mobile: ReactNode
  className?: string
}

/** CSS-first responsive composition; both variants remain in logical DOM order. */
export function ResponsiveNavigation({ className = '', desktop, mobile }: ResponsiveNavigationProps) {
  return (
    <div className={`ds-responsive-navigation ${className}`}>
      <div className="ds-responsive-navigation__desktop">{desktop}</div>
      <div className="ds-responsive-navigation__mobile">{mobile}</div>
    </div>
  )
}
