/**
 * Waveform Visualizer Component
 * Decorative animated waveform bars that pulse at different rates
 * Creates audio visualizer appearance for song display
 */

import {motion} from 'framer-motion'
import {useReducedMotion} from "../../hooks";

interface WaveformVisualizerProps {
  barCount?: number
  className?: string
}

// Animation configuration for waveform bars
const WAVEFORM_ANIMATION = {
  scaleY: [1, 1.5, 0.8, 1.2, 1],
}

const WAVEFORM_TRANSITION = {
  duration: 2,
  repeat: Infinity,
  ease: 'easeInOut',
} as const

/** Stable visual rhythm: public display refreshes must not redraw random bars. */
const WAVEFORM_HEIGHTS = [24, 34, 46, 30, 52, 38, 56, 32, 44, 28, 50, 36] as const

export function WaveformVisualizer({ barCount = 12, className = '' }: WaveformVisualizerProps) {
  const { prefersReducedMotion } = useReducedMotion()

  const bars = Array.from({ length: barCount }, (_, index) => ({
    id: index,
    baseHeight: WAVEFORM_HEIGHTS[index % WAVEFORM_HEIGHTS.length],
    delay: index * 0.1,
  }))

  return (
    <div className={`flex gap-1 justify-center items-end ${className}`}>
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className="w-2 bg-linear-to-t from-primary to-secondary rounded-full"
          style={{ height: `${bar.baseHeight}px` }}
          animate={prefersReducedMotion ? {} : WAVEFORM_ANIMATION}
          transition={{ ...WAVEFORM_TRANSITION, delay: bar.delay }}
        />
      ))}
    </div>
  )
}
