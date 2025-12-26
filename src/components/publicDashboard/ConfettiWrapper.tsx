import React from 'react'
import Confetti from 'react-confetti'

export default function ConfettiWrapper({ show, width, height }: { show: boolean; width: number; height: number }) {
  if (!show) return null
  return <Confetti width={width} height={height} numberOfPieces={200} recycle={false} />
}

