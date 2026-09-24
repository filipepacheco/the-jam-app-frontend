// One motion vocabulary for the public dashboard (Emil Kowalski's standard
// curves). venue-display.css mirrors EASE_OUT as --venue-ease-out.

/** Strong ease-out: every entrance and exit. Never ease-in on UI. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const
/** Strong ease-in-out: something travelling across the screen. */
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const

export const cssEase = (curve: readonly number[]) => `cubic-bezier(${curve.join(', ')})`

/** Seconds, for Motion. Match --ds-motion-enter/exit; fades serve reduced motion. */
export const DURATION = {enter: 0.32, exit: 0.16, fade: 0.2} as const

/**
 * Pace of every audience-facing cue. A live room reads motion from across the
 * venue, so show cues run slower than host UI. Raise it to slow the whole show.
 */
export const TEMPO = 1.5
