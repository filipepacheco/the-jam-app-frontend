// Text that flies across the venue display (a sign-up into its lineup, the
// up-next song onto the stage) lands on the real text's box, so the real text
// takes over in place with no visible swap.

import {TEMPO} from './venueMotion'

/** The up-next song's walk to the stage. Milliseconds at TEMPO 1. */
export const FLIGHT = {travel: 900 * TEMPO, stagger: 35 * TEMPO}

/** A text box and the style it is drawn in, copied so it outlives the element. */
export interface TextBox {
  rect: DOMRect
  fontSize: number
  lineHeight: number
  letterSpacing: number
  color: string
  font: string
}

export function measureText(element: Element): TextBox {
  const style = getComputedStyle(element)
  const fontSize = parseFloat(style.fontSize) || 16
  return {
    rect: element.getBoundingClientRect(),
    fontSize,
    lineHeight: parseFloat(style.lineHeight) || fontSize * 1.2,
    letterSpacing: parseFloat(style.letterSpacing) || 0,
    color: style.color,
    font: `${style.fontStyle} ${style.fontWeight} ${fontSize}px ${style.fontFamily}`,
  }
}

/**
 * FLIP with the transform origin at the top left: scale by the font-size
 * ratio, and align the glyphs, not the line boxes (the half-leading differs
 * when the line heights do).
 */
export function flightTransform(from: TextBox, to: TextBox) {
  const scale = to.fontSize / from.fontSize
  const leading = (box: TextBox) => (box.lineHeight - box.fontSize) / 2
  const x = to.rect.left - from.rect.left
  const y = to.rect.top + leading(to) - from.rect.top - scale * leading(from)
  return {transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`, scale}
}
