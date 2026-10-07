---
status: in-progress  # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-07T01:50:48Z"
slug: result-record
title: "The result record"
area: 02-commercial
risk: low
type: feature
sprints_total: 2
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 22    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=8, p25–p75"
build_order: 65      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: The result record

> **Area:** 02-commercial · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/result-record.md`](../../00-ideas/seeds/result-record.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at grooming (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
Nothing records whether an epic paid off (F37): no target, no read date, no verdict. So the Outcome report can't say
which epics paid off, the epic page can't show its result, and the North Star, Proven bets, can't be counted (F16).
This epic makes every newly groomed epic say up front which number it should move, from what to what, and when we
read it; on that date the agent drafts an evidenced verdict, Proven, Disproven or Unclear, and the product owner
approves it. The record lives in the epic file and reaches the Hub the way FinOps spend does. Launch epic 4 of
[`audits/ux-ui-audit-2026-10.md`](../../00-ideas/audits/ux-ui-audit-2026-10.md).
Moves: grounded_bets_share · Tests: Value proposition.

**Signal:** groom a small epic with a read date a day out; ship it; next day run the read, approve it, see the bean on
the board.

## Platform-first note
The repo is the system of record for planning; the Hub reads what `roadmap-push` sends, stored as a JSON payload (no
migration). FinOps already uses this path for `quote_*` and `actual_*`; the result record follows it field for field.
Evidence comes from records the platform already keeps: A/B decision records and North Star readings. Golden
Frijoles's own North Star count is out of scope.

## What already exists (reuse, don't rebuild)
- FinOps path: `scripts/epic-actuals.mjs` (`--write` stamps the README), `scripts/roadmap-extract.mjs`
  (`finopsFields`), `apps/web/lib/roadmap-artifact-schema.ts`, `lib/roadmap-finops.ts`, `scripts/roadmap-push.mjs`.
- `skills/plugins/golden-frijoles/skills/groom/` (`SKILL.md` Stage 1.5 and the gate's bet block, `scaffold-epic.mjs`,
  `templates/scope-seed.md`, `strategy.mjs`), `scripts/lib/roadmap-contract.mjs`, `scripts/doc-format.mjs`.
- Evidence: `apps/web/lib/experiment-decision-query.ts`, `experiment-decision-contract.ts`, `lib/north-star-query.ts`,
  `packages/cli/src/commands/north-star.ts`.
- Reminders and display: `scripts/session-resume.mjs`, `apps/web/lib/today-bands.ts`, `lib/hub-board.ts` and the
  board card; epic 1's Bean.
- Rules: `Roadmap/00-strategy/north-star.md` (read date default 30 days after shipping, cap 90; the evidence ladder).

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Every epic carries its hypothesis, target and read date | low |
| 1 | S1.2 Groom asks which number, by how much, by when | low |
| 1 | S1.3 The target and verdict reach the Hub | low |
| 2 | S2.1 The read: drafted by the agent, approved by you | low |
| 2 | S2.2 Read due, in the terminal and on Today | low |
| 2 | S2.3 The result as a bean on the board card | low |

**Fields:** `hypothesis`, `target_metric`, `target_from`, `target_to`, `read_date` (set at grooming); `verdict`
(proven · disproven · unclear), `verdict_actual`, `verdict_evidence`, `verdict_at` (set at the read).

**No-gos:** counting Golden Frijoles's own North Star · bulk backfill (one-at-a-time owner reads stay possible) · the
epic page's and Outcome report's displays (epics 5 and 6) · automatic verdicts · a new table or API · groom's gate
wording (epic 7).

**Rabbit holes** (detail in the seed): the default read date derived in one place, never written back silently ·
evidence or it doesn't count; a read after 90 days is marked late · works without an account · `target_metric`
names a North Star input when there is one, free text shown as "not grounded" · the seed holds the target until the
scaffold, then the README · the contract knows the fields · kit and plugin release flow.

**Flag:** none. Risk low. Rollback is a revert.

## Architecture lock (2026-10-06, verified against live code and data)

**Live data the lock read.** 0 epic READMEs and 0 seeds carry any target or verdict field today. The docs-only
extract has 67 epics, 54 of them Shipped, all 54 with a `shipped_at`. So a default read date applied to every
shipped epic would raise 54 "read due" lines on day one: that is the bulk backfill the no-gos rule out (D5 stops it).

**Scope the live system disproves (corrected out loud):**
- **"Epic 1's Bean" does not exist.** `night-garden-design-system` is still `status: scaffolded`; no Bean component is
  in `apps/web`. **Amendment, Daniel 2026-10-06:** S2.3 builds the Bean to night-garden S2.1's own spec (four kinds,
  three sizes, its word for screen readers, gold only on Proven) in today's tokens; night-garden later re-skins it and
  adds the specimen (D11).
- **`gf` cannot fetch evidence.** No `gf` command and no API route reads North Star readings or A/B decision records
  for a key: `gf north-star` only sets, `GET /api/v1/north-star` lists metrics and inputs with no values, and the
  decision history is read only by a Server Action in the console. A new read API is a no-go here. So `epic-read`
  always takes the actual and its pointer from the owner; with a project key it checks the metric against the
  project's real inputs through the existing `GET /api/v1/north-star` (D8). Fetching readings is a follow-up.

**Decisions:**
- **D1 · The fields and the contract live once, in `scripts/lib/roadmap-contract.mjs`.** `RESULT_FIELDS` =
  `hypothesis` (string), `target_metric` (string: a North Star input key or free text), `target_from`, `target_to`
  (finite numbers, either sign), `read_date` (`YYYY-MM-DD`), `verdict` ∈ `VERDICTS` = proven · disproven · unclear,
  `verdict_actual` (finite number), `verdict_evidence` (string), `verdict_at` (`YYYY-MM-DD`). `validateResultFields(fm)`
  reports `contract-result-invalid` and is called from `validateEpicFrontmatter`, beside `validateFinopsFields`. All
  absent is fine (no target). **A target is `target_metric` + `target_from` + `target_to` together** (fresh review,
  #290: a partial one would never come due); `read_date` only with them. Also refused: a from equal to its
  to; a date that is not a real calendar day; any `verdict_*` field without a `verdict`; a `verdict` without
  `verdict_at` and `verdict_evidence`; proven or disproven without a numeric `verdict_actual` and a pointer (D2).
- **D2 · The evidence pointer, offline, is a grammar.** `EVIDENCE_POINTER_RE` (in the contract): an `https://` URL,
  `north-star:<input_key>@YYYY-MM-DD` (that input's reading on that day) or `ab:<experiment_key>` (that experiment's
  A/B decision record). Offline strictness is syntax only; that is the open judgement the seed left to the lock.
  Unclear takes a reason in `verdict_evidence` (free text, non-empty) and may carry a pointer too.
- **D3 · The seed holds the target in its frontmatter until scaffold.** `templates/scope-seed.md` gains the five
  target keys (null). `scaffold-epic.mjs` copies each one through `readField` into the README frontmatter (strings
  quoted, numbers and dates bare), the way it copies `build_order`; `templates/epic-README.md` carries all nine keys,
  the verdict ones born null. Scaffold copies, it does not judge: a bad value is reported by `doc-format`'s contract
  on the README, as a bad quote is.
- **D4 · Groom asks once, at Stage 1.5, beside the appetite.** "Which number, from what to what, read when?" The
  choices are the input keys `strategy.mjs` already prints (it gains a `Target:` line naming them); with no North
  Star, free text, which readers mark "not grounded". The read date may stay blank: blank means 30 days after
  shipping, derived (D5). The Bet block in `references/funding.md` gains one line: `Target: <hypothesis> · <metric>
  <from> → <to> · read <date | 30 days after ship>`. Gate wording beyond that line is epic 7's.
- **D5 · Extract derives; it never writes back.** `resultFields(fm, shippedAt)` in `roadmap-extract.mjs`, beside
  `finopsFields`, reading the field list from the contract. Numbers coerce like `finopsFields` (a bad value is null,
  never 0); a bad enum or date is null. Derived fields: `read_date_derived: true` when `read_date` is absent, the
  epic **has a target** (`target_metric` set) and is shipped, and then `read_date` = `shipped_at` + 30 days;
  `read_late: true` when `verdict_at` is more than 90 days after `shipped_at`. An epic with no target gets no derived
  date and is never "due" (it can still be read by hand, one at a time). The shared date arithmetic is one pure
  module, `scripts/lib/result-dates.mjs` (`READ_DEFAULT_DAYS = 30`, `READ_CAP_DAYS = 90`, `addDays`, `isLate`,
  `readDue`), imported by extract, `epic-read` and `session-resume`.
- **D6 · The push schema declares them, nullish and bounded.** `roadmap-artifact-schema.ts` row: `hypothesis` ≤ 1000,
  `target_metric` ≤ 200, `target_from`/`target_to`/`verdict_actual` finite numbers, `read_date`/`verdict_at` matching
  `YYYY-MM-DD`, `read_date_derived`/`read_late` booleans, `verdict` = `z.enum(['proven','disproven','unclear'])`,
  `verdict_evidence` ≤ 500. No `schemaVersion` bump (older pushers stay valid). A bad verdict is the existing 400
  "Malformed roadmap payload" with its field named in `issues`.
- **D7 · The Hub read is one framework-free module, `apps/web/lib/roadmap-result.ts`**, the `roadmap-finops.ts`
  pattern: `epicResult(row, { today, inputKeys? })` → hypothesis, metric, from, to, read date (+ derived), verdict,
  actual, evidence, verdict date, late, `grounded` (true/false against `inputKeys`, null when not given), `readDue`,
  and `bean` (proven · disproven · unclear · growing; growing = shipped with a target and no verdict yet; null
  otherwise); `epicResultsFromArtifact(payload, opts)`; `readsDue(payload, today)`. `READ_DEFAULT_DAYS` is a copy
  pinned to the script's by a spec (the `ROADMAP_STAGES` precedent: app code does not import `scripts/`).
- **D8 · `scripts/epic-read.mjs --epic <slug>` drafts; `--write` is the approval.** In the kit closure (both script
  trees). Inputs are flags, never a prompt (an agent asks the owner in conversation and passes them): `--actual <n>`,
  `--evidence <pointer|reason>`, `--verdict <kind>` (owner override), `--today` (tests). Before the read date it
  prints when the read is due and exits 0 without drafting. The draft rule is pure (`draftVerdict`): direction from
  `target_from` → `target_to`; reached or passed → proven, otherwise disproven; no actual → unclear needing a reason.
  `--write` stamps the four `verdict_*` fields with `stampFrontmatter` (moved from `epic-actuals.mjs` into
  `scripts/lib/frontmatter-stamp.mjs`, re-exported there), only after running the same `validateResultFields` the
  contract runs, so a refused verdict never lands. No target: an owner verdict with `--verdict` and `--evidence`,
  one epic per run. Late (> 90 days) is written and said; the extract marks it (D5). With a project key
  (`apiKeyFrom` from `roadmap-push.mjs`) it GETs `/api/v1/north-star` and says whether `target_metric` is one of the
  inputs; without a key, or on any failure, it says "could not check" and carries on.
- **D9 · `session-resume` prints one line per due read**, from `buildRows` docs-only (no network): `[read-due] Read
  due: <title> · since <d Mon> · run node scripts/epic-read.mjs --epic <slug>`, through the existing anomaly list
  (`decideReadsDue(rows, today)`). A read is due when the epic has a target, no verdict, and today ≥ its read date.
- **D10 · Today's "Read due" is a derived item, not a task.** The lock's choice the sprint left open: a task would be
  a write made by a read path and would outlive the verdict that answers it; a derived line disappears when the push
  carrying the verdict lands. `CommandCenter` reads the latest roadmap artifact (`getLatestArtifact`, failing soft
  to no lines) and lists `readsDue` under Waiting on you; that band renders when signals is on **or** a read is due.
- **D11 · The Bean is a design-system component**, `apps/web/design-system/bean.tsx`: `<Bean kind size />`, kinds
  proven · growing · disproven · unclear, sizes 18 · 24 · 36, `role="img"` with its word as the label. Gold only on
  proven, red (the Ember stand-in until night-garden) only on disproven. Shipped board cards with a target show it
  plus one line, `from → actual (target to)`. Classes `ds-bean*`, declared where the defined-classes guard expects.
- **D12 · Release.** S1 changes `plugins/**` (groom) and the kit closure (contract, extract) → plugin + kit 0.31.0;
  S2 (`epic-read`, `session-resume`) → 0.32.0, each with its CHANGELOG section (`skills/RELEASING.md`).
- **D13 · Two script trees, one file.** Every change under `scripts/` that also exists in `skills/template/scripts/`
  is made byte-identically in both (`check-script-parity.mjs`).

**Routing.** Low risk throughout and one session in this checkout: the architect builds in place on
`feat/result-record` → `feat/result-record-s2`. Reviews per `review-route.mjs`.

### Build contract — Sprint 1 (locked by the architect before the builder started)
1. D1 + D2 in `roadmap-contract.mjs`; specs in `roadmap-contract.test.mjs` (`verdict: provn` fails; no target passes).
2. D3: both templates + `scaffold-epic.mjs`; spec in `scaffold-epic.test.mjs` (seed target → README).
3. D4: `SKILL.md` Stage 1.5, `references/funding.md` Bet block, `strategy.mjs` `Target:` line (+ its test).
4. D5: `scripts/lib/result-dates.mjs` + `resultFields` in extract; specs: derived read date, no target → none.
5. D6 schema + spec (bad verdict → 400 with the field named; push without fields still ok); D7 `roadmap-result.ts` +
   its unit spec.
6. D12 0.31.0 + CHANGELOG; D13 parity.

### Build contract — Sprint 2 (locked by the architect before the builder started)
1. D8 `epic-read.mjs` (both trees) + `epic-read.test.mjs`: before-date stop, never writes without `--write`,
   proven/disproven without pointer refused, late marked, no-key and with-key (stubbed fetch) runs.
2. D9 `decideReadsDue` in `session-resume.mjs` + its test.
3. D10 Today: `readsDue` lines in Waiting on you; `today-bands`-style unit spec on `readsDue`.
4. D11 Bean + board card line; board spec + the visual gate.
5. D12 0.32.0 + CHANGELOG; D13 parity.

## Deploy order
Sprint 1: the contract and templates, then extract and the push schema (nullish, so older pushers keep working), then
the Hub read. Sprint 2: the kit script, then the reminders and the board card. Merge on green; the kit and plugin
release follows `skills/RELEASING.md`.

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at grooming — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and is ACTIVATED there** —
      `gf flags get <key>` must not print `—` in its PRODUCTION row. Creating a definition is not
      turning it on, and a flag that is synced but never activated serves compile-time defaults while
      every dashboard says it exists. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at grooming, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
