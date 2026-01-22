import { useTranslation } from 'react-i18next'

interface FloatingSuggestButtonProps {
  isVisible: boolean
  onClick: () => void
}

export function FloatingSuggestButton({
  isVisible,
  onClick,
}: FloatingSuggestButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-[calc(7.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))] btn btn-secondary btn-circle btn-lg shadow-2xl transition-[opacity,transform] duration-300 motion-reduce:transition-none z-40 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 hover:shadow-xl ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75 motion-reduce:scale-100 pointer-events-none'
      }`}
      aria-label={t('jams.how_it_works.suggest_btn')}
      type="button"
    >
      <span className="text-2xl" aria-hidden="true">✨</span>
    </button>
  )
}
