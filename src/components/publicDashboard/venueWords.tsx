/**
 * Splits a title into words that rise one after another, each in its own
 * mask, so a wrapped title never shows a word over the next line. The spaces
 * stay plain text, so the heading reads as one phrase to assistive technology.
 */
export function splitWords(text: string) {
  return text.split(/(\s+)/).map((part, index) => /^\s*$/.test(part)
    ? part
    : <span key={index} className="venue-word"><span className="venue-word-inner">{part}</span></span>)
}
