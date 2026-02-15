interface CarouselIndicatorProps {
  count: number
  activeIndex: number
  onSelect: (index: number) => void
}

export function CarouselIndicator({ count, activeIndex, onSelect }: CarouselIndicatorProps) {
  if (count <= 1) return null

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={`rounded-full transition-all duration-300 ${
            i === activeIndex
              ? 'w-4 h-4 bg-white'
              : 'w-3 h-3 bg-white/30 hover:bg-white/50'
          }`}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  )
}
