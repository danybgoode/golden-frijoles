---
epic: outcome-report-v2
sprint: 1
title: "Is it paying off"
risk: low
phase: Shipped
stories_total: 3
stories:
  - id: S1.1
    title: "Is it paying off: the sentence and the chart"
    as_a: "a founder"
    i_want: "the report to open by saying whether the product is paying off"
    so_that: "I know before I read anything else"
    risk: low
    status: done
  - id: S1.2
    title: "Four figures, each against expected"
    as_a: "a founder"
    i_want: "four figures, each against what I expected"
    so_that: "I see the summary in one look"
    risk: low
    status: done
  - id: S1.3
    title: "The epics table"
    as_a: "a founder"
    i_want: "every epic's bet, expected and actual, result and spend in one table"
    so_that: "I see which paid off and what each cost"
    risk: low
    status: done
---
# Outcome report v2 — Sprint 1: Is it paying off

**Status:** ✅ shipped and live 2026-10-07 (#299, merge `08386f0`)

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 1.1 — Is it paying off: the sentence and the chart ✅ `bf2b144`
**As** a founder, **I want** the report to open by saying whether the product is paying off, **so that** I know before
I read anything else.
A pure module builds the expected series from shipped epics' targets: an epic targeting the North Star moves its
expected line from `target_from` to `target_to` by its read date; an epic targeting an input moves that input's line.
The chart shows the North Star's actual against expected, with each epic marked (as its bean) where it shipped. One
sentence above it: ahead of, on, or behind the pace you planned, or "No targets yet, so we can't say if it's on pace".
**Acceptance:**
- With grounded epics, the chart shows both lines and the sentence matches the gap.
- With none, it shows the actual only and says it can't tell yet; no invented line.
**Risk:** low

### Story 1.2 — Four figures, each against expected ✅ `3a2ac95`
**As** a founder, **I want** four figures, each against what I expected, **so that** I see the summary in one look.
North Star now against expected (with the gap) · epics that paid off, of those read (with how many aren't read yet) ·
spend against the summed quote (within, or "▲ … over …", neutral) · cost per epic that paid off. Each figure has one
line on what it is. Spend figures are team-only in v1.
**Acceptance:**
- Each figure shows its expected value or says there isn't one.
- A client or investor share link shows the first two figures only, and still counts unread epics.
**Risk:** low

### Story 1.3 — The epics table ✅ `b42610b`
**As** a founder, **I want** every epic's bet, expected and actual, result and spend in one table, **so that** I see
which paid off and what each cost.
Columns: Epic · what we bet (hypothesis under the name) | Metric · expected → actual (metric name in the column, gap) |
Result (bean) | Spend · vs quote (gap; overspend neutral). Each row links to its epic page. Team-only in v1.
**Acceptance:**
- Column names show; every row links to its epic page; overspend is not red.
- The table is absent on client and investor share links; the lens test proves it.
**Risk:** low

## Built (against the README's lock)
- `lib/outcome-expected.ts` (D1, D2) — grounded epics only, per metric; no line without a grounded epic; pace ±5%.
- `lib/outcome-figures.ts` (D3, D4) — the four figures and the table rows, read through `epicResult`/`epicFinops`.
- `lib/pod-report-lens.ts` (D5) — `showSpend`, `showEpicsTable`, `showLinks`, `showAgentPrompt` (team only);
  `applyPayingOffLens` copies the sentence, lines, figure 1 and figure 2 (with its unread count) first.
- `lib/pod-report-query.ts` (D6) — `getPodReportByProjectId` reads the roadmap and the North Star; a failed read is
  `payingOff.unavailable`. `app/hub/outcome-components.tsx` (D7) renders it inside the document, after the caveats.
- **Deviation, said out loud:** the Answer keeps the ladder headline after the new sentence (the verdict + its
  not-instrumented count stay on the first screen, `pod-report-surface.spec.tsx`'s pairing test); S2.2 moves the
  ladder's explanation into its own section.
- Mutation check: opening the epics table to the client lens fails both `pod-report-lens.test.ts` and the surface spec.

## Sprint QA
- **api spec(s):** S1.1 → pure-logic specs on the expected series (none, one, several; input vs North Star); S1.2 →
  the figures' spec and a lens test; S1.3 → the table's spec and a lens test (absent for client and investor, honesty
  counts present).
- **browser smoke owed:** yes, to Daniel: the walkthrough below.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge. Low risk: merge on green.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Signed in, go to https://goldenfrijoles.com/hub/golden-beans-demo/report
   → One sentence on whether it's paying off, then the chart with epics marked.
2. Read the four figures
   → Each has its expected value or says there isn't one.
3. Scroll to the epics table and click an epic
   → Its epic page opens.
4. Make a client share link from Setup › Share links and open it signed out
   → The sentence, the chart and two figures; no spend, no epics table; unread epics still counted.

If any step fails, note the step number + what you saw — that's the bug report.

### Verified live (signed out, 2026-10-07, after `075ff8e` deployed)
`https://goldenfrijoles.com/hub/golden-beans-demo/report` → 200. Opens "No targets yet, so we can't say if it's on pace."
(prod has 0 targeted epics), the `setup_guide_completions` chart (actual only), figure 1 says nothing is expected,
"0 of 0 … 0 not read yet", "$891 spent on 22 epics · $270 of it within $245–445 · 12 not quoted", 22 table rows linking
to `/hub/golden-beans-demo/epic/<slug>`. **Owed to Daniel:** steps 1–3 signed in, and step 4 (minting a client share
link is a prod credential, so it's his).
