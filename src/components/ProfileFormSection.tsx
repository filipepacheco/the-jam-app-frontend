/**
 * Profile Form Section Component
 * Reusable component for displaying profile sections in view/edit mode
 */
import React from "react";

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
          {fields.map((field) => (
            <div key={field.name} className={`form-control ${field.fullWidth ? 'md:col-span-2' : ''}`}>
              <label className="label">
                <span className="label-text font-semibold">{field.label}</span>
              </label>

              {isEditMode && field.type === 'select' && field.options ? (
                /* Edit Mode - Select Field */
                <select
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={field.disabled}
                  className="select select-bordered"
                >
                  <option value="">Select {field.label}</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : isEditMode && field.type === 'textarea' ? (
                /* Edit Mode - Textarea */
                <textarea
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={field.disabled}
                  className="textarea textarea-bordered"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  rows={3}
                  maxLength={field.maxLength}
                />
              ) : isEditMode ? (
                /* Edit Mode - Text Input */
                <input
                  type={field.type === 'textarea' ? 'text' : field.type}
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={field.disabled}
                  className="input input-bordered"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  maxLength={field.maxLength}
                />
              ) : (
                /* View Mode - Display Text */
                <div className="bg-base-100 rounded-lg px-4 py-3 border border-base-300">
                  <p className={`text-base-content ${field.type === 'textarea' ? 'whitespace-pre-line' : ''}`}>
                    {field.value || (
                      <span className="text-base-content/50 italic">
                        Not provided
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

