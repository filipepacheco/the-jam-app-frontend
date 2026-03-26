interface StatusDotProps {
  status: string
}

const COLOR_MAP: Record<string, string> = {
  SCHEDULED: 'bg-primary',
  IN_PROGRESS: 'bg-warning animate-pulse',
  COMPLETED: 'bg-success',
  CANCELED: 'bg-base-content/20',
  SUGGESTED: 'bg-info',
}

export function StatusDot({ status }: StatusDotProps) {
  return (
    <span
      className={`w-2 h-2 rounded-full shrink-0 ${COLOR_MAP[status] || 'bg-base-content/30'}`}
      title={status}
    />
  )
}
