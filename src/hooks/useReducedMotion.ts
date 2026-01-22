/**
 * useReducedMotion Hook
 * Respects user's prefers-reduced-motion media query for accessibility
 * Returns configuration suitable for Framer Motion components
 */

import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    // Use addEventListener for better browser support
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return {
    prefersReducedMotion,
    // Framer Motion transition config that respects preference
    transition: prefersReducedMotion
      ? { duration: 0 } // Instant transitions
      : { duration: 0.5 }, // Normal transitions
  }
}
