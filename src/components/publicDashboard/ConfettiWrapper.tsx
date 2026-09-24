import React from 'react'
import Confetti, {type IConfettiOptions} from 'react-confetti'

type ConfettiWrapperProps = {show: boolean; width: number; height: number} & Partial<Pick<IConfettiOptions, 'numberOfPieces' | 'colors' | 'tweenDuration'>>

export default function ConfettiWrapper({show, width, height, numberOfPieces = 200, ...options}: ConfettiWrapperProps) {
  if (!show) return null
  return <Confetti width={width} height={height} numberOfPieces={numberOfPieces} recycle={false} {...options} />
}
