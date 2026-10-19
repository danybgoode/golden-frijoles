// landing-launch-experiment · Sprint 2, Story 2.1 (epic D1) — which side of an A/B test one visitor is on, as a pure
// function of what the catalog serves. `lib/gates.ts → variant()` hands it the catalog row; nothing here reads a
// database, a cookie or a clock, so the unit layer pins every answer it can give.
//
// ── Why a second file and not a row in gates-decision.ts ─────────────────────────────────────
// gates-decision.ts is import-free on purpose (the Playwright process reads it to pick its suites). Bucketing a
// visitor needs the SDK's own evaluator: a second copy of the rollout hash here would agree with production only
// until the evaluator changed, and then disagree silently. So the evaluation is `evaluateFlag`, the exposure binding
// is `experimentForResolution`, and this file only decides what an unreadable answer means.
//
// ── Every unreadable answer is A, with no experiment ─────────────────────────────────────────
// No catalog, a taken-out flag, nothing served, an invalid definition, no visitor id: the page renders A and NO
// exposure is written. A page nobody was assigned to must never enter an experiment's denominator, and B — the arm
// under test — must never be what a broken read serves.

import { evaluateFlag, experimentForResolution, type FlagSnapshotFlag } from '@golden-frijoles/sdk'

/** The flags our own pages read per visitor. A flag here is an experiment's switch, not a gate: off = A, on = B. */
export const EXPERIMENT_FLAGS = {
  landingVariantB: { key: 'landing.variant_b_enabled' },
} as const

export type ExperimentFlagName = keyof typeof EXPERIMENT_FLAGS

/** The slice of a catalog row (`lib/gates-decision.ts → ServedEnvironment`) this rule reads. */
export type VariantSource = {
  /** `never` | `off` | `on`, from `toGateRows`. Taken out (`off`) is A whatever is stored. */
  activation?: string
  /** The version this environment serves, or absent when it serves nothing. `definition` is checked by `evaluateFlag`
   *  (`parseFlagDefinition`), so a corrupt stored row is an `INVALID_DEFINITION`, i.e. A — never a throw. */
  flag?: { key: string; definitionVersion: number; definition: unknown }
  /** The environment's snapshot version: the SDK's flag telemetry names it on every exposure. */
  snapshotVersion?: number
}

export type VariantAnswer = {
  /** true = serve B. */
  b: boolean
  /** The flag variant's key (`on`, `off`, …), or null when nothing was evaluated. */
  variant: string | null
  reason: string
  flagVersion: number | null
  snapshotVersion: number | null
  /** Present only when the visitor was assigned by one of a running experiment's rules — the one case D3 exposes. */
  experiment?: { key: string; definitionVersion: number }
}

export const A_UNASSIGNED: VariantAnswer = Object.freeze({
  b: false,
  variant: null,
  reason: 'DEFAULT',
  flagVersion: null,
  snapshotVersion: null,
})

// The same bound the SDK's flag telemetry puts on a subject id (`OPAQUE_ID`, flag-telemetry.ts): a visitor id that
// the exposure path would refuse must not be bucketed either, or the page and the readout would disagree about who
// was in the test. `gb_vid` is a UUID, which passes.
const VISITOR_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/

export function isVisitorId(value: unknown): value is string {
  return typeof value === 'string' && VISITOR_ID.test(value)
}

export function resolveVariant(source: VariantSource | undefined, visitorId: unknown): VariantAnswer {
  if (!source || source.activation === 'off' || !source.flag || !isVisitorId(visitorId)) return A_UNASSIGNED
  const resolved = evaluateFlag<boolean>({
    flag: source.flag as FlagSnapshotFlag,
    context: { targetingKey: visitorId },
    defaultValue: false,
    expectedType: 'boolean',
  })
  if (resolved.errorCode !== undefined) return A_UNASSIGNED
  const experiment = experimentForResolution(resolved)
  return {
    b: resolved.value === true,
    variant: resolved.variant ?? null,
    reason: resolved.reason,
    flagVersion: resolved.flagVersion ?? null,
    snapshotVersion: typeof source.snapshotVersion === 'number' ? source.snapshotVersion : null,
    ...(experiment ? { experiment } : {}),
  }
}
