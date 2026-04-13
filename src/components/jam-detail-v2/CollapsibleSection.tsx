import {type ReactNode, useState} from 'react'
import {ChevronDown} from 'lucide-react'

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
    <div className="card bg-base-200">
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
        <ChevronDown className={`size-4 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      <div
        id={contentId}
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className={`px-4 pb-4 ${expanded ? 'pt-4' : ''}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
