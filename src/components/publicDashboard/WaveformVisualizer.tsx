/**
 * Waveform Visualizer Component
 * Decorative animated waveform bars that pulse at different rates
 * Creates audio visualizer appearance for song display
 */

import {motion} from 'framer-motion'
import {useMemo} from 'react'
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

export function WaveformVisualizer({ barCount = 12, className = '' }: WaveformVisualizerProps) {
  const { prefersReducedMotion } = useReducedMotion()

  const bars = useMemo(
    () =>
      Array.from({ length: barCount }, (_, i) => ({
        id: i,
        baseHeight: 20 + Math.random() * 40,
        delay: i * 0.1,
      })),
    [barCount]
  )

  return (
    <div className={`flex gap-1 justify-center items-end ${className}`}>
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className="w-2 bg-linear-to-t from-purple-500 to-blue-500 rounded-full"
          style={{ height: `${bar.baseHeight}px` }}
          animate={prefersReducedMotion ? {} : WAVEFORM_ANIMATION}
          transition={{ ...WAVEFORM_TRANSITION, delay: bar.delay }}
        />
      ))}
    </div>
  )
}
