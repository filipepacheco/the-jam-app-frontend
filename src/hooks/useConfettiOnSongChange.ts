/**
 * useConfettiOnSongChange Hook
 * Manages confetti trigger logic and animation lifecycle
 */

import {useEffect, useRef, useState} from 'react'

export interface UseConfettiOnSongChangeOptions {
  durationMs?: number
  onTrigger?: () => void
}

export function useConfettiOnSongChange(
  currentSongId: string | null | undefined,
  options: UseConfettiOnSongChangeOptions = {}
) {
  const { durationMs = 5000, onTrigger } = options

  const [confettiVisible, setConfettiVisible] = useState(false)
  const [confettiDimensions, setConfettiDimensions] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousSongIdRef = useRef<string | null>(null)

  // Watch for song changes and trigger confetti
  useEffect(() => {
    if (currentSongId) {
      // Check if song changed from a previous song
      if (previousSongIdRef.current && previousSongIdRef.current !== currentSongId) {
        setConfettiVisible(true)
        onTrigger?.()

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // Schedule confetti to hide
        timeoutRef.current = setTimeout(() => {
          setConfettiVisible(false)
          timeoutRef.current = null
        }, durationMs)
      }
      previousSongIdRef.current = currentSongId
    }

    // Cleanup on unmount or when song changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [currentSongId, durationMs, onTrigger])

  // Update confetti dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setConfettiDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  return {
    confettiVisible,
    confettiDimensions,
    containerRef,
  }
}

