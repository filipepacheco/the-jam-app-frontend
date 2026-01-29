import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface DualActionFABProps {
  isVisible: boolean
  registrationCount: number
  onRegisterClick: () => void
  onSuggestClick: () => void
  primaryAction?: 'register' | 'suggest'
}

/**
 * Dual Action Floating Action Button
 * Renders via portal to document.body for correct fixed positioning
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
  const [mounted, setMounted] = useState(false)

  // Ensure we only render portal after mount (for SSR safety)
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleExpanded = () => setIsExpanded(!isExpanded)

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

  // Don't render until mounted and visible
  if (!mounted || !isVisible) return null

  const fabContent = (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          onClick={() => setIsExpanded(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.2)',
            backdropFilter: 'blur(2px)',
            zIndex: 9998,
          }}
        />
      )}

      {/* FAB Container */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 12,
        }}
      >
        {/* Expanded actions */}
        {isExpanded && (
          <>
            {/* Suggest button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="bg-base-100 text-base-content px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium">
                {t('jams.how_it_works.suggest_btn')}
              </span>
              <button
                onClick={handleSuggestClick}
                className="btn btn-secondary btn-circle btn-lg shadow-2xl"
                type="button"
              >
                <span className="text-2xl">✨</span>
              </button>
            </div>

            {/* Register button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="bg-base-100 text-base-content px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium">
                {t('jams.register')}
              </span>
              <button
                onClick={handleRegisterClick}
                className="btn btn-accent btn-circle btn-lg shadow-2xl"
                type="button"
              >
                <div className="relative">
                  <span className="text-2xl">📝</span>
                  {registrationCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-error text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {registrationCount}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </>
        )}

        {/* Main FAB button */}
        <button
          onClick={toggleExpanded}
          className="btn btn-primary btn-circle btn-lg shadow-2xl"
          aria-label={isExpanded ? t('common.close') : mainAriaLabel}
          aria-expanded={isExpanded}
          type="button"
        >
          <div className="relative">
            {isExpanded ? (
              <span className="text-2xl">✕</span>
            ) : (
              <>
                <span className="text-2xl">{mainIcon}</span>
                {primaryAction === 'register' && registrationCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-error text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {registrationCount}
                  </span>
                )}
              </>
            )}
          </div>
        </button>
      </div>
    </>
  )

  return createPortal(fabContent, document.body)
}
