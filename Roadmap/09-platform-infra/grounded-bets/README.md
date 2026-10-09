---
status: in-progress  # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-09T17:22:15Z"
slug: grounded-bets
title: "Grounded bets: every Why is a hypothesis traced from the North Star"
area: 09-platform-infra
risk: low
type: feature
sprints_total: 2
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 85   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 17    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 32
quote_basis: "M, n=17, p25–p75"
hypothesis: "We believe that a refine that writes every Why as a hypothesis traced from the North Star, and challenges an ask that names no input, for founders turning an idea into an epic, will raise grounded bets from 0% to 60% of the features funded by 30 November, because today nothing asks which input a bet moves and the strategy files sit unread at the gate. We'll know when a funded bet records grounded: true with a North Star input, a target and a read date."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "grounded_bets_share"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 0.6       # to what, a number
read_date: 2026-11-30       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
build_order: 75      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Grounded bets: every Why is a hypothesis traced from the North Star

> **Area:** 09-platform-infra · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/grounded-bets.md`](../../00-ideas/seeds/grounded-bets.md)
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
We believe that a refine that writes every Why as a hypothesis traced from the North Star, and challenges an ask that
names no input, for founders turning an idea into an epic, will raise grounded bets from 0% to 60% of the features funded
by 30 November, because today nothing asks which input a bet moves and the strategy files sit unread at the gate. We'll
know when a funded bet records `grounded: true` with a North Star input, a target and a read date.

Our own North Star is *Proven bets*; `grounded_bets_share` is its depth input. In October none of the bets in
`wave-2026-10.md` targeted a North Star input (0 of 14 when this was refined).

## Platform-first note
The engine already models this: `grounded_bets_share` is a registered input of the `golden-frijoles` project
(`valueSource: external_push`, no readings yet), fed by `POST /api/v1/inputs/<key>/values`. The hypothesis and the result
record already travel seed → epic → roadmap push → epic page, band and Outcome report. This epic adds the cascade that
writes them, one recorded field, and the count. No engine route or migration.

## What already exists (reuse, don't rebuild)
- `refine/strategy.mjs` (inputs, highest domino), `references/{result-record,strategy,gates,question-bank}.md`,
  `templates/scope-seed.md`, `scaffold-epic.mjs` (copies the result record), `fund.mjs` + `Roadmap/bets/`
- `apps/web/lib/roadmap-artifact-schema.ts` (`hypothesis` + target declared), `hooks/vendor/roadmap-extract.mjs`
- The band's Why line (`hooks/vendor/build-state.mjs`), the epic page's "Why we're building this" (`epic-components.tsx`)
- `.github/workflows/roadmap-push.yml` (already holds `SELF_PROJECT_API_KEY` on pushes to `main`)
- `frijoles flags create --description` (already supported)

## Architecture lock (D1–D9)
- **D1 · The record.** Seed and epic frontmatter gain `grounded: true | false | null` (null = never asked: every bet
  refined before this epic), `grounded_reason` (required with `false`, one sentence) and `persona` (who, doing which
  job). Bugs and Chores leave `grounded` null and are not counted (D3). `scaffold-epic` copies all three, as it copies the
  result record.
- **D2 · Grounded is derived, the field is the founder's word.** A bet counts as grounded when its `target_metric` is one
  of the project's North Star input keys (as `strategy.mjs` reads them) and `target_from` and `target_to` are set; a
  blank `read_date` counts (the 30-day default). `grounded: true` without that target is reported as a problem, never
  counted. So the October baseline needs no backfill: old bets are measured by their targets.
- **D3 · The share.** Per calendar month: the bets whose seed's `underwritten_by:` names a ledger `wave-YYYY-MM…`
  (the stamp `fund.mjs` writes; the month from that name; `wave-backfill` excluded), read as the seed overlaid by the
  epic README, minus Bugs and Chores (`type:`); share = grounded ÷ counted, four decimals. A month with no counted bets
  prints "no bets" and pushes nothing. *(Amended at build: the lock said the ledger's rows, but their shape changed over
  the months and epic READMEs carry no stamp; each bet's own stamp counts every bet once.)*
- **D4 · The push.** `bets-grounded.mjs --push` posts `{ occurredOn: today (UTC), value: <this month's share> }` to
  `/api/v1/inputs/grounded_bets_share/values` with the same key and URL resolution as `roadmap-push.mjs`; a missing key
  is a clean skip. It pushes only when the project's North Star has a `grounded_bets_share` input, so a stranger's
  project never posts to an input it lacks. Plain `fetch`, not the SDK: the kit is zero-dependency and a root script must
  not need a built package (sdk-1-0's learning); the route contract is the one `pushInputValues` uses. The route is
  append-only per day, so the first push of a day stands; the run says so when a later one differs. Run from
  `roadmap-push.yml` on pushes to `main` only.
- **D5 · The reader.** `strategy.mjs` adds `persona` (Target audience → **Now**) and `job` (Problem to solve →
  **Outcome**), each clipped to one sentence, and reads both label shapes in use: `**Now:** text` (the template) and
  `**Now: text** more` / `**Outcome.** text` (our agreed narrative). An unfilled `<…>` is skipped, as today.
- **D6 · The cascade** replaces Stage 1.5's single question (`references/result-record.md`, renamed in place to "The bet
  at Stage 1.5"): trace (input, persona and job, mechanism, evidence) → draft the sentence → or challenge with two or
  three reframes taken from the strategy → the founder picks or overrides. **One challenge per seed, never a block.**
  Fake precision is refused: "no baseline yet" is a valid *from* when the read establishes it.
- **D7 · No strategy.** `references/strategy.md`'s "never ask for a strategy" becomes one offer per seed to run
  `strategy`'s North Star chapter; a decline records `grounded: false — no strategy yet`.
- **D8 · The Plan gate.** "We bet that …" becomes the sentence (`We believe that … for … will … because … We'll know
  when …`), and a `Grounded ..... yes | no — <reason>` line follows Moves. Bugs and Chores show
  `Why: keeps <X> working` and no Grounded line. `check-gate-words` keeps passing (plain words).
- **D9 · Where else the Why goes.** The roadmap push and schema carry `grounded` and `grounded_reason` (nullish, so an
  older pusher stays valid); the epic page shows "Grounded: no — <reason>" under the Why only when false. Stage 6b's
  `frijoles flags create` line passes `--description "<hypothesis, clipped> (epic <slug>)"`. Plugin and kit release
  1.1.0 (additive). The CLI's kit pin moves with its next release (not here).

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 The reader names the persona and the job; the bet sentence at Stage 1.5 | low |
| 1 | S1.2 The challenge, the override and Bug/Chore | low |
| 1 | S1.3 The Plan gate shows the bet and its grounding; no strategy offers the North Star once | low |
| 2 | S2.1 `grounded` through scaffold, push, schema and the epic page | low |
| 2 | S2.2 `bets-grounded.mjs` computes the share and pushes it from `main` | low |
| 2 | S2.3 The flag description carries the hypothesis; plugin + kit 1.1.0 | low |

## Deploy order
One PR, both sprints (no stack). Plugin + kit publish (Daniel's 2FA) after the gate is green; the console change
deploys with the merge; the first share push runs on the merge to `main`.

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at refining — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and is ACTIVATED there** —
      `frijoles flags get <key>` must not print `—` in its PRODUCTION row. Creating a definition is not
      turning it on, and a flag that is synced but never activated serves compile-time defaults while
      every dashboard says it exists. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
