---
epic: one-epic-page
sprint: 2
title: "Why, progress, flag and spend"
risk: low
phase: Shipped
stories_total: 3
stories:
  - id: S2.1
    title: "Why we're building this"
    as_a: "a founder"
    i_want: "the page to say why we're building it"
    so_that: "the bet is in front of me"
    risk: low
    status: done
  - id: S2.2
    title: "Progress, one bar per sprint"
    as_a: "a founder"
    i_want: "progress as one bar per sprint"
    so_that: "I see it without reading"
    risk: low
    status: done
  - id: S2.3
    title: "Flag, spend and documents"
    as_a: "a founder"
    i_want: "the epic's flag, spend and documents on the page"
    so_that: "nothing about it lives somewhere I forget"
    risk: low
    status: done
---
# One epic page — Sprint 2: Why, progress, flag and spend

**Status:** ✅ Shipped — #297, merged 9b83399 2026-10-07, deployed to production and verified

## Stories
<!-- Keep the heading shape `### Story 2.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 2.1 — Why we're building this ✅ e388099
**As** a founder, **I want** the page to say why we're building it, **so that** the bet is in front of me.
The README's Why (the pushed `goal`), the hypothesis, the target metric from → to, and the read date (derived dates
labelled), from launch epic 4. Once read: the bean, the actual and "target was …". With no target: "No target set"
for an epic, "No target yet: that comes with grooming" for a seed.
**Acceptance:**
- A building epic shows hypothesis, target and read date; a read epic adds the bean and the actual; gold only on Proven.
**Risk:** low

### Story 2.2 — Progress, one bar per sprint ✅ bbe3bbc
**As** a founder, **I want** progress as one bar per sprint, **so that** I see it without reading.
One row per sprint: number, title, done/total and a bar (Moonlight in progress, Sprout done), replacing the sprint
list and the card's steps.
**Acceptance:**
- Bars match each sprint's done/total; a seed shows "Sprints appear once it's groomed".
**Risk:** low

### Story 2.3 — Flag, spend and documents ✅ 8799b11, f50bcd0
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

## Build contract (locked by the architect before the builder started)
Cites the epic README's lock; nothing here restates it.
- **2.1:** D9 — through `epicResult` only. **2.2:** D10 — SVG bars, `--blue`/`--green`.
- **2.3:** D11 (`flag_key`/`flag_note` through seed → scaffold → extract → contract → schema; template is the source,
  copies rendered; plugin + kit 0.34.0), D12 (the registry seam, this project only, production headline), D13, D14.
- D7's template copy of the `SESSION-KICKOFFS.md` plain-lines note ships here, inside the 0.34.0 skills release (S1
  changed only this project's copy; fresh review, #295).
- Specs: extract + contract + schema tests for both fields, the scaffold test, an authed spec for flag found, not
  found and none (fixture flags created in the fixture project).

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

**Verified live 2026-10-07 (signed out, the public demo, by the builder):** `result-record`'s page shows "Why we're
building this", "No target set.", three green bars at 3/3 (step 1's bars), "No flag" with the README's own line, and
spend "Quote $22–34 · Actual ≈$42.44 (+25%)" in red with FinOps → `/app/finops/golden-beans-demo#epic-result-record`
(3); every document link renders (5). Kit + plugin 0.34.0 published (npm + tag). **Owed:** step 2 (Open in Ship)
cannot pass on prod yet — the only roadmap tenant holds no flags; it lands with `one-product-project` (seed). Step 4
(a read epic) waits for the first verdict on prod; the authed fixture proves it. Steps 1–5 signed in owed to Daniel.

If any step fails, note the step number + what you saw — that's the bug report.
