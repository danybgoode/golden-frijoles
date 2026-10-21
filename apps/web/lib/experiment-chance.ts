// landing-launch-experiment · Sprint 6, Story 6.3 — "how likely is B really better?", at ANY volume.
//
// The readout's interval answers "is it significant yet?", which at a handful of visitors is always "no". A founder still
// needs an answer they can act on today: given what has happened so far, how likely is the new version the better one?
// That is the Bayesian chance-to-beat: each version's conversion rate as Beta(1 + converted, 1 + not converted) (a flat
// prior: before any data, every rate is equally likely), and the probability one draw exceeds the other — integrated
// deterministically on a grid fitted to both posteriors, not simulated, so the same counts always give the same number. It is REPORTED, never a gate: with
// 3 people the honest answer is near 50%, and the page says so.
//
// Import-free, so the unit layer pins it directly.

export type Counts = { exposed: number; converted: number }

/** A Beta(a, b)'s mean and standard deviation, to fit the grid to where its mass actually is. */
function spread(a: number, b: number): { mean: number; sd: number } {
  const n = a + b
  return { mean: a / n, sd: Math.sqrt((a * b) / (n * n * (n + 1))) }
}

/** The Beta(a, b) density at the midpoints of `steps` equal cells on (lo, hi), normalised to sum to 1. Log densities are
 *  shifted by their maximum before `exp`, so a posterior from millions of people never underflows to 0/0 (verifier, #422). */
function betaCells(a: number, b: number, lo: number, hi: number, steps: number): number[] {
  const width = (hi - lo) / steps
  const logs: number[] = []
  let max = -Infinity
  for (let i = 0; i < steps; i++) {
    const p = lo + (i + 0.5) * width
    const v = (a - 1) * Math.log(p) + (b - 1) * Math.log(1 - p)
    logs.push(v)
    if (v > max) max = v
  }
  const cells = logs.map((v) => Math.exp(v - max))
  const total = cells.reduce((sum, v) => sum + v, 0)
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
  steps = 4000
): number | null {
  if (!valid(control) || !valid(candidate)) return null
  const [aA, bA] = [1 + control.converted, 1 + control.exposed - control.converted]
  const [aB, bB] = [1 + candidate.converted, 1 + candidate.exposed - candidate.converted]
  // One shared grid over both posteriors' mass (mean ± 12 sd, inside (0, 1)): at a million people a posterior is a few
  // thousandths wide, and a fixed (0, 1) grid would put both in the same cell and read every comparison as a tie.
  const A = spread(aA, bA)
  const B = spread(aB, bB)
  const lo = Math.max(0, Math.min(A.mean - 12 * A.sd, B.mean - 12 * B.sd))
  const hi = Math.min(1, Math.max(A.mean + 12 * A.sd, B.mean + 12 * B.sd))
  const a = betaCells(aA, bA, lo, hi, steps)
  const b = betaCells(aB, bB, lo, hi, steps)
  // P(B > A) = Σ_j b_j · (Σ_{i<j} a_i + a_j / 2): ties inside one cell split evenly, so equal counts give exactly 0.5.
  let below = 0
  let higher = 0
  for (let j = 0; j < steps; j++) {
    higher += b[j] * (below + a[j] / 2)
    below += a[j]
  }
  const p = wantUp ? higher : 1 - higher
  return Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : null
}

/** "about 78%" — whole percents, never 0% or 100%, which no finite sample can claim. */
export function chanceWords(p: number): string {
  const pct = Math.round(p * 100)
  return `about ${Math.min(99, Math.max(1, pct))}%`
}
