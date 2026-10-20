---
epic: landing-launch-experiment
sprint: 5
title: "White-glove"
risk: low
phase: Building
stories_total: 2
stories:
  - id: S5.1
    title: "/talk becomes Set up with us"
    as_a: "a founder who wants it done with their team"
    i_want: "one page that says what the session is, what I leave with and the price"
    so_that: "I can book without a sales call first"
    risk: low
    status: done   # 4eab9df, ef476c7 · founder-site link owed (no URL in the repo to point at)
  - id: S5.2
    title: "Cross-links"
    as_a: "a visitor"
    i_want: "the founder note and the third tier to lead to the same page"
    so_that: "the offer is never a dead end"
    risk: low
    status: done   # 5119dc5 · the résumé hook change is a PR in miyagisanchez-resume, outside this repo
---
# Launch: the first landing A/B on goldenfrijoles.com, run on Golden Frijoles — Sprint 5: White-glove

**Status:** 🟦 In review — PR #410 (ships ahead of Sprint 4; independent of billing)

## Stories

### Story 5.1 — /talk becomes Set up with us
**As a** founder who wants it done with their team, **I want** one page that says what the session is, what I leave with and the price, **so that** I can book without a sales call first.
**Acceptance:**
- What the session is, what you leave with, "from $1,500", the Cal.com embed kept at its measured height (LEARNINGS: porting a page means porting its measurements), one link to the founder's site.
- Each session's first bet is placed with a read date, so it can count toward `proving_workspaces`.
**Risk:** low

### Story 5.2 — Cross-links
**As a** visitor, **I want** the founder note and the third tier to lead to the same page, **so that** the offer is never a dead end.
**Acceptance:**
- B's founder note and third tier point at `/talk`.
- The résumé hook change (its own line instead of "Ship work that matters") is a PR in `miyagisanchez-resume`, named in the close-out — not in this repo.
**Risk:** low

## Build contract (locked by the architect before the builder started)
Re-verified at the wave-3 boundary. Bounded copy and links: a Sonnet builder on its own worktree (README D17). The
booking embed keeps its measured height; links to `/talk` only.

**Decision (Daniel, 2026-10-19, on #410):** A's third tier ("Pods — priced after we talk") contradicted the new `/talk`
("from $1,500") and would have sent A's visitors to B's offer. It is aligned NOW, before launch: both arms show "Set up
with us · from $1,500" → `/talk`, so the A/B test compares the story, not the offer. A's markup pin was regenerated for
exactly this edit (the diff is the third tier only). `/talk` also says its calendar books a 20-minute first conversation,
not the session itself.

## Sprint QA
- link check over B and /talk
- browser smoke owed: yes, to Daniel — book a test slot
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 5 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the PR preview while testing pre-merge)

1. https://goldenfrijoles.com/talk
   → Set up with us: the session, what you leave with, from $1,500, the calendar
2. Book a slot
   → Cal.com confirms
3. On B, click the founder note's conversation link and the third tier
   → both land on /talk

If any step fails, note the step number + what you saw — that's the bug report.
