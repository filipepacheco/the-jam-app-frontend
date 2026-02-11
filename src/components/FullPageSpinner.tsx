interface FullPageSpinnerProps {
  className?: string
  label?: string
}

export function FullPageSpinner({ className = 'bg-base-100', label }: FullPageSpinnerProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <span className="loading loading-spinner loading-lg"></span>
        {label && (
          <span className="text-sm font-semibold text-base-content/70">{label}</span>
        )}
      </div>
    </div>
  )
}
