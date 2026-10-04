---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: cli-think-skills-followups
title: "CLI follow-ups from think-skills"
area: 09-platform-infra
risk: low
type: feature
sprints_total: 1
stories_total: 2   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 90   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 11    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 17
quote_basis: "S, n=3, p25–p75"
build_order: 57      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: CLI follow-ups from think-skills

> **Area:** 09-platform-infra · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/north-star-dry-run-sendable.md`](../../00-ideas/seeds/north-star-dry-run-sendable.md) (consolidates [`cli-body-order-guard-clone`](../../00-ideas/seeds/cli-body-order-guard-clone.md))
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
Two promises from think-skills (#216) that a reviewer showed are only half kept. First, an agent driving
`gf north-star set --json` can't tell whether `--yes` would be accepted without parsing prose. Second, the guard that
keeps every CLI route's gate in front of its request body can't see three ways of reading the body. After this epic,
the dry run says `sendable` and why not, as data, and the guard goes red on all three forms.

## Platform-first note
No new engine primitive, route, table or flag. Story 1 is a CLI-only additive `--json` field (the `--json` contract
allows additions). Story 2 is a test. AGENTS rules 1–5 are untouched; `readCliBody` (`lib/cli-auth.ts`) stays the one
body reader.

## Decisions proposed at grooming (the architect verifies each against live code at the lock)
- **D1 — One verdict function.** A pure `dryRunVerdict(plan, unfilled) → { sendable, blockers }` in
  `packages/cli/src/commands/north-star.ts`; `nextStep` renders its sentence FROM it. The human output's words don't
  change, and the help goldens must not move.
- **D2 — Blocker shape (Daniel approved 2026-10-03):** structured,
  `blockers: [{ kind: 'placeholders', paths: string[] }, { kind: 'value-source', keys: string[] }]`, ordered as
  `nextStep` checks them today. `sendable: true` ⇔ `blockers: []`.
- **D3 — Dry run only.** The `--yes` path's refusals are not moved or refactored.
- **D4 — The guard anchors on the handler's parameter name**, parsed from each `export (async )?function <VERB>(<name>`.
  It flags `<name>(.clone())?.(json|text|formData|arrayBuffer|blob)(` and `<name>.body`. A handler with no parameter is
  skipped. `NextResponse.json(` must never fire.
- **D5 — Release: CLI 0.4.1** (patch, additive). `npm publish` is Daniel's 2FA step, owed by name. Test the PACKED
  tarball under a real TTY before handing it over (memory: *golden-frijoles-cli*).

## What already exists (reuse, don't rebuild)
- `nextStep`, `unfilledPaths`, `planSync` — `packages/cli/src/commands/north-star.ts`
- `context.emit.ok(data, text)` — the `--json` contract (`packages/cli/src/output.ts`)
- `packages/cli/src/cli-write.test.ts` (`:704`, `:813`: the unfilled dry-run tests to extend), `golden.test.ts`
- `apps/web/lib/cli-body-order.test.ts` (`routeFiles()` walk), `readCliBody` (`apps/web/lib/cli-auth.ts`)

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 The north-star dry run says `sendable` and `blockers` (CLI 0.4.1) | low |
| 1 | S1.2 The body-order guard catches clone, renamed parameters and `.body` | low |

**Risk note:** low. The CLI change is an additive read-only output field. The guard is a test that doesn't touch the
auth seam (`readCliBody` itself is unchanged). No kill-switch (low risk; Daniel's default is no flag).

**Shape:** one sprint, two independent stories, one PR (they don't split along a review boundary), so the per-sprint
kickoff is the right tool here (the epic-mode prompt will say so).

## Deploy order
Merge to `main` (the guard runs in CI from then on). Then Daniel runs `npm publish` for `@golden-frijoles/cli@0.4.1`.
Until that happens the field exists on `main` only. Nothing deploys to Vercel behaviourally: no `apps/web` runtime
change.

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
