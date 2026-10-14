// one-flag-switch — the ONE rule for whether a flag is On or Off in an environment, and who an On flag reaches.
// It lives in the SDK because it is flag evaluation: the Golden Frijoles flags page, `frijoles flags ls/get`, the MCP
// tools and the sync output all call it, and so can anyone's own code. (Moved from apps/web's flag-list-view.ts.)
//
// The product owner, 2026-10-13: "I want to turn on or off features … by clicking on or off switch. That's it. I do not
// want an activated state at all." The page used to show whether a version was ACTIVATED, so a flag activated with a
// `false` default read "On" while every app got `false`, and `frijoles flags kill` (which serves `false`) never moved
// it. Every surface — this list, the feature page, `frijoles flags ls/get`, the connector — answers from what the
// environment actually SERVES:
//   - boolean flag: On when the served version gives `true`, by default or through any rule; otherwise Off. Never set
//     here, or taken out, is Off.
//   - any other type: On while a value is served (the screen shows the value; there is no switch), else Off.
// Total over unvalidated JSONB: a definition this cannot read is Off, never a guess at On.

export type FlagSwitchState = 'on' | 'off'

type Variant = { key?: unknown; value?: unknown }

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/** The value a variant key names in this definition, or `undefined` when it names nothing. */
function variantValue(variants: readonly Variant[], key: unknown): unknown {
  return variants.find((variant) => variant.key === key)?.value
}

/**
 * @param servedDefinition the definition of the version this environment serves, or `null`/`undefined` when it serves
 *   nothing (never set here, or taken out).
 */
export function flagSwitchState(servedDefinition: unknown): FlagSwitchState {
  const definition = record(servedDefinition)
  if (!definition) return 'off'
  const variants = Array.isArray(definition.variants) ? (definition.variants as Variant[]) : []
  if (definition.valueType !== 'boolean') return variants.length > 0 ? 'on' : 'off'
  // Rules in priority order, the way the evaluator walks them. A rule to `true` that can reach someone makes the flag
  // On (on for those it reaches). An unconditional rule that reaches everyone ends the walk: it decides for all, and
  // nothing below it — the default included — is ever served (verifier, #351: a top rule to `false` must read Off).
  const rules = (Array.isArray(definition.rules) ? definition.rules : [])
    .map((rule) => record(rule))
    .filter((rule): rule is Record<string, unknown> => rule !== null)
    .sort((a, b) => Number(a.priority) - Number(b.priority))
  for (const rule of rules) {
    const rollout = record(rule.rollout)
    const basisPoints = rollout && typeof rollout.basisPoints === 'number' ? rollout.basisPoints : null
    const reachesSomeone = basisPoints === null || basisPoints > 0
    // Only a rule with NO rollout reaches everyone: even a 100% rollout leaves out a context with no targeting key.
    const reachesEveryone = basisPoints === null
    const unconditional = !Array.isArray(rule.clauses) || rule.clauses.length === 0
    const servesTrue = typeof rule.variantKey === 'string' && variantValue(variants, rule.variantKey) === true
    if (servesTrue && reachesSomeone) return 'on'
    if (unconditional && reachesEveryone) return 'off'
  }
  return variantValue(variants, definition.defaultVariantKey) === true ? 'on' : 'off'
}

/**
 * Who an On boolean flag reaches, in words, for the line beside the switch (product owner, 2026-10-13: "it should name
 * the segment, and if none is defined, as right now, just a placeholder"). `null` when the flag is Off, or not on/off.
 *
 * The AUDIENCE is everyone the evaluator serves `true` to, so this follows it to the end (verifier, #352), not just to
 * the first rule that serves `true`: rules in priority order, a context falling through any rule it misses, and the
 * default (or the first rule that catches everyone) serving whoever is left.
 *   - the rest get `true` → `everyone`, or `everyone but a segment (not named yet)` when a rule above takes some out;
 *   - the rest get `false` → the parts served `true` above it: `25% of people`, `a segment (not named yet)` (a rule
 *     with conditions: the placeholder until named segments exist, `tars-segments`), joined with "and", with
 *     ", except a segment (not named yet)" when a rule above them takes some out first.
 * It agrees with `flagSwitchState` on On / Off by construction (null unless the switch reads On).
 */
export const UNNAMED_SEGMENT = 'a segment (not named yet)'
export function flagReach(servedDefinition: unknown): string | null {
  const definition = record(servedDefinition)
  if (!definition || definition.valueType !== 'boolean' || flagSwitchState(definition) !== 'on') return null
  const variants = Array.isArray(definition.variants) ? (definition.variants as Variant[]) : []
  const rules = (Array.isArray(definition.rules) ? definition.rules : [])
    .map((rule) => record(rule))
    .filter((rule): rule is Record<string, unknown> => rule !== null)
    .sort((a, b) => Number(a.priority) - Number(b.priority))
  const parts: string[] = []
  let takesSomeOut = false
  let restGetTrue = variantValue(variants, definition.defaultVariantKey) === true
  for (const rule of rules) {
    const rollout = record(rule.rollout)
    const basisPoints = rollout && typeof rollout.basisPoints === 'number' ? rollout.basisPoints : null
    if (basisPoints !== null && basisPoints <= 0) continue
    const unconditional = !Array.isArray(rule.clauses) || rule.clauses.length === 0
    const servesTrue = typeof rule.variantKey === 'string' && variantValue(variants, rule.variantKey) === true
    if (unconditional && basisPoints === null) {
      // Catches everyone still here: nothing below it, the default included, is ever served.
      restGetTrue = servesTrue
      break
    }
    if (servesTrue)
      parts.push(unconditional ? `${Math.round(basisPoints ?? 0) / 100}% of people` : UNNAMED_SEGMENT)
    else takesSomeOut = true
  }
  if (restGetTrue) return takesSomeOut ? `everyone but ${UNNAMED_SEGMENT}` : 'everyone'
  const unique = [...new Set(parts)]
  const named = unique.map((part) =>
    part === UNNAMED_SEGMENT && parts.filter((p) => p === part).length > 1 ? 'segments (not named yet)' : part
  )
  return `${named.join(' and ')}${takesSomeOut ? `, except ${UNNAMED_SEGMENT}` : ''}`
}

/** Whether this definition can have a switch at all: a boolean flag with a `true` and a `false` variant. */
export function hasFlagSwitch(definition: unknown): boolean {
  const def = record(definition)
  if (!def || def.valueType !== 'boolean' || !Array.isArray(def.variants)) return false
  const values = (def.variants as Variant[]).map((variant) => variant.value)
  return values.includes(true) && values.includes(false)
}
