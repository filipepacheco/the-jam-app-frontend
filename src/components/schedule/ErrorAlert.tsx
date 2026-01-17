/**
 * Error Alert Component
 * Displays error messages in modals
 * Reusable across modals
 */

interface ErrorAlertProps {
  error: string | null
}

export function ErrorAlert({ error }: ErrorAlertProps) {
  if (!error) return null

  return (
    <div className="alert alert-error mb-4">
      <p>{error}</p>
    </div>
  )
}
