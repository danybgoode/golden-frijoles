---
status: in-progress  # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building      # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: live-build-view
locked_at: "2026-10-03T20:34:34Z"   # stamped by hand this once — scripts/epic-phase.mjs (S2.3, D10) does it from here on
title: "Live build view: the band moves while the agent works, from facts no agent writes"
area: 09-platform-infra
risk: high
type: feature
sprints_total: 2
stories_total: 7   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 89   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 23    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=5, p25–p75"
build_order: 55      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Live build view: the band moves while the agent works, from facts no agent writes

> **Area:** 09-platform-infra · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/live-build-view.md`](../../00-ideas/seeds/live-build-view.md)
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
The build view exists so the product owner always knows what is being built. Today it shows real data only when a
human sends a message, and an epic-at-once build is one message long. So it froze on "No epic in flight" for all of
portfolio-view. Its story and progress also depend on how an agent words a commit, and the fixes we ship to it never
reached the installed plugin. After this epic the band moves while the agent works, and every rung from the
architecture lock on is set by a trigger (a commit, a script, a PR), never by an agent deciding to write it. The
kickoff gets one home, the `/build` command, so nobody saves it to a folder again.

## Platform-first note
No engine data is touched: this is the plugin (the mod, its bundled resolver, the kit's git hooks and groom). The
system of record for build state stays git + the epic docs' frontmatter + the PR snapshot `gatherFacts` already
writes. AGENTS rule 1 does not apply (no telemetry); the Hub's stage resolver is read, never changed.

## Architecture lock (2026-10-03, verified against live code, the installed plugin and this repo's git history before any builder started)

**What the lock read live:** Claude Code **2.1.288** on this machine; the plugin installed at user + project scope is
**0.24.0** (`~/.claude/plugins/installed_plugins.json`), the local marketplace clone is **0.24.0**
(`~/.claude/plugins/marketplaces/golden-frijoles`, last pulled 2026-10-03 19:25), and golden-frijoles/skills has
published **0.24.1** (tag `v0.24.1`), so today's band would show no drift row even though a newer release exists.
`claude plugin validate` passes on 2.1.288 and `claude plugin test` finds no `*.test.ts`, and **CI pins 2.1.278 with
`CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`** (`.github/workflows/skills-ci.yml`, generated). Roadmap/ here is 446 files in 90
directories, and `git rev-parse` + `git worktree list --porcelain` together take 14 ms. In history, **15 of 179**
feat/fix subjects name a story id at all, and 2 name two (`S2.2-2.4`, `Story 2.2/2.4`). The engine has a
`extraKnownMarketplaces.<name>.autoUpdate` field and syncs it from settings (read from the 2.1.288 binary). The mods API
(`claude-code.d.ts` of 2.1.288) has `$.clock.every(ms, fn)` and `after`, whose timers are dropped by the engine on a
module reload. It also has `$.command.register` (in `session.start`) answered by `command.run` → `{ text }`,
`$.prompt.fill({ text })` → `{ isFilled }`, and `$.fs.list(dir)` with `mtimeMs` per entry.

### Decisions (the builder cites these; nothing below is restated elsewhere)
- **D1 — One check, three triggers.** `turn.start`, a `tool.call` hook on `Bash` (after `await next(e)`) and a
  `$.clock.every(30_000)` started in `session.start` all call the same check: compute the key and resolve OFFLINE only
  when it changed (or the view aged past `MAX_AGE_MS`, kept). A module flag `checking` makes a check that finds one
  running return at once, so none overlap. The engine drops the timer on reload (documented), and the fresh
  `session.start` starts one new timer.
- **D2 — The key (restores build-visualization-claude-mods D4).** One `git worktree list --porcelain` covers this
  checkout's HEAD + branch AND every other worktree's, so there is no second git call. On top of that, the newest
  FILE `mtimeMs` under `<root>/Roadmap` from a `$.fs.list` walk, capped at 2 000 entries. **(Amended at build:**
  `$.fs.list` reports `kind: 'dir'` with `mtimeMs` 0 for directories, so a deleted doc is not seen until
  `MAX_AGE_MS`, which moves from 15 s to 5 min as a backstop: at 15 s every 30 s tick would re-resolve.) The root comes from `turn.start`'s existing `rev-parse`,
  held in the module variable it already sets (`repoRoot`). The tick and the Bash hook do nothing until a turn has set
  it. Pure `keyFrom(porcelain, newestMtime)` and `newestMtimeOf(entries)` live in `build-view.mjs`. The cost of
  one check is measured inside `claude plugin test` on this repo and written in the PR (target ≤ 50 ms).
- **D3 — Online, off the turn's path.** A second timer, `$.clock.after(60_000)` then `$.clock.every(300_000)`, runs the
  bundled resolver WITHOUT `--offline` (`gatherFacts` live mode writes `.golden-frijoles/board.json`). It has a 60 s
  timeout (gatherFacts' own budgets are 20 s + 30 s), writes the view from that run's lines, and stores it under the
  current key. A Bash call whose command runs `git push` or `gh pr (create|ready|merge|close)` also schedules ONE such run
  with `$.clock.after(0)`: queued, never awaited, so the tool call returns first. **(Deviation, named:** the story asked
  only for the timer. Without the push trigger a freshly pushed branch reads Ready to build for up to 5 min.) A run
  whose JSON says `facts_mode !== 'live'` logs once per load and keeps the last snapshot.
- **D4 — "In review" is the stage resolver's `QA` (corrected, C1).** The Status row has come from `lib/stage.mjs` since
  board-sinks-and-scrumban, and its vocabulary has no "In review". An open, non-draft PR is **QA**, and a draft PR is
  **Building** (`github: PR #N draft`). S1.2 delivers QA from a ready PR. `stage.mjs` is not changed (platform-first
  note).
- **D5 — The drift row.** Installed = the mod's own `../.claude-plugin/plugin.json` (`$.fs.read`, located from
  `import.meta.url` like `VENDOR_BUILD_STATE`). Published = when that path matches
  `…/plugins/cache/<mkt>/<plugin>/<ver>/`, the file `…/plugins/marketplaces/<mkt>/plugins/<plugin>/.claude-plugin/plugin.json`
  (the marketplace's own `source` layout, read from `marketplace.json` in this clone). A `--plugin-dir` or dev load has
  no such path, so it gets no row. The row shows only when published is a HIGHER semver: a newer dev copy is not
  "older". The text is `Plugin  0.24.0 installed · 0.24.1 published — /plugin to update`, appended by the mod after the
  resolver's lines (it is a fact about the mod, not about the build). A pure `versionRow(installed, published)`
  lives in `build-view.mjs`, and the `Plugin` label joins `LABEL_GLYPHS`.
- **D6 — autoUpdate and the flag.** `"autoUpdate": true` goes on the `golden-frijoles` entry of
  `extraKnownMarketplaces` in `.claude/settings.json` and `skills/template/.claude/settings.json`.
  `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` comes out of this repo's settings (the template never had it, C2), `hooks.json`'s
  comment, `skills/README.md` and the CI step. **CI's pin moves 2.1.278 → 2.1.288** (C3) in `scripts/render-skills-ci.mjs`
  (both pins), and the workflows are regenerated, never hand-edited. A `claude plugin test` step joins validate.
  The mod gains `hooks/build-view.mod.test.ts`, which runs under the engine.
- **D7 — The story check is one function in the resolver's file.** `storyCheck({ root, branch, subject })` is exported
  from `build-state.mjs` (template copy, so root + vendor stay byte-identical). It uses `resolveTarget` and
  `storyIdsIn`, so there is no second parser. A thin `scripts/story-check.mjs <msgfile>` (template + root, parity)
  reads the message's first line and the branch (`git symbolic-ref`) and prints the verdict. `.githooks/commit-msg` and
  `skills/template/.githooks/commit-msg` call it, `node` absent passes (like `pre-commit`), and the budget is the
  pre-commit one, < 2 s.
- **D8 — What counts as two ids.** `storyIdsIn` alone reads `S1.1/1.2` as ONE id. The check adds the continuation
  form, an id followed by `/`, `,`, `-`, `–`, `+`, `&` or ` and ` then `n.m` (`S2.2-2.4`, `S1.1/1.2`). That form lives
  as `storyIdsInWithContinuations()` beside `storyIdsIn`, which itself is unchanged (the view's D2 reading stays as
  shipped). Gated types: `feat|fix|perf|refactor` (with optional scope and `!`). Exempt: every other type, a subject
  starting `Merge `, `Revert "`, `fixup! `, `squash! `, `amend! `, a branch that resolves to no epic (incl. a seed),
  and `GF_SKIP_STORY_CHECK=1`. A non-conventional subject on an epic branch is treated as gated, because an untyped
  commit would otherwise be a silent bypass.
- **D9 — Progress = epic stories with commits (deviation, named).** `progress.stories_with_commits` = the distinct ids
  this EPIC lists (any sprint), named in any subject in `base..HEAD`. It is not sprint-filtered: a stacked `-s2` branch
  carries sprint 1's commits, and those are done stories. Known undercount: a branch rebased onto a squash-merged
  main loses earlier sprints' commits. The Progress row is `3 of 7 stories have commits · in flight S1.4 · Sprint 1 of
  2`, and `· in flight` is omitted when the story is unknown. `progress.story` (the ordinal) stays in the JSON, and
  `progressOf` in `build-view.mjs` reads the new words.
- **D10 — The lock command.** `scripts/epic-phase.mjs lock --epic <slug>` (template + root, parity) sets the README's
  `phase: Building` and `locked_at: "<ISO>"` and sprint-1's `phase: Building` by rewriting only those lines. It refuses
  (exit 1, says why) when the README body has no `D1` token. `roadmap-contract.mjs` validates `locked_at` as an ISO
  date-time string when present (`contract-locked-at-invalid`).
- **D11 — "Locking architecture" is the band's refinement, not a new stage.** `statusValue` reads
  `Locking architecture · from git: <branch> (…)` when the epic is in flight, its README has no `locked_at` and the
  stage is `Building` with a `git:` or `github: … draft` source. With `locked_at` it reads Building as today. The Hub,
  Notion and BUILD-ORDER keep `Building` (stage.mjs untouched).
- **D12 — `/build`.** Registered in `session.start` with `argumentHint: '<epic-slug>'`. The `command.run` hook runs the
  BUNDLED `../skills/groom/emit-epic-kickoff.mjs --epic <slug> --repo-root <root>`, then `$.prompt.fill({ text })`, and
  returns `{ text: 'Kickoff for <slug> is in the prompt — press enter to start.' }`. If `isFilled` is false it returns
  the kickoff itself as the text. Unknown or missing slug: the same script's new `--list` (README `status:` scaffolded or
  in-progress, build order first) is printed. `/build` never touches git.
- **D13 — The kickoff loses its restatements.** The sentence "The sprint files are integration, review and rollback
  boundaries inside this run, not separate sessions." goes, because *Epic-mode builds* says it and the prompt points
  there. Non-negotiable #1 names `node scripts/epic-phase.mjs lock --epic {{SLUG}}` as the step that ends the lock.
- **D14 — Releases.** S1 = plugin/kit **0.25.0**, S2 = **0.26.0** (`skills/RELEASING.md`). The mirror to
  golden-frijoles/skills follows each merge. S2's arrival on this machine through autoUpdate is the S1.3 proof.
- **D15 — Routing.** The architect (strongest model) builds every story in place: one session in this checkout, one
  builder. S2.1 is the shared-infra story, so it gets the strongest model by construction. The fresh `pr-reviewer`
  (mandatory, risk high) and `review-route.mjs --builder claude` passes run on each PR.

### Corrections — scope the live system disproved (said out loud)
- **C1 — There is no "In review" on the band (D4).** S1.2's acceptance and the S1 smoke step 4 said a DRAFT PR shows
  In review. Draft = Building, ready = **QA**. The smoke step is rewritten to a ready PR.
- **C2 — The template never set `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`.** Only this repo's settings, `hooks.json`'s comment,
  `skills/README.md` and both CI copies do.
- **C3 — "validate and test stay green on 2.1.288" was not true of CI**, which runs 2.1.278. That version has no
  `$.state`, and the new APIs need a newer one. The pin moves (D6).
- **C4 — `S1.1/1.2` is not two ids to `storyIdsIn`.** The check needs the continuation form (D8), which S2.1's
  acceptance assumed existed.
- **C5 — S2.3's literal string `(from git: branch pushed)`.** The band prints the stage source it has
  (`from git: feat/<slug> (snapshot, 2m ago)`), so the rung name, not the parenthetical, is the contract (D11).
- **C6 — No skill or doc tells an agent to save a kickoff to a file today** (grepped `skills/`, `Roadmap/`, `AGENTS.md`).
  S2.4 keeps the negative and adds the positive: `/build`.

## What already exists (reuse, don't rebuild)
- `skills/plugins/golden-frijoles/hooks/index.tsx` + `build-view.mjs` — the band, its cache (`$.store`), `attempt()`.
- `hooks/vendor/build-state.mjs` — the ONE resolver: `branchCandidates`, `resolveTarget`, `storyIdsIn`, D2, `gatherFacts`
  (live writes the snapshot). Byte-identical to `skills/template/scripts/build-state.mjs`.
- `skills/groom/emit-epic-kickoff.mjs` + `lib/epic-kickoff.mjs` (`epicKickoffFromDir`) — the kickoff, already on the Hub card.
- `.githooks/` and `skills/template/.githooks/` — where `commit-msg` lands; `scripts/check-script-parity.mjs`.
- `lib/roadmap-contract.mjs` + `scripts/doc-format.mjs` — the frontmatter contract `locked_at` joins.
- The Mods API on 2.1.288: `tool.call`, `session.start`, `$.clock.every`, `command.register`/`command.run`,
  `$.prompt.fill`, `$.state` (plugin-authoring types).

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | 1.1 The band re-keys mid-turn: after every Bash call and every 30 s | low |
| 1 | 1.2 In review without a network call in the turn | low |
| 1 | 1.3 The fixes we ship reach the session | low |
| 2 | 2.1 A feat/fix commit on an epic branch names exactly one story | high |
| 2 | 2.2 Progress counts stories done, not position | low |
| 2 | 2.3 The architecture lock is a command | low |
| 2 | 2.4 /build <slug> — the kickoff's one home | low |

**Model routing:** S2.1 (the shared git hook) to the stronger model; S1 and S2.2–2.4 are mechanical. The fresh
`pr-reviewer` is mandatory on both PRs (risk high), plus the routed external pass. **No flag** (Stage 6b): the mod's kill
switch is its `hooks.json` entry; the hook's is `GF_SKIP_STORY_CHECK=1`.

## Deploy order
No app deploy. Each sprint ships as a plugin/kit release (version bump + CHANGELOG, `skills/RELEASING.md`); the mirror
to golden-frijoles/skills follows the merge. S1's autoUpdate makes S2's release reach this machine by itself — verify it
did (the drift row is the check).

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
