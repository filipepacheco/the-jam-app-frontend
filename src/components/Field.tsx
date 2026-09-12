import { cloneElement, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import './Field.css'

type FieldControlProps = {
  'aria-describedby'?: string
  'aria-errormessage'?: string
  'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling'
  disabled?: boolean
  id?: string
  required?: boolean
}

type FieldControl = ReactElement<FieldControlProps>

interface FieldBaseProps {
  children: FieldControl
  className?: string
  disabled?: boolean
  error?: ReactNode
  hint?: ReactNode
  id: string
  label: ReactNode
}

export type FieldProps = FieldBaseProps & (
  | { required?: false; requiredLabel?: never }
  | { required: true; requiredLabel: string }
)

type FieldNativeProps<T> = Omit<T, 'disabled' | 'id' | 'required'>

export type FieldInputProps = FieldNativeProps<InputHTMLAttributes<HTMLInputElement>>
export type FieldSelectProps = FieldNativeProps<SelectHTMLAttributes<HTMLSelectElement>>
export type FieldTextareaProps = FieldNativeProps<TextareaHTMLAttributes<HTMLTextAreaElement>>

export type FormSubmissionState = 'idle' | 'submitting' | 'success' | 'error'

type FormSubmissionFeedbackProps =
  | { state?: 'idle'; message?: never; className?: string }
  | { state: Exclude<FormSubmissionState, 'idle'>; message: ReactNode; className?: string }

function mergeDescribedBy(...ids: Array<string | undefined>): string | undefined {
  const merged = [...new Set(ids.flatMap((id) => id?.split(' ').filter(Boolean) ?? []))]
  return merged.length > 0 ? merged.join(' ') : undefined
}

function fieldInput({ className = '', ...props }: FieldInputProps) {
  return <input {...props} className={`ds-field__control ds-field__input ds-control ds-focusable ${className}`} />
}

function fieldSelect({ className = '', ...props }: FieldSelectProps) {
  return <select {...props} className={`ds-field__control ds-field__select ds-control ds-focusable ${className}`} />
}

function fieldTextarea({ className = '', ...props }: FieldTextareaProps) {
  return <textarea {...props} className={`ds-field__control ds-field__textarea ds-control ds-focusable ${className}`} />
}

type FieldComponent = ((props: FieldProps) => ReactNode) & {
  Input: typeof fieldInput
  Select: typeof fieldSelect
  Textarea: typeof fieldTextarea
}

export const Field: FieldComponent = function Field({
  children,
  className = '',
  disabled = false,
  error,
  hint,
  id,
  label,
  required = false,
  requiredLabel,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const control = cloneElement(children, {
    id,
    disabled: disabled || children.props.disabled,
    required: required || children.props.required,
    'aria-describedby': mergeDescribedBy(children.props['aria-describedby'], hintId, errorId),
    'aria-invalid': error ? true : children.props['aria-invalid'],
    'aria-errormessage': errorId,
  })

  return (
    <div className={`ds-field ${error ? 'ds-field--invalid' : ''} ${disabled ? 'ds-field--disabled' : ''} ${className}`}>
      <label className="ds-field__label ds-type-ui" htmlFor={id}>
        <span className="ds-field__label-text">{label}</span>
        {required && (
          <span className="ds-field__requirement">
            <span aria-hidden="true"> *</span>
            <span className="sr-only"> {requiredLabel}</span>
          </span>
        )}
      </label>
      {control}
      {hint && <div className="ds-field__hint ds-type-body" id={hintId}>{hint}</div>}
      {error && <div className="ds-field__error ds-type-body" id={errorId}>{error}</div>}
    </div>
  )
}

Field.Input = fieldInput
Field.Select = fieldSelect
Field.Textarea = fieldTextarea

export function FormSubmissionFeedback({ className = '', message, state = 'idle' }: FormSubmissionFeedbackProps) {
  if (state === 'idle') return null

  const isError = state === 'error'
  const isSubmitting = state === 'submitting'
  const role = isError ? 'alert' : 'status'

  return (
    <div
      role={role}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-busy={isSubmitting || undefined}
      className={`ds-form-feedback ds-form-feedback--${state} ${className}`}
    >
      {message}
    </div>
  )
}
