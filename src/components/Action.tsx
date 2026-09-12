import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import './Action.css'

export type ActionVariant = 'primary' | 'secondary' | 'quiet' | 'destructive'
export type ActionState = 'idle' | 'loading' | 'disabled'

type ActionStateProps =
  | { state?: 'idle' | 'disabled'; loadingLabel?: never }
  | { state: 'loading'; loadingLabel: string }

type ActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled'> & {
  children: ReactNode
  variant?: ActionVariant
}

export type ActionProps = ActionButtonProps & ActionStateProps

export type IconActionProps = Omit<ActionButtonProps, 'children' | 'aria-label'> & ActionStateProps & {
  children: ReactNode
  label: string
}

function actionIcon({ className = '', ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} aria-hidden="true" className={`ds-action__icon ${className}`} />
}

function actionLabel({ className = '', ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={`ds-action__label ${className}`} />
}

type ActionComponent = ((props: ActionProps) => ReactNode) & {
  Icon: typeof actionIcon
  Label: typeof actionLabel
}

export const Action: ActionComponent = function Action({
  children,
  className = '',
  loadingLabel,
  state = 'idle',
  type = 'button',
  variant = 'primary',
  ...props
}: ActionProps) {
  const isLoading = state === 'loading'
  const isDisabled = state !== 'idle'
  const classes = [
    'ds-action',
    'ds-control',
    'ds-focusable',
    `ds-action--${variant}`,
    `ds-action--${state}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      {...props}
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      data-action-state={state}
      data-action-variant={variant}
    >
      {isLoading ? (
        <>
          <span className="loading loading-spinner loading-sm" aria-hidden="true" />
          <span role="status" aria-live="polite">{loadingLabel}</span>
        </>
      ) : children}
    </button>
  )
}

Action.Icon = actionIcon
Action.Label = actionLabel

export function IconAction({ children, className = '', label, ...props }: IconActionProps) {
  return (
    <Action {...props} aria-label={label} className={`ds-action--icon-only ${className}`}>
      <Action.Icon>{children}</Action.Icon>
    </Action>
  )
}
