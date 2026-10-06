---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: north-star-multi-metric-read
title: "Several North Star metrics, one reading rule"
area: 01-growth-engine
risk: low
type: bug
sprints_total: 1
stories_total: 1   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 87   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 11    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 17
quote_basis: "S, n=3, p25–p75"
build_order: 76      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Several North Star metrics, one reading rule

> **Area:** 01-growth-engine · **Risk:** low · **Class:** Bug · **Scope seed:** [`00-ideas/seeds/north-star-multi-metric-read.md`](../../00-ideas/seeds/north-star-multi-metric-read.md)
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
`gf north-star set` can legitimately leave a project with two or more North Star metrics: a new key is *added beside*
the old one (think-skills). When that happens, the project's North Star page shows the error boundary and its Pod Report
says the North Star is unavailable. Both are outages for a valid state. After this epic, every reader shows the newest
metric (Daniel, 2026-10-04) with that metric's own inputs.

## Platform-first note
AGENTS rule 1: the North Star read path is `lib/north-star-query.ts`, and the fix lives there; the Pod Report imports
it instead of keeping its own query. Every read stays scoped to one server-resolved `project_id` (tenancy unchanged).
No migration: `created_at` already exists on `north_star_metrics`.

## Decisions proposed at grooming (the architect verifies each against live code and live data at the lock)
- **D1 — The rule (Daniel, 2026-10-04):** the current North Star is the project's metric with the latest `created_at`,
  ties broken by `key` ascending. A revision reuses its key, so it's an upsert and `created_at` stays put.
- **D2 — One helper:** `currentNorthStar(supabase, projectId)` in `lib/north-star-query.ts` uses
  `.order('created_at', { ascending: false }).order('key').limit(1)`. It keeps the three-way answer every caller already
  distinguishes: a metric / none registered / query failed.
- **D3 — Both readers use it:** `getProjectNorthStarByProjectId` (`:194`) and `pod-report-query.ts readNorthStar`
  (`:185`). Inputs are filtered to that metric. The Pod Report's `leading_inputs` count becomes per-metric, joined like
  `north-star-query.ts:200` does.
- **D4 — Find the third reader at the lock.** Grep every `north_star_metrics` / `leading_inputs` reader, the MCP
  `get_north_star` path included. Any that use `.single()`/`.maybeSingle()` on a non-unique filter join this epic.
- **D5 — Live data (owed at the lock):** how many prod projects have more than one metric. The read-only query is in
  the seed. It was blocked in the grooming session by the auto-mode classifier, so Daniel runs it or authorizes it.

## What already exists (reuse, don't rebuild)
- `lib/north-star-query.ts` (`getProjectNorthStarByProjectId`, the `leading_inputs → north_star_metrics(key)` join)
- `lib/pod-report-query.ts` (`readNorthStar`, its `unavailable` contract: an error is never rendered as an absence)
- `app/app/north-star/[projectSlug]/page.tsx` (throws on `ok: false`; keep that for a real failure)
- `apps/web/e2e/helpers/` disposable fixtures; the existing North Star api specs

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 One rule for the current North Star, every reader uses it | low |

**Risk note:** low. A read-path fix with no auth, tenancy, migration or money change; reads stay single-project.
No kill-switch (low risk; Daniel's default).

## Deploy order
Merge = deploy (Vercel). No migration, no env var.

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
