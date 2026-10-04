---
title: "CLI follow-ups from think-skills: a machine-readable dry-run verdict, and a body-order guard that can fail"
slug: north-star-dry-run-sendable
status: scaffolded
area: "09"
type: feature
priority: null
appetite: S
underwritten_by: null
risk: low
epic: "09-platform-infra/cli-think-skills-followups"
build_order: 57
updated: 2026-10-03
intent_ask: proxy   # both asks are the fresh pr-reviewer's round-2 findings on #216; Daniel asked to groom + consolidate 2026-10-03
intent_match: 90
---

# Pitch — CLI follow-ups from think-skills: a machine-readable dry-run verdict, and a body-order guard that can fail

> **Consolidates [`cli-body-order-guard-clone`](cli-body-order-guard-clone.md)** (Daniel's call at grooming, 2026-10-03:
> "two tiny epics by surface"). Both came from the same review round on #216 and both are about the CLI surface. Each
> stays its own story.

## The ask, as given

> The `--json` dry run carries no such field. An agent has to rebuild the verdict from `inputs[].change`
> (`refused: …`) and `unfilled`, which is the "parse the prose" problem the CLI's `--json` contract exists to avoid.
> — `north-star-dry-run-sendable`, fresh pr-reviewer round 2 on #216

> `apps/web/lib/cli-body-order.test.ts` pins this structurally, but its regex only matches `req.json()` /
> `request.json()` directly. [...] `req.clone().json()`, which the reviewer tried in a scratch copy and saw stay green;
> a handler parameter with another name; reading `req.body` directly.
> — `cli-body-order-guard-clone`, same round

### Claims
1. `gf north-star set --json` (dry run) states whether `--yes` would be accepted, and if not, why, as data.
2. The human sentence and the JSON verdict come from one piece of logic, so they cannot disagree.
3. The CLI body-order guard goes red on `req.clone().json()`, on a renamed handler parameter, and on `.body`.

**Teach-back:** <unasked> — "You want an agent driving `gf` to read the dry run's verdict instead of parsing prose, and
the gate-before-body guard to actually catch the forms that slip past it, so that both #216 promises hold."

## Problem

Re-verified 2026-10-03 on `main` (`cfc14d1`), both still open:
- **Verdict.** `nextStep(plan, unfilled)` (`packages/cli/src/commands/north-star.ts:163`) is the only place the verdict
  exists, and it returns a sentence. The JSON dry run emits `{ dryRun, project, ...plan, unfilled }` (`:245`). To learn
  "would `--yes` work?" an agent has to recompute it from `inputs[].change.startsWith('refused')` and `unfilled`.
- **Guard.** `cli-body-order.test.ts` matches `/\b(?:req|request)\.(?:json|text|formData|arrayBuffer)\(/`. A
  `req.clone().json()`, a `(r: NextRequest)` handler, or a `req.body` read all pass it. All three routes go through
  `readCliBody` today, so nothing is broken *now*; the guard just cannot catch the next regression.

## Appetite
S — one additive JSON field with its tests, and one widened spec with fixtures. Ships as CLI **0.4.1** (0.4.0 is on npm).
quote: $11–17 (S, n=3, p25–p75)

## Outcome & signal
- `gf north-star set <file> --json` prints `sendable` and `blockers`. An agent branches on `sendable` and never reads
  the prose.
- A scratch route that reads `req.clone().json()` turns `npm run test:unit` red.

## Stage-2.5 bucket
**Light enhancement**, both. The verdict logic exists (`nextStep`), and so does the guard. One gets refactored to emit
data; the other gets widened.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| A pure `dryRunVerdict(plan, unfilled) → { sendable, blockers }`; `nextStep` renders from it | one source for prose and JSON (claim 2) |
| `blockers: [{ kind: 'placeholders', paths }, { kind: 'value-source', keys }]` in the JSON dry run | an agent can act on *which* blocker without string-matching |
| One test per blocker kind + a clean-file test (`cli-write.test.ts`) | the acceptance below, pinned |
| CLI patch bump → 0.4.1 + CHANGELOG | additive `--json` field; the contract allows additions |
| Guard: take the handler parameter name from each `export async function <VERB>(<name>`, then flag `<name>(.clone())?.(json\|text\|formData\|arrayBuffer\|blob)(` and `<name>.body` | the three forms the reviewer found, plus `blob` |
| Fixtures: one per form that must fire, one clean route that must not | a guard is only as good as the case that makes it fail (LEARNINGS) |

*Daniel: edit the Why column. In particular, a structured `blockers` object vs. the seed's original `string[]` is your
call; structured is recommended because `keys` is what an agent fixes.*

## Scope
**In v1:** the dry-run verdict in JSON and its tests; the CLI 0.4.1 release notes; the widened guard and its fixtures.
**Out of v1 (no-gos):**
- **The same verdict on other `gf` dry runs** (`flags sync`, …). Each has its own refusal logic; seed them if an agent
  needs them.
- **Changing the human output.** Same sentences, only now rendered from the verdict. The goldens must not move.
- **Moving the guard into semantic-lint.** That decision is owed 2026-10-14 for the lint as a whole; a structural spec is
  enough for this guard.
- **The `npm publish` itself.** It is Daniel's 2FA step and is owed by name in the smoke walkthrough.

## Rabbit holes
- **The `--yes` path refuses placeholders client-side, but a value-source change only server-side.** This epic reports
  the verdict on the dry run only; it does not move the `--yes` refusal. Don't refactor the send path.
- **The guard's own false positives.** `NextResponse.json(` and `cliOk(...)` must not fire. Anchor on the parameter name
  parsed from the signature, never on a bare `.json(`. The clean fixture needs a `NextResponse.json` in it.
- **A route with no handler parameter** (`GET()`) has nothing to scan. Skip it; don't fail.
- **Goldens.** `--help` text does not mention JSON fields, so `help-north-star-set.txt` should not change. If it does, the
  builder changed something out of scope.

## What already exists (reuse, don't rebuild)
- `nextStep`, `unfilledPaths`, `planSync` (`packages/cli/src/commands/north-star.ts`).
- `context.emit.ok(data, text)`, the `--json` contract (`packages/cli/src/output.ts`).
- `packages/cli/src/cli-write.test.ts:813`, the existing unfilled dry-run test to extend.
- `apps/web/lib/cli-body-order.test.ts` and its `routeFiles()` walk; `readCliBody` (`apps/web/lib/cli-auth.ts`).
- The CLI release recipe (memory *golden-frijoles-cli*: test the PACKED tarball under a real TTY before publish).

## UX heuristics & rails check
- **CI guards covering this surface:** `golden.test.ts` (help goldens), `cli-write.test.ts`, `cli-body-order.test.ts`
  (the one being widened), `version.test.ts`.
- **Audits-lens findings that apply:** none found.
- **Design-language debt:** n/a.

## Acceptance criteria
- **Verdict.** On an unfilled template, `gf north-star set <file> --json` prints `"sendable": false` with a
  `placeholders` blocker listing the paths. On a file that changes an existing input's value source, it prints
  `"sendable": false` with a `value-source` blocker naming that input's key. On a clean file, `"sendable": true` and
  `"blockers": []`. The human dry run prints the same sentences as today (goldens unchanged).
- **Guard.** Fixture routes with `req.clone().json()`, `(r: NextRequest) … r.json()` and `req.body` each turn the spec
  red; a clean fixture with `NextResponse.json(...)` stays green; the real CLI routes still pass.
- `npm run test:unit` and `npm run typecheck` are green; the CLI version is 0.4.1 with a CHANGELOG line.

## Open risks / research
- None external. The publish is a human 2FA step; until it happens the field exists on `main` only.

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/north-star-dry-run-sendable.md
  coverage in   0.93  (3 claims)
  coverage out  0.86  (3 criteria)
  clarity       0.92  (3 criteria)
  teach-back    —     (not recorded)
  agreement     pending  (the optional reader at the architecture lock)
Total 90 / 100 — uncalibrated · signals: coverage in, coverage out, clarity
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.933,"coverage_out":0.86,"clarity":0.92,"teach_back":null,"total":90} -->
