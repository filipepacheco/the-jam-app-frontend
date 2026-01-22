import { useEffect, useRef } from 'react'

interface CanvasWaveformProps {
  /**
   * Number of vertical bars to render (default: 20)
   */
  barCount?: number
  /**
   * Animation speed multiplier (default: 1)
   */
  speed?: number
  /**
   * Minimum bar height as percentage (0-100, default: 20)
   */
  minHeight?: number
  /**
   * Maximum bar height as percentage (0-100, default: 100)
   */
  maxHeight?: number
  /**
   * Gap between bars in pixels (default: 2)
   */
  barGap?: number
  /**
   * Whether to animate bars (default: true)
   */
  animated?: boolean
  /**
   * Bar color - can be CSS color or 'primary' to use theme color (default: 'primary')
   */
  color?: string
  /**
   * Bar opacity (0-1, default: 1)
   */
  opacity?: number
  /**
   * Enable glow effect (default: false)
   */
  glow?: boolean
  /**
   * Glow intensity (0-1, default: 0.3)
   */
  glowIntensity?: number
  /**
   * Seed for deterministic random heights (optional)
   */
  seed?: number
  /**
   * Additional CSS classes
   */
  className?: string
}

export function CanvasWaveform({
  barCount = 20,
  speed = 1,
  minHeight = 20,
  maxHeight = 100,
  barGap = 2,
  animated = true,
  color = 'primary',
  opacity = 1,
  glow = false,
  glowIntensity = 0.3,
  seed,
  className = '',
}: CanvasWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const barHeightsRef = useRef<number[]>([])
  const targetHeightsRef = useRef<number[]>([])

  // Seeded random number generator for deterministic animations
  const seededRandom = (seed: number) => {
    let x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get primary color from CSS if needed
    let barColor = color
    if (color === 'primary') {
      const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--p')
        .trim()
      barColor = primaryColor ? `oklch(${primaryColor})` : '#570df8'
    }

    // Setup high DPI canvas
    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    // Initialize bar heights
    const initializeHeights = () => {
      barHeightsRef.current = []
      targetHeightsRef.current = []
      for (let i = 0; i < barCount; i++) {
        const randomValue = seed !== undefined
          ? seededRandom(seed + i)
          : Math.random()
        const height = minHeight + randomValue * (maxHeight - minHeight)
        barHeightsRef.current.push(height)
        targetHeightsRef.current.push(height)
      }
    }

    // Update target heights for animation
    const updateTargets = () => {
      for (let i = 0; i < barCount; i++) {
        if (Math.random() < 0.02 * speed) { // 2% chance per frame, scaled by speed
          const randomValue = seed !== undefined
            ? seededRandom(seed + i + Date.now())
            : Math.random()
          targetHeightsRef.current[i] = minHeight + randomValue * (maxHeight - minHeight)
        }
      }
    }

    // Smooth interpolation towards target
    const interpolateHeights = () => {
      const smoothness = 0.05 * speed
      for (let i = 0; i < barCount; i++) {
        const current = barHeightsRef.current[i]
        const target = targetHeightsRef.current[i]
        barHeightsRef.current[i] = current + (target - current) * smoothness
      }
    }

    // Render function
    const render = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      const totalGap = barGap * (barCount - 1)
      const barWidth = (rect.width - totalGap) / barCount

      for (let i = 0; i < barCount; i++) {
        const heightPercent = barHeightsRef.current[i] / 100
        const barHeight = rect.height * heightPercent
        const x = i * (barWidth + barGap)
        const y = rect.height - barHeight

        // Apply glow effect if enabled
        if (glow) {
          ctx.shadowColor = barColor
          ctx.shadowBlur = 10 * glowIntensity
        } else {
          ctx.shadowBlur = 0
        }

        // Draw bar with gradient
        const gradient = ctx.createLinearGradient(x, y, x, rect.height)
        gradient.addColorStop(0, barColor)
        gradient.addColorStop(1, barColor)

        ctx.globalAlpha = opacity
        ctx.fillStyle = gradient
        ctx.fillRect(x, y, barWidth, barHeight)
      }

      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
    }

    // Animation loop
    const animate = () => {
      if (animated) {
        updateTargets()
        interpolateHeights()
      }
      render()
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Setup ResizeObserver for responsive sizing
    const resizeObserver = new ResizeObserver(() => {
      setupCanvas()
      render()
    })

    // Initialize
    setupCanvas()
    initializeHeights()
    resizeObserver.observe(canvas)
    animate()

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      resizeObserver.disconnect()
    }
  }, [barCount, speed, minHeight, maxHeight, barGap, animated, color, opacity, glow, glowIntensity, seed])

  return (
    <canvas
      ref={canvasRef}
      className={`block ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
