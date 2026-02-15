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
    if (!enabled || isPaused || panelCount <= 1) return
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % panelCount)
    }, intervalMs)
  }, [enabled, isPaused, panelCount, intervalMs, clearTimer])

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
      } else if (!isPaused) {
        startTimer()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [clearTimer, startTimer, isPaused])

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(index % panelCount)
      // Reset timer on manual navigation
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
  }, [])

  return { activeIndex, goTo, goNext, goPrev, pause, resume, isPaused }
}
