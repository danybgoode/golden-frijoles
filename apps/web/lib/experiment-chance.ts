// landing-launch-experiment · Sprint 6, Story 6.3 — "how likely is B really better?", at ANY volume.
//
// The readout's interval answers "is it significant yet?", which at a handful of visitors is always "no". A founder still
// needs an answer they can act on today: given what has happened so far, how likely is the new version the better one?
// That is the Bayesian chance-to-beat: each version's conversion rate as Beta(1 + converted, 1 + not converted) (a flat
// prior: before any data, every rate is equally likely), and the probability one draw exceeds the other — integrated
// exactly on a grid, not simulated, so the same counts always give the same number. It is REPORTED, never a gate: with
// 3 people the honest answer is near 50%, and the page says so.
//
// Import-free, so the unit layer pins it directly.

export type Counts = { exposed: number; converted: number }

function logGamma(z: number): number {
  // Lanczos approximation (g = 7, n = 9): accurate to ~15 digits for z > 0.
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z)
  const x = z - 1
  let a = c[0]
  const t = x + 7.5
  for (let i = 1; i < 9; i++) a += c[i] / (x + i)
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a)
}

/** The Beta(a, b) density at the midpoints of `steps` equal cells on (0, 1), normalised to sum to 1. */
function betaCells(a: number, b: number, steps: number): number[] {
  const logNorm = logGamma(a + b) - logGamma(a) - logGamma(b)
  const cells: number[] = []
  let total = 0
  for (let i = 0; i < steps; i++) {
    const p = (i + 0.5) / steps
    const v = Math.exp(logNorm + (a - 1) * Math.log(p) + (b - 1) * Math.log(1 - p))
    cells.push(v)
    total += v
  }
  return cells.map((v) => v / total)
}

function valid(c: Counts): boolean {
  return (
    Number.isInteger(c.exposed) &&
    Number.isInteger(c.converted) &&
    c.exposed >= 0 &&
    c.converted >= 0 &&
    c.converted <= c.exposed
  )
}

/**
 * The chance that `candidate`'s true rate is better than `control`'s — higher when `wantUp`, lower otherwise. 0.5 with no
 * data. Null on counts that cannot be real (negative, fractional, more conversions than people).
 */
export function chanceBetter(
  control: Counts,
  candidate: Counts,
  wantUp: boolean,
  steps = 2000
): number | null {
  if (!valid(control) || !valid(candidate)) return null
  const a = betaCells(1 + control.converted, 1 + control.exposed - control.converted, steps)
  const b = betaCells(1 + candidate.converted, 1 + candidate.exposed - candidate.converted, steps)
  // P(B > A) = Σ_j b_j · (Σ_{i<j} a_i + a_j / 2): ties inside one cell split evenly, so equal counts give exactly 0.5.
  let below = 0
  let higher = 0
  for (let j = 0; j < steps; j++) {
    higher += b[j] * (below + a[j] / 2)
    below += a[j]
  }
  const p = wantUp ? higher : 1 - higher
  return Math.min(1, Math.max(0, p))
}

/** "about 78%" — whole percents, never 0% or 100%, which no finite sample can claim. */
export function chanceWords(p: number): string {
  const pct = Math.round(p * 100)
  return `about ${Math.min(99, Math.max(1, pct))}%`
}
