// This stays hand-rolled instead of the canonical LoadingState
// (FeedbackStates.tsx). LoadingState requires a label and always renders it
// in a live region; FullPageSpinner's `label` is optional and App.tsx
// renders it with no label at all during the earliest app boot, before any
// text is safe to announce. LoadingState's inline feedback-row layout also
// does not match this component's full-viewport centered layout.
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
