import { useTranslation } from 'react-i18next'

interface CarouselIndicatorProps {
  count: number
  activeIndex: number
  onSelect: (index: number) => void
}

export function CarouselIndicator({ count, activeIndex, onSelect }: CarouselIndicatorProps) {
  const { t } = useTranslation()

  if (count <= 1) return null

  return (
    <ul className="flex items-center justify-center gap-3 py-4" role="tablist">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} role="presentation">
          <button
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            onClick={() => onSelect(i)}
            className="ds-control ds-focusable ds-control--shared-display flex items-center justify-center rounded-full bg-transparent"
            aria-label={t('publicDashboard.goToSlide', { number: i + 1 })}
          >
            <span
              aria-hidden="true"
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-4 h-4 bg-primary'
                  : 'w-3 h-3 bg-base-content/30 hover:bg-base-content/50'
              }`}
            />
          </button>
        </li>
      ))}
    </ul>
  )
}
