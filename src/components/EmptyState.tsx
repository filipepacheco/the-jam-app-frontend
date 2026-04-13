/**
 * Empty State Component
 * Generic reusable empty state with icon, title, description, and optional action
 */
import React from "react";

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-8 ${className}`}>
      {icon && (
        <div className="text-4xl mb-3" aria-hidden="true">{icon}</div>
      )}
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      {description && (
        <p className="text-base-content/70 text-sm">{description}</p>
      )}
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  )
}
