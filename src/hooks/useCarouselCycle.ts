import { useState, useEffect, useCallback, useRef } from 'react'

interface UseCarouselCycleOptions {
  panelCount: number
  intervalMs: number
  enabled: boolean
}

interface UseCarouselCycleReturn {
  activeIndex: number
  goTo: (index: number) => void
  goNext: () => void
  goPrev: () => void
  pause: () => void
  resume: () => void
  isPaused: boolean
}

export function useCarouselCycle({
  panelCount,
  intervalMs,
  enabled,
}: UseCarouselCycleOptions): UseCarouselCycleReturn {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Ref mirrors isPaused so startTimer doesn't need it as a dependency,
  // breaking the state -> callback identity -> effect chain.
  const isPausedRef = useRef(isPaused)
  isPausedRef.current = isPaused

  // Reset index when panel count changes
  useEffect(() => {
    setActiveIndex((prev) => (prev >= panelCount ? 0 : prev))
  }, [panelCount])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    if (!enabled || isPausedRef.current || panelCount <= 1) return
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % panelCount)
    }, intervalMs)
  }, [enabled, panelCount, intervalMs, clearTimer])

  // Start/restart timer when dependencies change
  useEffect(() => {
    startTimer()
    return clearTimer
  }, [startTimer, clearTimer])

  // Pause on document hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        clearTimer()
      } else if (!isPausedRef.current) {
        startTimer()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [clearTimer, startTimer])

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(index % panelCount)
      startTimer()
    },
    [panelCount, startTimer]
  )

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % panelCount)
    startTimer()
  }, [panelCount, startTimer])

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + panelCount) % panelCount)
    startTimer()
  }, [panelCount, startTimer])

  const pause = useCallback(() => {
    setIsPaused(true)
    clearTimer()
  }, [clearTimer])

  const resume = useCallback(() => {
    setIsPaused(false)
    // Start timer directly instead of relying on effect chain
    // (isPausedRef.current is still true here, so update it first)
    isPausedRef.current = false
    startTimer()
  }, [startTimer])

  return { activeIndex, goTo, goNext, goPrev, pause, resume, isPaused }
}
