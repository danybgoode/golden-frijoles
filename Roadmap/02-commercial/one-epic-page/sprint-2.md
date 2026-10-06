---
epic: one-epic-page
sprint: 2
title: "Why, progress, flag and spend"
risk: low
phase: Shaping
stories_total: 3
stories:
  - id: S2.1
    title: "Why we're building this"
    as_a: "a founder"
    i_want: "the page to say why we're building it"
    so_that: "the bet is in front of me"
    risk: low
    status: planned
  - id: S2.2
    title: "Progress, one bar per sprint"
    as_a: "a founder"
    i_want: "progress as one bar per sprint"
    so_that: "I see it without reading"
    risk: low
    status: planned
  - id: S2.3
    title: "Flag, spend and documents"
    as_a: "a founder"
    i_want: "the epic's flag, spend and documents on the page"
    so_that: "nothing about it lives somewhere I forget"
    risk: low
    status: planned
---
# One epic page — Sprint 2: Why, progress, flag and spend

**Status:** ⬜ not started

## Stories
<!-- Keep the heading shape `### Story 2.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 2.1 — Why we're building this
**As** a founder, **I want** the page to say why we're building it, **so that** the bet is in front of me.
The README's Why (the pushed `goal`), the hypothesis, the target metric from → to, and the read date (derived dates
labelled), from launch epic 4. Once read: the bean, the actual and "target was …". With no target: "No target set"
for an epic, "No target yet: that comes with grooming" for a seed.
**Acceptance:**
- A building epic shows hypothesis, target and read date; a read epic adds the bean and the actual; gold only on Proven.
**Risk:** low

### Story 2.2 — Progress, one bar per sprint
**As** a founder, **I want** progress as one bar per sprint, **so that** I see it without reading.
One row per sprint: number, title, done/total and a bar (Moonlight in progress, Sprout done), replacing the sprint
list and the card's steps.
**Acceptance:**
- Bars match each sprint's done/total; a seed shows "Sprints appear once it's groomed".
**Risk:** low

### Story 2.3 — Flag, spend and documents
**As** a founder, **I want** the epic's flag, spend and documents on the page, **so that** nothing about it lives
somewhere I forget.
`flag_key` is written at grooming Stage 6b when a flag is decided, copied by `scaffold-epic`, extracted and pushed
(nullish). The page reads that key from this project's registry only and shows its state with "Open in Ship"
(`/app/flags/<p>/<key>`); no change happens here. No flag: "No flag" and, when the pitch says why, that line. Unknown
key: "Flag <key> not found". Spend: actual against quote as a bar, with "FinOps" to its row. Documents: The idea, The
epic, Sprints, Retrospective.
**Acceptance:**
- An epic with a flag shows its state and opens it in Ship; one without says so; a wrong key says not found.
- Spend shows actual against quote, or "not measured yet".
- Every document link opens.
**Risk:** low

## Sprint QA
- **api spec(s):** S2.1 and S2.2 → the visual gate for a seed, a building epic and a read epic; S2.3 → extract and push
  tests for `flag_key`, the scaffold test, an authed spec for flag found, not found and none.
- **browser smoke owed:** yes, to Daniel: the walkthrough below.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge. Low risk: merge on green.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Signed in, open a Building epic's page
   → "Why we're building this" with hypothesis, target and read date; one bar per sprint.
2. Find the flag line and click Open in Ship
   → The flag's own page, at /app/flags/<your-project>/<key>.
3. Back on the epic page, click FinOps beside the spend
   → Its FinOps row.
4. Open a read epic's page
   → The bean, the actual and "target was …".
5. Open each document
   → Each opens.

If any step fails, note the step number + what you saw — that's the bug report.
