---
status: shipped      # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shipped       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: satisfied-ask
title: "The Satisfied ask"
area: 01-growth-engine
risk: high
type: feature
sprints_total: 1
stories_total: 5   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 84   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 8    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 20
quote_basis: "S, n=12, p25–p75"
hypothesis: "Founders cannot tell whether the people who kept using a feature liked it: the last funnel stage has always read not measured, because nothing gives them a standard way to ask. A standard rating, read against a bar each bet sets, turns it into a number. We'll know when ratings arrive on two projects."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "projects with at least one satisfaction_rated event in the last 30 days"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 2       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "A founder who owns the product, judging whether a shipped bet is working, who has no rating of their own to send"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "It gives an owner verdict on a proven bet better evidence, but satisfaction is not a rung of the evidence ladder and no North Star input counts it."   # only with grounded: false
flag_key: bets.satisfaction_ask_enabled   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: everyone   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: satisfaction_rated
retained_event: null
retention_days: null
satisfied_event: null
build_order: 99      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
actual_usd: 14.66
actual_mtok: 45.2
actual_models: "claude-opus-5-5 ≈$14.66"
actual_basis: "this machine · 2026-10-18 · 2 sessions · prices 2026-10-02"
---

# Epic: The Satisfied ask ✅

> **Area:** 01-growth-engine · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/satisfied-ask.md`](../../00-ideas/seeds/satisfied-ask.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at refining (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
Founders can't tell whether the people who kept using a feature liked it. The funnel's last stage, Satisfied, has always
read "not measured": nothing gives them a standard way to ask, and if they rolled their own, a 1-star answer would count
as satisfied. This epic gives them one SDK call to send a 1–5 rating and a bar each bet sets, so Satisfied becomes a
number. We'll know when ratings arrive on two projects (Golden Frijoles and Miyagi).

## Platform-first note
Yes: Satisfied is already a stage of the one funnel model (`computeFunnel`), fed by the bet's `satisfied_event`. The
rating is an ordinary event through `/api/v1/track` via the SDK (rule #1); the score rides in `tags.score`; the bar
rides the existing roadmap push beside `satisfied_event`. No new table, no new route, no migration.

## Architecture lock (D1–D7, verified against live code 2026-10-17)
- **D1 — the event.** `satisfaction_rated`, `featureId` = the flag key, the score in `tags.score` (integer 1–5). Defined
  once in the SDK (`packages/sdk/src/satisfaction.ts`, zero imports) and mirrored in `apps/web/lib/flag-funnel.ts`,
  pinned equal by a spec (the app's lib is zero-import too, like `FLAG_EVALUATED_EVENT`).
- **D2 — the call follows the client's user** (deviation from the pitch's `{ flagKey, userId, score }`): every SDK send
  uses the configured/identified user (`track`, `trackAdoption`), so the call is `rateSatisfaction(flagKey, score,
  props?)`. A bad key or score returns `{ ok: false, code: 'INVALID_SATISFACTION' }`, never throws, never sends.
- **D3 — the bar is `satisfied_min_score`**, integer 1–5 or null (null = 4), a BET field beside `satisfied_event` in
  the kit contract (`BET_FIELDS`, `validateBet`), the extractor, the scaffolder + both templates, the app's push schema,
  `hub-board.ts`'s `BetMeasureCard`, and `FunnelMeasure.satisfiedMinScore` (optional, so every existing measure
  literal stays valid). Source of the kit side: `skills/template/scripts/` → copied to `scripts/`, `skills/scripts/`
  and the plugin vendors (`render-hook-vendor.mjs`); parity checks enforce it.
- **D4 — the read.** Only when `satisfiedEvent === 'satisfaction_rated'` is the score read: a retained person counts if
  their LATEST `satisfaction_rated` at/after adoption has `score ≥ bar`. Any other event: unchanged (any answer), bar
  ignored. `readMeasureEvents` adds `score:tags->>score`; `toEvent` parses it to a number or null. No migration.
  **Found at build:** a flag's measure read is not `feature_id`-scoped, so the standard rating counts only when its
  `featureId` is the bet's flag key; otherwise one flag's rating would satisfy every flag's bet.
- **D5 — the gate.** `bets.satisfaction_ask_enabled`, a `GATES` row (enablement, fallback false), read only by the
  console prompt. `rateSatisfaction` needs no gate (it is `track`).
- **D6 — the dogfood prompt** sends through the real SDK client server-side (rule #1) with the
  `SELF_PROJECT_API_KEY` self-tracking path the console already uses. **Amended at build:** "answered" is a cookie
  in the member's browser (`lib/satisfaction-ask.ts`), not a read of their events: re-querying `events` on a request
  path to decide a UI hint is the ad-hoc read rule #1 keeps out, and a member asked again on a new browser costs
  nothing (the funnel counts their latest answer).
- **D7 — SDK and kit releases.** SDK minor bump (add-only, `surface-freeze.test.ts`); plugin + kit minor bump with a
  CHANGELOG section and `plugin-checksums.mjs`. npm publish of the SDK is Daniel's 2FA step (owed).

## What already exists (reuse, don't rebuild)
- `apps/web/lib/flag-funnel.ts` → `computeFunnel`, `FunnelMeasure`, `FunnelEvent`.
- `apps/web/lib/flag-funnel-read.ts` → `readMeasureEvents` (already fetches `satisfiedEvent`).
- `apps/web/lib/hub-board.ts` → the bet's measure from the pushed row.
- `apps/web/lib/roadmap-artifact-schema.ts` → `satisfied_event` (the bar sits beside it).
- Kit: `skills/plugins/golden-frijoles/{hooks,skills/refine}/vendor/lib/roadmap-contract.mjs`, `roadmap-extract.mjs`,
  `scaffold-epic.mjs`, `templates/{scope-seed,epic-README}.md` (already carry `satisfied_event`).
- `packages/sdk` → `track`, `surface-freeze.test.ts` (add-only).
- `apps/web/lib/gates.ts` + `gates-decision.ts → GATES`.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 The SDK sends a rating | low |
| 1 | S1.2 Each bet sets its bar (push contract, kit + app) | high |
| 1 | S1.3 The funnel reads the score | low |
| 1 | S1.4 We ask our own members about funnel trends | low |
| 1 | S1.5 The SDK README recipe | low |

## Deploy order
One PR, no migration. The app accepts `satisfied_min_score` before (or with) the kit emitting it; the field is nullish
on both sides so older pushers stay valid. The kit side is a plugin release (`skills/RELEASING.md`). The gate
`bets.satisfaction_ask_enabled` is created in every env; production on after the dogfood smoke. The SDK publish to npm
is Daniel's 2FA step.

## Definition of Done (epic)
- [x] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [x] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [x] This README marked ✅; every sprint status ticked with commit refs
- [x] `RETROSPECTIVE.md` written
- [x] Product poster (`Roadmap/README.md`) updated
- [x] Team memory + `MEMORY.md` index updated
- [x] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [x] **Kill-switch (only if one was planned at refining — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and its switch is set there** —
      `frijoles flags get <key>` must print `on vN` or `off vN` in its PRODUCTION row (a bare `off` with no version
      means nothing is served there, so the app runs on its own built-in default). A newly synced flag goes live as written in its file; a sync never switches an existing one. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [x] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
