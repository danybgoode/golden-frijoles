---
title: "Build view upgrade"
slug: build-view-upgrade
status: scaffolded
area: "02-commercial"
type: feature
appetite: S
underwritten_by: wave-2026-10
risk: low
epic: "02-commercial/build-view-upgrade"
build_order: 70
updated: 2026-10-05
intent_ask: verbatim   # verbatim = the product owner's own words below · proxy = reconstructed after the fact
intent_match: null     # 2026-10-05: could not look, jev unreachable (F28). Written by `node scripts/intent-match.mjs <this seed> --write` (groom Stage 3.5) — advisory
---

# Pitch — Build view upgrade

Moves: grounded_bets_share · Tests: Value proposition — the build view is what a founder watches while the agent
builds; it should say why, how far and where to look (launch epic 8 of
[`audits/ux-ui-audit-2026-10.md`](../audits/ux-ui-audit-2026-10.md); dogfood F41).

## The ask, as given

> lets continue as planned, what i see while agent is building. consider that we have a claude mode in the cli that
> shows context, it also shows a link to golden-frijoles online to visualize and what i see there is working pretty
> good, so review it first

> is this a redesign of the Claude mod, and if so add a "why are we building this" section (hypothesis, quantitative
> and qualitative), simplify, use graphics, and drop the You and Next lines

(Daniel, 2026-10-05, UX audit session, on the canvas Band frame.)

### Claims
1. The build view says why we're building this: the hypothesis and the number, from → to, with the read date.
2. Progress shows by sprint, as bars.
3. The stage shows as a track in plain words.
4. The link opens this epic's page, in this project.
5. Keep what works today; simplify, graphics before text.

**Teach-back:** yes — "You want the build view you already like to add why we're building it, progress by sprint and
a stage track, and to link to the epic's own page in your project instead of the demo. Right?"

## Problem
The build view works (Daniel's words) but says nothing about why the epic exists, shows progress as one count, shows
the stage as a sentence ("Building · from git: … · phase Verifying"), and links to the board's card view in the demo
project (F41: `golden-frijoles.config.json` sets `board.hubUrl` to `/hub/golden-beans-demo`).

## Appetite
**S**, one sprint, one builder. If it runs out, ship the Why line and the link; leave the bars.
quote: $8–19 (S, n=5, p25–p75)

## Outcome & signal
While an epic builds, the view shows: Epic (title, area, risk) · Why (hypothesis; metric from → to; read date) · Story
(id, title and its "As a…, I want…, so that…") · Progress (one bar per sprint, "4 of 9 stories done · Sprint 2 of 3")
· Spend (as today) · Status (a stage track, "live from git") · Board (as today) · and a link to the epic page.
**Test:** start building an epic; the view says why, how far, and its link opens the epic page in your project.

## Stage-2.5 bucket
**Light enhancement.** All the data exists: `scripts/build-state.mjs` already resolves epic, story, progress, spend,
status and board, and renders `lines` the mod shows as-is (`hooks/build-view.mjs`, `index.tsx`). The target and read
date come from launch epic 4, the epic page from launch epic 5, the stage words from launch epic 3. New: three lines
reshaped and one link changed.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| A Why line: hypothesis, metric from → to, read date | Why we're building this, on screen while it builds |
| The Story line with its user story | What this story gives a person |
| Progress as one bar per sprint | How far, at a glance |
| Status as a stage track (Grooming ─ Ready ─ ◉ Building ─ QA ─ Shipped), "live from git" | Where it is, in plain words |
| The link to `<hub>/epic/<slug>` | The epic's one page |
| This repo's `board.hubUrl` checked against the project it pushes to | F41: the link opens the right project |

## Scope
**In v1:** the four line changes and the link in `build-state.mjs`'s `lines`; every copy in step (this repo's script,
the template's, the hook vendor); this repo's `board.hubUrl`.

**Out of v1 (no-gos):**
- Removing a line that's there today: Spend and Board stay. (The canvas Band drops the Board line; that's for Daniel
  to decide, not this epic.)
- The You and Next lines: already gone.
- Questions waiting in the status bar, or any new data.
- The mod's runtime (refresh, cache, key): unchanged.
- Styling beyond characters the terminal already renders.

## Rabbit holes
- **The mod renders `lines` as-is.** All changes live in `build-state.mjs`; the mod gains nothing (its own D3).
- **Width.** Lines must fit a narrow terminal: truncate the hypothesis, never wrap the track.
- **No target, no Why.** An epic groomed before launch epic 4 shows "Why · no target set", never an invented line.
- **Copies.** `scripts/build-state.mjs`, `skills/template/scripts/build-state.mjs` and `hooks/vendor/build-state.mjs`
  (rendered by `render-hook-vendor.mjs`) stay identical; the parity checks must pass.
- **The link.** Built from `board.hubUrl` (https only, as today) plus `/epic/<slug>`; no hub URL, no link.
- **This repo's project.** Daniel thinks this repo's data has been recorded to `golden-beans-demo` all along
  (2026-10-05). The lock checks which project this repo pushes to (`roadmap-push`, `SELF_PROJECT_SLUG`) and points
  `board.hubUrl` there; if it is `golden-beans-demo`, F41 becomes a naming note, not a bug. Never guessed.

## What already exists (reuse, don't rebuild)
- `scripts/build-state.mjs` (`lines`, `--json`, the board line and URL at `board.hubUrl`), `scripts/build-state.test.mjs`.
- `skills/plugins/golden-frijoles/hooks/{build-view.mjs,index.tsx,vendor/}`, `skills/scripts/render-hook-vendor.mjs`,
  `skills/template/scripts/build-state.mjs`, `scripts/check-script-parity.mjs`.
- `golden-frijoles.config.json` (`board.hubUrl`), `scripts/lib/config-registry.mjs`.
- From launch epics 3, 4, 5: stage words, target and read date, the epic page.
- Design source: the private canvas, page 4: Band (proposed) and BandNow (today).

## Visuals

```surface
state: build-view-building
route: terminal · build view
- line "◆ Epic  Overdue reminders · invoices · ▲ risk HIGH"
- line "│ Why   A polite reminder gets more invoices paid on time · paid on time 61% ━━▸ 71% · read 4 Dec"
- line "▸ Story S2.2 — Send the first reminder three days after the due date · As a freelancer, I want a reminder sent for me, so that I get paid without chasing."
- line "▰ Progress ▰▰▰ │ ▰▱▱ │ ▱▱▱  4 of 9 stories done · Sprint 2 of 3"
- line "$ Spend ▰▰▰▰▱▱▱▱▱▱ ≈$6.10 of quote $7–16 (S) · 4 sessions"
- line "● Status Grooming ─ Ready ─ ◉ Building ─ QA ─ Shipped · live from git"
- line "○ Board Building 1 · QA 2 · Ready 4 · next: …"
- link "open epic ↗ https://goldenfrijoles.com/hub/<project>/epic/overdue-reminders"
```

## UX heuristics & rails check
- **CI guards covering this surface:** `build-state.test.mjs`, `build-view.test.mjs`, `build-view.mod.test.ts`,
  `check-script-parity.mjs`, `render-hook-vendor.test.mjs`.
- **Audits-lens findings that apply:** dogfood F41; Daniel's "drop the You and Next lines" (done).
- **Design-language debt:** none.

## Kill-switch / runtime gate
Not needed: risk low (terminal text). Rollback is a revert and a plugin release.

## Slices (stories, risk, QA)

**Sprint 1 · Why, how far, and where.**
- **S1.1 · low.** As a founder watching a build, I want to see why we're building it, so that the work stays tied to
  the number. The Why line, and the Story line with its user story. *QA:* `build-state.test.mjs` with and without a
  target; width truncation.
- **S1.2 · low.** As a founder watching a build, I want progress by sprint and the stage as a track, so that I see how
  far at a glance. *QA:* `build-state.test.mjs` per stage and per sprint state.
- **S1.3 · low.** As a founder, I want the view's link to open this epic's page in my project, so that one click shows
  the whole epic. `<hub>/epic/<slug>`; this repo's `board.hubUrl` checked at the lock against the project it pushes to. *QA:*
  `build-state.test.mjs` on the link; parity checks across the three copies.

**Smoke walkthrough:** owed by Daniel, in Claude Code with the plugin, while an epic builds.

## Acceptance criteria
- The view shows Why (or "no target set"), the story with its user story, a bar per sprint, the stage track, and Spend
  and Board as today.
- The link opens `/hub/<project>/epic/<slug>` in the project this repo pushes to.
- All three copies of `build-state.mjs` are identical; the tests and parity checks pass.

## Open risks / research
- None external.
