import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Share2} from 'lucide-react'
import type {JamResponseDto} from '../../types/api.types'
import {CollapsibleSection} from './CollapsibleSection'
import {ShareModal} from '../ShareModal'

interface CollapsibleSidebarProps {
  jam: JamResponseDto | null
  onSuggestClick: () => void
  isAuthenticated: boolean
}

// Check if we're on desktop (lg breakpoint = 1024px)
function getIsDesktop() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(min-width: 1024px)').matches
}

export function CollapsibleSidebar({
  jam,
  onSuggestClick,

}: CollapsibleSidebarProps) {
  const { t } = useTranslation()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

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

      {/* Share Button */}
      {jam && (
        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="btn btn-outline btn-block gap-2"
        >
          <Share2 className="w-4 h-4" />
          {t('share.share_button')}
        </button>
      )}

      {/* Share Modal */}
      {jam && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          jamId={jam.id}
          jamSlug={jam.slug}
          jamName={jam.name}
        />
      )}

      {/* How It Works - Collapsible */}
      <CollapsibleSection
        title={t('jams.how_it_works.title')}
        isExpanded={expandedSections.howItWorks}
        onToggle={() => toggleSection('howItWorks')}
        // badge={t('jams.how_it_works.steps_count', { count: 5 })}
      >
        <div className="space-y-3 text-xs">
          {/* Steps */}
          {[
            { icon: '📋', title: 'view_schedule', desc: 'view_schedule_desc' },
            { icon: '📝', title: 'register_songs', desc: 'register_songs_desc' },
            { icon: '✨', title: 'suggest_songs', desc: 'suggest_songs_desc' },
            { icon: '👥', title: 'collaborate', desc: 'collaborate_desc' },
            { icon: '🎵', title: 'performance_time', desc: 'performance_time_desc' },
          ].map((step, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-lg shrink-0" aria-hidden="true">{step.icon}</span>
              <div className="min-w-0">
                <p className="font-semibold">{t(`jams.how_it_works.${step.title}`)}</p>
                <p className="text-base-content/60 text-xs">
                  {t(`jams.how_it_works.${step.desc}`)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onSuggestClick}
          className="btn btn-secondary btn-sm w-full mt-4 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          type="button"
        >
          <span aria-hidden="true">✨</span> {t('jams.how_it_works.suggest_btn')}
        </button>
      </CollapsibleSection>

    </div>
  )
}
