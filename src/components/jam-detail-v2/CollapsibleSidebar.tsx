import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {ClipboardList, PenLine, Music} from 'lucide-react'
import {CollapsibleSection} from './CollapsibleSection'

// Check if we're on desktop (lg breakpoint = 1024px)
function getIsDesktop() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(min-width: 1024px)').matches
}

export function CollapsibleSidebar() {
  const { t } = useTranslation()

  // Initialize expanded state based on screen size - open on desktop, collapsed on mobile
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const isDesktop = getIsDesktop()
    return {
      howItWorks: isDesktop,
    }
  })

  // Update expanded state when screen size changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')

    const handleChange = (e: MediaQueryListEvent) => {
      setExpandedSections({
        howItWorks: e.matches,
      })
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div className="space-y-3">
      {/* How It Works - Collapsible */}
      <CollapsibleSection
        title={t('jams.how_it_works.title')}
        isExpanded={expandedSections.howItWorks}
        onToggle={() => toggleSection('howItWorks')}
        // badge={t('jams.how_it_works.steps_count', { count: 5 })}
      >
        <div className="space-y-3 text-xs">
          {[
            { icon: <ClipboardList className="size-4 text-base-content/50 shrink-0" />, title: 'view_schedule', desc: 'view_schedule_desc' },
            { icon: <PenLine className="size-4 text-base-content/50 shrink-0" />, title: 'register_songs', desc: 'register_songs_desc' },
            { icon: <Music className="size-4 text-base-content/50 shrink-0" />, title: 'performance_time', desc: 'performance_time_desc' },
          ].map((step, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              {step.icon}
              <div className="min-w-0">
                <p className="font-semibold">{t(`jams.how_it_works.${step.title}`)}</p>
                <p className="text-base-content/60 text-xs">
                  {t(`jams.how_it_works.${step.desc}`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

    </div>
  )
}
