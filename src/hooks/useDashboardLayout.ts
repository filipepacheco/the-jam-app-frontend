import { useState, useCallback } from 'react'

export type DashboardLayout = 'classic' | 'carousel'

const LAYOUT_KEY = 'dashboard-layout'
const INTERVAL_KEY = 'dashboard-carousel-interval'
const DEFAULT_INTERVAL = 8000

function readLayout(): DashboardLayout {
  try {
    const stored = localStorage.getItem(LAYOUT_KEY)
    if (stored === 'carousel') return 'carousel'
  } catch { /* ignore */ }
  return 'carousel'
}

function readInterval(): number {
  try {
    const stored = localStorage.getItem(INTERVAL_KEY)
    if (stored) {
      const n = Number(stored)
      if (n > 0) return n
    }
  } catch { /* ignore */ }
  return DEFAULT_INTERVAL
}

export function useDashboardLayout() {
  const [layout, setLayoutState] = useState<DashboardLayout>(readLayout)
  const [carouselIntervalMs, setIntervalState] = useState<number>(readInterval)

  const setLayout = useCallback((value: DashboardLayout) => {
    setLayoutState(value)
    try {
      localStorage.setItem(LAYOUT_KEY, value)
    } catch { /* ignore */ }
  }, [])

  const setCarouselIntervalMs = useCallback((ms: number) => {
    setIntervalState(ms)
    try {
      localStorage.setItem(INTERVAL_KEY, String(ms))
    } catch { /* ignore */ }
  }, [])

  return { layout, setLayout, carouselIntervalMs, setCarouselIntervalMs }
}
