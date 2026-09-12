/**
 * Profile Form Section Component
 * Reusable component for displaying profile sections in view/edit mode
 */
import React from "react";
import { Field } from './Field'

interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea'
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  disabled: boolean
  readOnly: boolean
  options?: string[]
  maxLength?: number
  fullWidth?: boolean
}

interface ProfileFormSectionProps {
  title: string
  icon: string
  isEditMode: boolean
  fields: FormField[]
}

export function ProfileFormSection({
  title,
  icon,
  isEditMode,
  fields,
}: ProfileFormSectionProps) {
  return (
    <div className="card bg-base-200 shadow-lg transition-all duration-300">
      <div className="card-body">
        {/* Section Title */}
        <h2 className="card-title text-lg flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          {title}
        </h2>

        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => {
            const fieldId = `profile-field-${field.name}`

            if (!isEditMode) {
              /* View Mode - Display Text. This is a static, non-editable
                 display, not a form control, so it stays outside Field
                 (Field always wraps one native input/select/textarea). The
                 visible label above it is kept as plain markup to match. */
              return (
                <div key={field.name} className={`form-control ${field.fullWidth ? 'md:col-span-2' : ''}`}>
                  <label className="label">
                    <span className="label-text font-semibold">{field.label}</span>
                  </label>
                  <div className="bg-base-100 rounded-lg px-4 py-3 border border-base-300">
                    <p className={`text-base-content ${field.type === 'textarea' ? 'whitespace-pre-line' : ''}`}>
                      {field.value || (
                        <span className="text-base-content/50 italic">
                          Not provided
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )
            }

            return (
              <div key={field.name} className={field.fullWidth ? 'md:col-span-2' : undefined}>
                <Field id={fieldId} label={field.label} disabled={field.disabled}>
                  {field.type === 'select' && field.options ? (
                    <Field.Select name={field.name} value={field.value} onChange={field.onChange}>
                      <option value="">Select {field.label}</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Field.Select>
                  ) : field.type === 'textarea' ? (
                    <Field.Textarea
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      rows={3}
                      maxLength={field.maxLength}
                    />
                  ) : (
                    <Field.Input
                      type={field.type}
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      maxLength={field.maxLength}
                    />
                  )}
                </Field>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

