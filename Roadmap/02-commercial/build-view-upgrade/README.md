---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-08T01:42:45Z"
slug: build-view-upgrade
title: "Build view upgrade"
area: 02-commercial
risk: low
type: feature
sprints_total: 1
stories_total: 4   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 8    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 19
quote_basis: "S, n=5, p25–p75"
build_order: 70      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Build view upgrade

> **Area:** 02-commercial · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/build-view-upgrade.md`](../../00-ideas/seeds/build-view-upgrade.md)
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
The build view works, in Daniel's words, but it doesn't say why the epic exists, shows progress as one count, shows the
stage as a sentence, and links to the board's card view in the demo project (F41). This epic adds a Why line
(hypothesis, metric from → to, read date), the story's "As a…, I want…, so that…", one progress bar per sprint, a stage
track in plain words, and a link to the epic's own page. Spend and Board stay as they are. Launch epic 8 of
[`audits/ux-ui-audit-2026-10.md`](../../00-ideas/audits/ux-ui-audit-2026-10.md). Moves: grounded_bets_share · Tests:
Value proposition.

**Signal:** start building an epic; the view says why and how far, and its link opens the epic page.

## Platform-first note
No new data. `scripts/build-state.mjs` already resolves every fact and renders the `lines` the mod shows as-is; the
target and read date come from launch epic 4, the epic page from launch epic 5, the stage words from launch epic 3.

## What already exists (reuse, don't rebuild)
- `scripts/build-state.mjs` (`lines`, `--json`, the board line and `board.hubUrl`), `scripts/build-state.test.mjs`.
- `skills/plugins/golden-frijoles/hooks/{build-view.mjs,index.tsx,vendor/}`, `skills/scripts/render-hook-vendor.mjs`,
  `skills/template/scripts/build-state.mjs`, `scripts/check-script-parity.mjs`.
- `golden-frijoles.config.json` (`board.hubUrl`), `scripts/lib/config-registry.mjs`.
- Design source: the private canvas, page 4: Band (proposed) and BandNow (today).

## Locked decisions (2026-10-08, verified against live code and data)

Scope the live system corrected, said out loud:
- **The mod does not render `lines` fully as-is.** `hooks/index.tsx` draws the Progress bar itself from the text's
  "N of M stories have commits" (`progressOf`), and colours Status with `toneOf`, whose `/shipped/` test would mark a
  track containing "Shipped" good at every stage. So S1.2 changes `build-view.mjs` + `index.tsx` too, not only the
  resolver.
- **The Story line's user story already exists** (`renderLines`, "As …, I want …, so that …" on the second line). S1.1
  adds the Why line only.
- **No epic carries a target today.** `grep target_metric: Roadmap/*/*/README.md` → one README (`first-run-setup`),
  every field `null`. So "Why · no target set" is what every epic shows on day one, this one included.
- **`board.hubUrl` is already `https://goldenfrijoles.com/hub/golden-beans-demo`**, and
  `/hub/golden-beans-demo/epic/build-view-upgrade` answers 200 with this epic on prod. The project question is
  answered: no config change, only the link's path changes.
- **There are four tracked copies of `build-state.mjs`**, not three: `scripts/`, `skills/scripts/`,
  `skills/template/scripts/` and `hooks/vendor/` (plus the gitignored kit build in `skills/kit/dist/`). All stay
  byte-identical (parity check + vendor render).
- **Addendum from Daniel at the kickoff (2026-10-08), added as S1.4:** the session line under the prompt
  (`Session 48% · 5h 78% · 7d 46%`) colours each figure green → yellow → red and shows the time to each window's reset:
  `5h 78% (-2h)`, `7d 46% (-3d)` (hours at 24 h or less). `$.ui.status` takes plain text only (the engine's type:
  `status(text: string | undefined)`), so a coloured line needs a render site.

- **D1 Why line (S1.1).** Read from the epic README's `hypothesis`, `target_metric`, `target_from`, `target_to`,
  `read_date` (result-record's `TARGET_FIELDS`). With a target: `Why      <hypothesis, clipped to fit>` then a
  continuation `<metric> <from> ━━▸ <to> · read 4 Dec` (`read 30 days after shipping` with no `read_date`; the year is
  added when it is not the current one). A hypothesis with no target: the hypothesis, then `no target set`. Neither:
  `Why      no target set`. Seeds (no epic) get no Why line. Every Why/continuation line ≤ 80 columns (clipped with …).
- **D2 Progress (S1.2).** `Progress  ▰▰▱│▱▱▱ 2 of 6 stories done · in flight S1.2 · Sprint 1 of 2`: one cell per story,
  sprint by sprint in build order, `▰` for a story with a commit (the same measure as live-build-view D9: "done" here
  means "has a commit", nothing new is inferred), `▱` otherwise, `│` between sprints. A sprint wider than 8 cells is
  scaled to 8. The mod draws the resolver's own glyphs (▰ green, ▱ and │ dim) and no longer computes a bar.
- **D3 Status track (S1.2).** `Status   Grooming ─ Ready ─ ◉ Building ─ QA ─ Shipped`, the stage words from
  `lib/stage.mjs` (`Ready to build` → `Ready`; `To groom` is prepended as `Backlog` only when it is the stage). The
  Locking-architecture refinement marks Building as `◉ Locking`. The source keeps today's words on a continuation line
  under it, `from git: feat/x (live) · phase Shaping` (amended at the build: beside the track it pushed the line past
  80 columns and the band would cut the PR number off). No stage → the old written-phase line, unchanged. The mod's
  Status tone reads the marked word (after `◉`) and draws that word bold in its tone, the rest dim.
- **D4 The link (S1.3).** `↗ <board.hubUrl>/epic/<slug>` when an epic or seed is in flight and the board has a row for
  it; `↗ <board.hubUrl>/board` otherwise. https only, none without a hub URL — as today.
- **D5 Session line colours + resets (S1.4).** In `session-budget.mjs` (one table, beside THRESHOLDS): a figure is
  green below 60 %, yellow from 60 %, red from the hand-off line (context 80 %, 5 h 90 %, 7 d 90 %).
  `figuresFromMeasure` also reads each window's `resetsAt`; the reset reads `(-40m)` under an hour, `(-2h)` up to
  24 h, `(-3d)` beyond (whole units, rounded down, never `-0`); a missing or past `resetsAt` shows no reset. The plain
  `sessionLine` text keeps the same words (Cowork's line, the log) and the verdict logic is untouched.
- **D6 Where the coloured line draws.** A `ui.render` hook on `PromptHint` (the dim hint line under the prompt) wraps
  the engine's own drawing (`next(e)`) and adds a coloured row under it, computed at draw time from the figures in
  `$.state` (`golden-frijoles.sessionFigures`, declared in `types/index.d.ts`); a one-minute clock redraws it so the
  reset countdown moves. On an engine without `$.state` the plain `$.ui.status` line is the session line, rewritten by
  the same clock. Never both. *Amended at review (#312):* the key is `sessionFigures`, not `sessionLine`; a hint hook
  that throws makes the engine draw its own hint (no session row) rather than falling back, accepted for an advisory
  line; a question waiting shows before the first measurement; a hot reload reads the kept figures back.
- **D7 Copies.** Edit `scripts/build-state.mjs`, then copy to the other three tracked copies (`skills/kit/dist/` is
  build output, gitignored); re-render the hook vendor;
  `check-script-parity.mjs` and `render-hook-vendor.test.mjs` green.
- **D8 Release.** Plugin + kit 0.40.0, CHANGELOG, `plugin-checksums.mjs`, one PR (low risk, one sprint).
- **D9 No flag, no migration, no new data.** Rollback is a revert plus a version bump.

### Sprint 1 build contract
`scripts/build-state.mjs` (D1–D4) + its four copies · `hooks/build-view.mjs` (progress/track parsing, D2/D3) ·
`hooks/index.tsx` (bar from glyphs, Status track, PromptHint session line, D2/D3/D6) ·
`skills/groom/session-budget.mjs` (D5) · `hooks/types` / plugin `types/index.d.ts` (D6) · tests:
`build-state.test.mjs`, `build-view.test.mjs`, `session-budget.test.mjs`, `build-view.mod.test.ts`.
Builder: the architect, in place (one small sprint).

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Why we're building it, while it builds | low |
| 1 | S1.2 Progress by sprint, and the stage as a track | low |
| 1 | S1.3 The link opens the epic's page | low |
| 1 | S1.4 The session line in colour, with time to reset (Daniel's kickoff addendum) | low |

**No-gos:** removing Spend or Board (the canvas drops Board; Daniel's call, not this epic's) · new data or a
"questions waiting" marker · the mod's refresh, cache and key · styling beyond what the terminal renders.

**Rabbit holes** (detail in the seed): the mod renders `lines` as-is, so every change lives in `build-state.mjs` ·
narrow terminals: truncate, never wrap the track · no target means "no target set" · three identical copies · the
link only with an https `board.hubUrl` · which project this repo pushes to is checked at the lock (Daniel thinks
`golden-beans-demo`), never guessed.

**Flag:** none. Risk low. Rollback is a revert and a plugin release.

## Deploy order
One PR, merge on green; the hook vendor is re-rendered in the same PR, and the plugin release follows
`skills/RELEASING.md`.

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
