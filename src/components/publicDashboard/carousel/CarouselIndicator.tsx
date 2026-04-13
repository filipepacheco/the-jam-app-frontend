interface CarouselIndicatorProps {
  count: number
  activeIndex: number
  onSelect: (index: number) => void
}

export function CarouselIndicator({ count, activeIndex, onSelect }: CarouselIndicatorProps) {
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
            className={`rounded-full transition-all duration-300 ${
              i === activeIndex
                ? 'w-4 h-4 bg-primary'
                : 'w-3 h-3 bg-base-content/30 hover:bg-base-content/50'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        </li>
      ))}
    </ul>
  )
}
