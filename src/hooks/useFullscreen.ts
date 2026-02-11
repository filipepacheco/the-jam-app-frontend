/**
 * useFullscreen Hook
 * Manages fullscreen state and toggles
 */

import React, {useCallback, useState} from 'react'

export function useFullscreen(elementRef: React.RefObject<HTMLDivElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await (elementRef.current as HTMLElement)?.requestFullscreen()
        setIsFullscreen(true)
      } catch (err) {
        setIsFullscreen(false)
        console.error('Error requesting fullscreen:', err)
      }
    } else {
      try {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } catch (err) {
        setIsFullscreen(true)
        console.error('Error exiting fullscreen:', err)
      }
    }
  }, [elementRef])

  return {
    isFullscreen,
    toggleFullscreen,
  }
}

