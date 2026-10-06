---
epic: result-record
sprint: 1
title: "The target, set at grooming"
risk: low
phase: Shaping
stories_total: 3
stories:
  - id: S1.1
    title: "Every epic carries its hypothesis, target and read date"
    as_a: "a founder"
    i_want: "every epic to carry its hypothesis, target and read date"
    so_that: "what it should move is written down before it's built"
    risk: low
    status: planned
  - id: S1.2
    title: "Groom asks which number, by how much, by when"
    as_a: "a founder grooming"
    i_want: "to be asked which number, by how much and by when, with my North Star inputs offered"
    so_that: "the epic is grounded"
    risk: low
    status: planned
  - id: S1.3
    title: "The target and verdict reach the Hub"
    as_a: "a founder"
    i_want: "the target and the verdict to reach the Hub"
    so_that: "every page can show expected against actual"
    risk: low
    status: planned
---
# The result record — Sprint 1: The target, set at grooming

**Status:** ⬜ not started

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 1.1 — Every epic carries its hypothesis, target and read date
**As** a founder, **I want** every epic to carry its hypothesis, target and read date, **so that** what it should move
is written down before it's built.
Seed and epic README templates gain `hypothesis`, `target_metric`, `target_from`, `target_to`, `read_date`, and the
verdict fields `verdict`, `verdict_actual`, `verdict_evidence`, `verdict_at` (null until the read).
`scripts/lib/roadmap-contract.mjs` and `doc-format` know their types (`verdict` ∈ proven · disproven · unclear;
dates as YYYY-MM-DD). `scaffold-epic.mjs` copies the target from the seed, as it does `quote:`.
**Acceptance:**
- A newly scaffolded epic carries the seed's target fields.
- `verdict: provn` fails the contract; a missing target is allowed (shown as "no target"), never an error.
**Risk:** low

### Story 1.2 — Groom asks which number, by how much, by when
**As** a founder grooming, **I want** to be asked which number, by how much and by when, with my North Star inputs
offered, **so that** the epic is grounded.
Groom Stage 1.5 adds the question; the choices come from `strategy.mjs`'s agreed inputs when there are any, free text
otherwise ("not grounded"). The read date defaults to 30 days after shipping. The gate's bet block shows hypothesis,
target and read date.
**Acceptance:**
- Grooming a pitch asks the question once and writes the answers into the seed.
- With a North Star, its inputs are offered by name; without one, free text works.
**Risk:** low

### Story 1.3 — The target and verdict reach the Hub
**As** a founder, **I want** the target and the verdict to reach the Hub, **so that** every page can show expected
against actual.
`roadmap-extract.mjs` reads the fields (beside `finopsFields`) and derives the default read date from `shipped_at`
(+30 days, cap 90), marked as derived. `roadmap-artifact-schema.ts` declares them, nullish and bounded. The Hub's
query exposes them for epics 5 and 6.
**Acceptance:**
- A push carrying the fields stores them; a push without them still succeeds.
- A bad `verdict` value is refused with a readable 400.
- An epic with no `read_date` shows the derived one, labelled as derived.
**Risk:** low

## Sprint QA
- **api spec(s):** S1.1 → `roadmap-contract.test.mjs`, `scaffold-epic.test.mjs`; S1.2 → the groom skill checks;
  S1.3 → `roadmap-extract` tests, `roadmap-push.test.mjs`, a schema spec for the new fields.
- **browser smoke owed:** no (data path); the walkthrough below is in the terminal.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge. Low risk: merge on green.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. In the repo, groom a tiny idea
   → Groom asks which number, by how much and by when, and offers your North Star inputs.
2. Approve it
   → The new epic README carries hypothesis, target and read date.
3. Run `node scripts/roadmap-push.mjs`
   → The push succeeds.
4. Go to https://goldenfrijoles.com/hub/<your-project>/board and open the epic's card
   → Nothing new is shown yet (epics 5 and 6 show it); the push response lists the fields as received.

If any step fails, note the step number + what you saw — that's the bug report.
