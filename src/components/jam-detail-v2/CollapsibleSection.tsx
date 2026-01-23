import {type ReactNode, useState} from 'react'

interface CollapsibleSectionProps {
  title: string
  isExpanded?: boolean
  onToggle?: () => void
  badge?: string
  children: ReactNode
}

export function CollapsibleSection({
  title,
  isExpanded = false,
  onToggle,
  badge,
  children,
}: CollapsibleSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(isExpanded)

  // Use parent's state if onToggle is provided, otherwise use internal state
  const expanded = onToggle ? isExpanded : internalExpanded

  const handleToggle = () => {
    if (onToggle) {
      onToggle()
    } else {
      setInternalExpanded(!internalExpanded)
    }
  }

  // Generate unique ID for aria-controls
  const contentId = `collapsible-${title.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className="card bg-linear-to-br from-base-200 to-base-300">
      <button
        onClick={handleToggle}
        className="card-body p-4 flex flex-row items-center justify-between cursor-pointer hover:bg-base-300/30 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          {badge && <span className="badge badge-sm">{badge}</span>}
        </div>
        <span className={`transform transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`} aria-hidden="true">
          ▼
        </span>
      </button>

      <div
        id={contentId}
        className={`overflow-hidden transition-all duration-300 ease-in-out motion-reduce:transition-none ${
          expanded ? 'max-h-[800px] opacity-100 pt-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  )
}
