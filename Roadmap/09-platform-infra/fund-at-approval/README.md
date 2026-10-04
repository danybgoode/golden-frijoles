---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: fund-at-approval
title: "Fund at approval: the approval gate is the betting table"
area: 09-platform-infra
risk: low
type: chore
sprints_total: 1
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 7    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 16
quote_basis: "S, n=4, p25–p75"
build_order: 60      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Fund at approval: the approval gate is the betting table

> **Area:** 09-platform-infra · **Risk:** low · **Class:** Chore · **Scope seed:** [`00-ideas/seeds/fund-at-approval.md`](../../00-ideas/seeds/fund-at-approval.md)
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

Approving a groomed pitch should also fund it. Today the betting table is a separate session that `groom` never
reaches, so 43 of 58 epics were built with no funding record and the opportunity-cost ledger (`Roadmap/bets/`) shows
only the few that got that session. After this ships, one answer at `groom`'s approval gate places the bet in the
month's cycle, records what it displaced, gives it a build position, and scaffolds it, in one commit. Nothing leaves
grooming scaffolded but unfunded, and the board fails if anything does.

## Platform-first note

No product primitive is involved: this is planning tooling over `Roadmap/` frontmatter. The parts exist (wave files,
`underwritten_by`, `build_order`, `build-order.mjs`); they move into the approval gate and become automatic.

## What already exists (reuse, don't rebuild)
- `Roadmap/bets/README.md` (the three-column row: Bet · Appetite · Displaced) and 13 wave files.
- `skills/template/scripts/build-order.mjs` (the board and its `appetite` hard-fail) and `roadmap-extract.mjs`
  (`underwritten_by` per row).
- `groom/scaffold-epic.mjs` (already copies the seed's `quote:` and `intent_match:` into the README; the same seam
  carries `build_order`).
- `groom` Stage 1.5 (appetite + quote) and Stage 7 (the gate).

## Architecture lock (verified against live docs 2026-10-04)

- **D1 · `fund.mjs` lives in the groom skill, beside `scaffold-epic.mjs`.** Same contract: zero deps, `--repo-root`
  (default cwd, refuses without `Roadmap/`), `--dry-run`, writes `Roadmap/` docs only, never commits. It is a planning
  helper the gate runs, not a project script, so it is not in `template/scripts/` or the kit.
- **D2 · Cycle files are monthly: `Roadmap/bets/wave-YYYY-MM.md`**, created on first use with the bets README's
  header and table. Today's `wave-` name is kept on purpose: bet A (`plain-outcome-rename`) renames `bets/` →
  `cycles/` and maps these values with it. `--cycle <name>` overrides the month (it must exist or is created).
- **D3 · `underwritten_by` has one format: the bare cycle name** (`wave-2026-10`), which must name an existing
  `Roadmap/bets/<name>.md`. The legacy `"Roadmap/bets/<name>.md"` path form is normalised by the backfill.
- **D4 · The queue is funded, live work only**: epics `scaffolded`/`in-progress` and seeds `queued` (no epic) that
  carry an integer `build_order`. `ready`/`raw` seeds with legacy numbers (14, 17, 36, 54 today) are not the queue and
  are never renumbered. Placement (`--next` = front, `--after <slug>` = behind a queue item) rewrites the queue's
  numbers in order, starting at the queue's current lowest number and **skipping every number held by a non-queue
  item**, so a shipped or archived `build_order` can never change or collide. Live queue today: 60–67, contiguous.
- **D5 · Gate order is fund, then scaffold.** `fund.mjs` sets the seed's `underwritten_by`, `build_order`,
  `appetite` and `status: queued`; `scaffold-epic.mjs` then copies `build_order` into the README (seed fallback, like
  `quote:`), sets the seed's `epic:` and `status: scaffolded`, and prints one path-scoped commit that includes the
  cycle file and the regenerated board. `scaffold-epic` **refuses a seed with no `underwritten_by`** and prints the
  `fund.mjs` command; with no seed file at all (a stranger's repo) it scaffolds as before.
- **D6 · "Approve, don't fund" is a gate answer, not a script.** The seed stays `ready`; nothing runs.
- **D7 · Re-bet = `fund.mjs` on an already-funded slug with no placement flag**: a new row in this month's cycle,
  `underwritten_by` moved to it, position kept. That is the one-line wave-boundary question for an L bet.
- **D8 · The guard.** `build-order.mjs` hard-fails a live epic (`scaffolded`/`in-progress`) or `queued` seed whose
  `underwritten_by` is missing or names no `Roadmap/bets/` file. The extractor reads `underwritten_by` from the epic
  README first, then the seed (the six seedless shipped epics carry it in their README).
- **D9 · `priority:` is retired.** The extractor stops emitting it, the Notion push stops sending it, the seed
  template and docs drop it, and the backfill strips it from every seed. The Hub schema keeps `priority` `.nullish()`
  so an artifact pushed before this still parses.
- **D10 · Backfill is one-off and honest**: every unfunded seed/epic gets `underwritten_by: wave-backfill`, a cycle
  file that says it is a backfill, not a bet. Legacy path values are normalised (D3). The script is not committed.
- **D11 · F33 (a fixed-scope seed has no build command).** `scaffold-epic.mjs --slug <seed>` fills `--title`,
  `--area`, `--type`, `--risk` from the seed and `--macro` from the one `Roadmap/<area>-*` directory, defaults
  `--sprints` to one sprint named after the seed, and turns the seed's `## Acceptance criteria` bullets into
  sprint-1's stories. `emit-epic-kickoff` / `emit-kickoff` on a seed slug with no epic say exactly that and print the
  scaffold command, instead of "not found".
- **D12 · Release.** `skills/` changes → plugin + kit bump in lockstep with a CHANGELOG section
  (`skills/RELEASING.md`); the PR merges with a **merge commit, never a squash**. `scripts/` copies stay byte-identical
  to `skills/template/scripts/` (`check-script-parity`), and groom's `vendor/` is re-rendered (`render-hook-vendor`).

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 `fund.mjs`: cycle row, `underwritten_by`, queue placement | low |
| 1 | S1.2 The cycle file opens itself (one per month) | low |
| 1 | S1.3 The gate: approve funds, "approve, don't fund" stays ready | low |
| 1 | S1.4 The guard + the backfill + `priority:` retired | low |
| 1 | S1.5 A fixed-scope seed scaffolds and kicks off without a detour (F33) | low |
| 1 | S1.6 Docs: the flow, betting rules and the wave-boundary re-bet | low |

## Deploy order

Docs and tooling only: no app code, no migration, no env. The plugin and kit release on merge
(`skills/RELEASING.md`). Merge commit, never squash.

**Routing:** one session, fixed scope (appetite S). The architect builds; review per WAYS-OF-WORKING → *Review & merge*.

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
