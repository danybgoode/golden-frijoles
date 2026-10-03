---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: live-build-view
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
