/**
 * useFullscreen Hook
 * Manages fullscreen state and toggles
 */

import React, {useCallback, useEffect, useState} from 'react'

export function useFullscreen(elementRef: React.RefObject<HTMLDivElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Sync state when user exits fullscreen via Escape key or browser UI
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await (elementRef.current as HTMLElement)?.requestFullscreen()
      } catch (err) {
        console.error('Error requesting fullscreen:', err)
      }
    } else {
      try {
        await document.exitFullscreen()
      } catch (err) {
        console.error('Error exiting fullscreen:', err)
      }
    }
  }, [elementRef])

  return {
    isFullscreen,
    toggleFullscreen,
  }
}

