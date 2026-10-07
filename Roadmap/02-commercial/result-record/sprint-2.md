---
epic: result-record
sprint: 2
title: "The read"
risk: low
phase: In review
stories_total: 3
stories:
  - id: S2.1
    title: "The read: drafted by the agent, approved by you"
    as_a: "a founder"
    i_want: "my agent to draft the verdict with its evidence on the read date, and me to approve it"
    so_that: "the result is evidenced and mine"
    risk: low
    status: done
  - id: S2.2
    title: "Read due, in the terminal and on Today"
    as_a: "a founder"
    i_want: "to be told when a read is due"
    so_that: "I don't have to remember"
    risk: low
    status: done
  - id: S2.3
    title: "The result as a bean on the board card"
    as_a: "a founder"
    i_want: "the result as a bean on the board card"
    so_that: "I see what paid off at a glance"
    risk: low
    status: done
---
# The result record — Sprint 2: The read

**Status:** 🟦 In review

## Stories
<!-- Keep the heading shape `### Story 2.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 2.1 — The read: drafted by the agent, approved by you
**As** a founder, **I want** my agent to draft the verdict with its evidence on the read date, and me to approve it,
**so that** the result is evidenced and mine.
`scripts/epic-read.mjs --epic <slug>` (shipped in the kit, like `epic-actuals.mjs`). It reads the target, then the
evidence: with an account, the A/B decision record and the North Star reading for `target_metric` through `gf`;
without one, it asks for the actual and a link. It drafts Proven (target met), Disproven (missed) or Unclear (with a
reason, such as too little traffic) and shows the draft. `--write` stamps `verdict`, `verdict_actual`,
`verdict_evidence`, `verdict_at` only after approval. Proven and Disproven need a resolvable pointer; a read more than
90 days after shipping is recorded and marked late. A shipped epic with no target can be read with an owner verdict
and a link, one at a time.
**Acceptance:**
- Before the read date it says when the read is due and stops.
- It never writes without approval; Proven or Disproven without evidence is refused.
- It works with and without an account.
**Risk:** low

### Story 2.2 — Read due, in the terminal and on Today
**As** a founder, **I want** to be told when a read is due, **so that** I don't have to remember.
`session-resume` prints one line per due read ("Read due: Overdue reminders · since 4 Nov · run epic-read"). Today
shows "Read due" under Waiting on you, from the pushed fields; the lock decides whether that's a derived item or a
task in the Agent queue.
**Acceptance:**
- A due read shows in both places until it's written; then it's gone.
**Risk:** low

### Story 2.3 — The result as a bean on the board card
**As** a founder, **I want** the result as a bean on the board card, **so that** I see what paid off at a glance.
Shipped cards show epic 1's Bean: Growing until read, then Proven (gold), Disproven or Unclear, with "from → actual
(target)" in one line.
**Acceptance:**
- Each kind renders on its card with its word for screen readers; gold only on Proven.
**Risk:** low

## Sprint QA
- **api spec(s):** S2.1 → `epic-read.test.mjs` (the draft rule, before-date stop, never writes without `--write`,
  evidence refused, late, owner verdict, CLI runs with no key and with a stubbed engine; `gf` cannot fetch evidence,
  see the lock); S2.2 → `session-resume.test.mjs` (`decideReadsDue`, the gap) and `readsDue` in
  `roadmap-result.test.ts` (the lock put Today's derivation there rather than in `today-bands.test.ts`, which is the
  task queue's); S2.3 → `hub-board.test.ts` (`toCard`, the key pin), `design-system/bean.test.ts` (gold only on
  proven) and `e2e/bean.spec.tsx` (each kind, each size, its word; the card line). The visual gate is unchanged: no
  fixture epic carries a target, so no route renders a bean yet (said out loud, not hidden).
- **browser smoke owed:** yes, to Daniel: the walkthrough below.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge. Low risk: merge on green.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Ship a tiny epic whose read date is today, then start a session in the repo
   → "Read due: <epic>" in the session's opening lines.
2. Go to https://goldenfrijoles.com/app
   → Today shows "Read due" for that epic under Waiting on you.
3. Run `node scripts/epic-read.mjs --epic <slug>`
   → It shows the actual, the evidence and a drafted verdict, and asks you to approve.
4. Approve, then push the roadmap
   → The README carries the verdict; Today no longer lists the read.
5. Go to https://goldenfrijoles.com/hub/<your-project>/board
   → The card shows the bean and "from → actual (target)".

If any step fails, note the step number + what you saw — that's the bug report.
