export const LOADER_PHRASES = [
  'Percolating…',
  'Blooming…',
  'Decanting…',
  'Tempering…',
  'Degassing…',
  'Scorching…',
  'Cupping…',
  'Burring…',
  'Beanstalking…',
  'Assaying…',
  'Smelting…',
  'Hoarding…',
  'Gilding…',
  'Fee-fi-fo-fumbling…',
  'Bean-counting…',
  'Spilling the beans…',
  'North-Star-gazing…',
  'Overcaffeinating…',
  'Compounding…',
  'Funneling…',
] as const

/**
 * The phrase a freshly mounted loader opens on. The navigation loader mounts once per navigation and most
 * navigations end before the first rotation, so a fixed start (index 0) meant every visitor only ever saw
 * "Percolating…". A random start that skips the previous navigation's phrase keeps it from repeating.
 * `random` is injected so the pick is testable; it must return a number in [0, 1).
 */
export function pickLoaderPhraseIndex(previous: number | null, random: () => number = Math.random): number {
  const count = LOADER_PHRASES.length
  if (previous === null || previous < 0 || previous >= count) return Math.floor(random() * count) % count
  // Choose among the other count - 1 phrases, then step over `previous`.
  const pick = Math.floor(random() * (count - 1)) % (count - 1)
  return pick >= previous ? pick + 1 : pick
}
