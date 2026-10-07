---
epic: one-epic-page
sprint: 1
title: "One page"
risk: low
phase: In review
stories_total: 3
stories:
  - id: S1.1
    title: "Every card opens one epic page"
    as_a: "a founder"
    i_want: "every card to open one epic page"
    so_that: "I never see two versions of an epic"
    risk: low
    status: done
  - id: S1.2
    title: "Where the epic is, at a glance"
    as_a: "a founder"
    i_want: "to see where the epic is at a glance"
    so_that: "I don't read to find out"
    risk: low
    status: done
  - id: S1.3
    title: "One next command, in plain words"
    as_a: "a founder"
    i_want: "one next command I can paste into any agent"
    so_that: "I don't have to know our shorthand"
    risk: low
    status: done
---
# One epic page — Sprint 1: One page

**Status:** 🟦 In review

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 1.1 — Every card opens one epic page ✅ 9c9f042
**As** a founder, **I want** every card to open one epic page, **so that** I never see two versions of an epic.
`/hub/<p>/board?card=<e>` redirects to `/hub/<p>/epic/<e>`, with the board's filters kept in the page's back link.
`CardView`'s parts (stage, stats, commands, kickoff copy, docs) move to the epic page, and `CardView` goes. The
Roadmap, the workspace board and ⌘K link to the epic page. Seeds (Backlog, Grooming) get the page too: "The idea"
and "No target yet: that comes with grooming", no sprints, no flag.
**Acceptance:**
- Every card, Roadmap row, workspace card and ⌘K epic opens `/hub/<p>/epic/<e>`.
- An old `?card=` link, with or without filters, lands on the page; Back returns to the filtered board.
- A seed's page opens and says "No target yet".
**Risk:** low

### Story 1.2 — Where the epic is, at a glance ✅ 1e3d87d
**As** a founder, **I want** to see where the epic is at a glance, **so that** I don't read to find out.
Title and a stage chip; small chips for area, risk (high says "you merge"), appetite and build order, replacing the
four tiles and seven stats; a stage track Backlog · Grooming · Ready · Building · QA · Shipped · Read (Read lit when a
verdict exists); the freshness line ("Every number comes from the epic's README and git · updated …"). Stage words
come from launch epic 3's label module.
**Acceptance:**
- The track marks the right stage for each of the seven.
- Risk high shows "you merge"; no tiles remain.
**Risk:** low

### Story 1.3 — One next command, in plain words ✅ becee78
**As** a founder, **I want** one next command I can paste into any agent, **so that** I don't have to know our
shorthand.
A Now panel: an icon, when, one line on what's happening, and one command with Copy; the rest under More. At Ready the
kickoff copy stays the head action. `lib/stage-commands.ts` returns plain lines that name the step, the epic and the
product, e.g. "Wrap sprint 2 of the overdue-reminders epic in Ledgerly", "Groom the overdue-reminders idea in
Ledgerly", "Review pull request #42 for the overdue-reminders epic in Ledgerly". The shorthand keeps working.
**Acceptance:**
- Each stage shows exactly one command, with the rest under More.
- Every plain line, pasted into Claude Code with the plugin, starts the same step its shorthand does
  (`SESSION-KICKOFFS.md`); the builder records each try in the PR.
**Risk:** low

## Build contract (locked by the architect before the builder started)
Cites the epic README's lock; nothing here restates it.
- **1.1:** D1 (the page reads `findCard`), D2 (`getHubRoadmap` returns the project id), D3 (redirect + Back, every
  link site), D4 (`CardView` and `hub-board-card` retire). Specs: `hub-board.test.ts` (FinOps keys pinned), an authed
  spec on the redirect with and without filters, a seed page, a 404.
- **1.2:** D6 — `lib/epic-page.ts` + `epic-page.test.ts` (one case per stage, Read lit only with a verdict).
- **1.3:** D7, D8 — `stage-commands.test.ts`: one primary per stage, every line names step, epic and product and
  begins with its shorthand's verb; the paste-into-an-agent trial recorded in the PR.
- D5: no approved surface is added or edited; the page's blocks are asserted by name in the authed spec.

## Sprint QA
- **api spec(s):** S1.1 → `hub-board.test.ts` and an authed spec on the redirect; S1.2 → a pure-logic spec on the track
  position; S1.3 → `stage-commands` unit test (one per stage, every line names step, epic, product).
- **browser smoke owed:** yes, to Daniel: the walkthrough below.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge. Low risk: merge on green.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Signed in, go to https://goldenfrijoles.com/hub/<your-project>/board and click a Building card
   → The epic page opens at /hub/<your-project>/epic/<epic>.
2. Look at the top
   → Title, a Building chip, small chips, and the stage track with Building lit.
3. Click Copy in the Now panel and paste it into Claude Code in the repo
   → The agent starts that step for that epic.
4. Open More
   → The other commands for this stage, as plain lines.
5. Paste an old link, /hub/<your-project>/board?card=<epic>
   → It lands on the same epic page.
6. Open a Backlog card
   → "The idea" and "No target yet: that comes with grooming".

If any step fails, note the step number + what you saw — that's the bug report.
