import React, { useMemo } from 'react'
import {motion} from 'framer-motion'
import {useReducedMotion} from '../../hooks'

export default function OfflineBanner({ visible, message }: { visible: boolean; message?: string }) {
  const { transition } = useReducedMotion()

  const bannerTransition = useMemo(() => ({
    opacity: transition.duration === 0 ? 0.2 : 0,
    y: -10
  }), [transition])
  
  if (!visible) return null

  return (
    <motion.div
      initial={bannerTransition}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="fixed top-0 left-1/2 transform -translate-x-1/2 z-40 bg-warning text-warning-content px-4 py-2 rounded-b-lg"
      role="status"
      aria-live="polite"
    >
      {message || '📵 You are offline - showing cached data'}
    </motion.div>
  )
}

