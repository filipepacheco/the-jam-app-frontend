import {useState} from 'react'

// Each song gets its own stage-light color: a hue shift from the brand
// primary, so the theme's lightness and chroma (and text contrast) stay put.
// A curated list, not the whole wheel: no muddy yellow or flat green.
const SCENE_SHIFTS = [0, 40, 75, 110, -130, -95, -50] as const

/** Warm gold for the applause moment. */
export const APPLAUSE_SHIFT = 140

/** FNV-1a, so the same song lights the same on every screen and reload. */
function hash(text: string) {
  let value = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index)
    value = Math.imul(value, 0x01000193)
  }
  return value >>> 0
}

export function sceneShift(songId: string | null) {
  return songId ? SCENE_SHIFTS[hash(songId) % SCENE_SHIFTS.length] : 0
}

/** The turn equal to `target` (mod 360) nearest to `previous`: hue takes the short way round. */
export function nearestTurn(previous: number, target: number) {
  return target + 360 * Math.round((previous - target) / 360)
}

/**
 * Keeps the stage hue unwrapped across changes, so the registered
 * --venue-scene-shift transitions the short way round the color wheel.
 */
export function useSceneShift(target: number) {
  const [scene, setScene] = useState({target, shift: target})
  if (scene.target !== target) {
    const next = {target, shift: nearestTurn(scene.shift, target)}
    setScene(next)
    return next.shift
  }
  return scene.shift
}
