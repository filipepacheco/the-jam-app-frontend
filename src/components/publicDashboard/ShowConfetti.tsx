import {lazy, Suspense, useLayoutEffect, useState, type RefObject} from 'react'

const ConfettiWrapper = lazy(() => import('./ConfettiWrapper'))

// Square pieces: the default confetti mixes long strips and rectangles.
// react-confetti calls this with the particle as `this`.
function square(this: {w: number}, context: CanvasRenderingContext2D) {
  const size = 6 + this.w * 0.5
  context.fillRect(-size / 2, -size / 2, size, size)
}

interface ShowConfettiProps {
  /** The applause the room is giving; confetti falls for as long as it lasts. */
  applause: string | null
  /** The whole venue display: confetti covers every card, not only the stage. */
  container: RefObject<HTMLElement | null>
}

/**
 * Confetti over the whole display while the room applauds. It keeps falling
 * for the full applause, then the last pieces drop out on their own.
 */
export function ShowConfetti({applause, container}: ShowConfettiProps) {
  const [burst, setBurst] = useState<{id: string; width: number; height: number; colors: string[]} | null>(null)

  useLayoutEffect(() => {
    const element = container.current
    if (!applause || !element) return
    const {width, height} = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    const colors = ['--color-primary', '--color-secondary', '--color-accent', '--color-warning']
      .map(token => style.getPropertyValue(token).trim())
      .filter(Boolean)
    setBurst({id: applause, width, height, colors})
  }, [applause, container])

  if (!burst) return null
  return (
    <Suspense fallback={null}>
      <ConfettiWrapper
        key={burst.id}
        show
        width={burst.width}
        height={burst.height}
        numberOfPieces={260}
        tweenDuration={1500}
        gravity={0.08}
        recycle={burst.id === applause}
        drawShape={square}
        onConfettiComplete={() => setBurst(current => current?.id === burst.id ? null : current)}
        {...(burst.colors.length > 0 ? {colors: burst.colors} : {})}
      />
    </Suspense>
  )
}
