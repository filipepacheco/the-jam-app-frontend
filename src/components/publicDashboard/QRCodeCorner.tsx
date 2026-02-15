import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { AnimatePresence, motion } from 'framer-motion'

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface QRCodeCornerProps {
  jamId?: string
  shortCode?: string | null
  position?: Position
}

export default function QRCodeCorner({ jamId, shortCode, position = 'bottom-left' }: QRCodeCornerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  // Use short URL if shortCode available, otherwise fall back to jam detail URL
  const url = shortCode
    ? `${origin}/j/${shortCode}`
    : `${origin}/jams/${jamId || ''}`

  const positionClasses: Record<Position, string> = {
    'top-left': 'fixed top-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'bottom-right': 'fixed bottom-6 right-6',
  }

  return (
    <>
      {/* QR Code in Corner */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        onClick={() => setIsExpanded(true)}
        className={`${positionClasses[position]} bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-lg p-5 z-40 transition-all cursor-pointer hidden md:block`}
        type="button"
        title="Click to expand QR code"
        aria-label="Expand QR code"
      >
        <QRCodeSVG value={url} size={150} fgColor="#ffffff" bgColor="transparent" />
        <p className="text-xs text-center mt-2 text-slate-300">Scan to join</p>
      </motion.button>

      {/* Expanded QR Code Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-base-100 rounded-2xl p-8 max-w-md w-full flex flex-col items-center justify-center"
            >
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 btn btn-sm btn-ghost text-base-content"
                aria-label="Close QR code"
                type="button"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold mb-6 text-base-content">Join the Jam</h2>

              <div className="bg-white p-6 rounded-lg mb-4">
                <QRCodeSVG value={url} size={280} fgColor="#000000" bgColor="#ffffff" />
              </div>

              {shortCode && (
                <p className="text-center text-base-content font-mono text-2xl font-bold tracking-widest mb-2">
                  {shortCode}
                </p>
              )}
              <p className="text-center text-base-content mb-2">
                {shortCode ? 'Scan the QR code or type the code above' : 'Scan the QR code with your phone'}
              </p>
              <p className="text-sm text-base-content/70 text-center">{url}</p>

              <button
                onClick={() => setIsExpanded(false)}
                className="btn btn-primary mt-6 w-full"
                type="button"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
