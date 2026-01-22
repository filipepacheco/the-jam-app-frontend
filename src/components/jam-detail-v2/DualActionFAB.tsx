import { useTranslation } from 'react-i18next'
import { useState } from 'react'

interface DualActionFABProps {
  isVisible: boolean
  registrationCount: number
  onRegisterClick: () => void
  onSuggestClick: () => void
  /**
   * Primary action to show when collapsed (default: 'register')
   */
  primaryAction?: 'register' | 'suggest'
}

/**
 * Dual Action Floating Action Button
 *
 * Combines register and suggest functionality into a single expandable FAB.
 * Click the main button to expand and show both actions.
 */
export function DualActionFAB({
  isVisible,
  registrationCount,
  onRegisterClick,
  onSuggestClick,
  primaryAction = 'register',
}: DualActionFABProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleRegisterClick = () => {
    setIsExpanded(false)
    onRegisterClick()
  }

  const handleSuggestClick = () => {
    setIsExpanded(false)
    onSuggestClick()
  }

  const mainIcon = primaryAction === 'register' ? '📝' : '✨'
  const mainAriaLabel = primaryAction === 'register'
    ? t('jams.register')
    : t('jams.how_it_works.suggest_btn')

  return (
    <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))] z-40">
      {/* Secondary actions - appear when expanded */}
      <div
        className={`flex flex-col gap-3 mb-3 transition-[opacity,transform] duration-300 ${
          isVisible && isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
        }`}
      >
        {/* Suggest button */}
        <button
          onClick={handleSuggestClick}
          className="btn btn-secondary btn-circle btn-lg shadow-2xl focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          aria-label={t('jams.how_it_works.suggest_btn')}
          type="button"
        >
          <span className="text-2xl" aria-hidden="true">✨</span>
        </button>

        {/* Register button */}
        <button
          onClick={handleRegisterClick}
          className="btn btn-accent btn-circle btn-lg shadow-2xl focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label={t('jams.register')}
          type="button"
        >
          <div className="relative">
            <span className="text-2xl" aria-hidden="true">📝</span>
            {registrationCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-error text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums">
                {registrationCount}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Main FAB - toggles expansion */}
      <button
        onClick={toggleExpanded}
        className={`btn btn-primary btn-circle btn-lg shadow-2xl transition-[opacity,transform] duration-300 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75 motion-reduce:scale-100 pointer-events-none'
        } ${isExpanded ? 'rotate-45' : 'rotate-0'}`}
        aria-label={isExpanded ? t('common.close') : mainAriaLabel}
        aria-expanded={isExpanded}
        type="button"
      >
        <div className="relative">
          {isExpanded ? (
            <span className="text-2xl" aria-hidden="true">✕</span>
          ) : (
            <>
              <span className="text-2xl" aria-hidden="true">{mainIcon}</span>
              {primaryAction === 'register' && registrationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-error text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums">
                  {registrationCount}
                </span>
              )}
            </>
          )}
        </div>
      </button>

      {/* Backdrop - click to close when expanded */}
      {isExpanded && (
        <button
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsExpanded(false)}
          aria-label={t('common.close')}
          type="button"
        />
      )}
    </div>
  )
}
