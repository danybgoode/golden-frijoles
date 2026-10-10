---
status: in-progress   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Verifying       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: brand-reveal-error-pages
title: "A golden welcome and recovery pages"
area: 02-commercial
risk: high
type: feature
sprints_total: 2
stories_total: 2   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 32
quote_basis: "M, n=20, p25–p75"
hypothesis: "We believe that a branded interactive setup reveal and useful, consistent recovery pages for installers and visitors will make Golden Frijoles feel coherent at its edges, because setup and failure states are often their first encounter with the product. We'll know when the approved reveal and every browser recovery path render and keep their correct behavior."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "A person installing Golden Frijoles or recovering from a broken page"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "This is a brand and usability improvement; the product owner approved visual behavior, without a numeric baseline."   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
build_order: 78      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: A golden welcome and recovery pages

> **Area:** 02-commercial · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/brand-reveal-error-pages.md`](../../00-ideas/seeds/brand-reveal-error-pages.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at refining (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
The first interactive CLI setup and the site's failure states should feel like the same product. A green bean ripens to gold, then a gold sweep reveals FRIJOLES in the terminal. Visitors who hit a missing or broken page get a clear, playful path back without losing the correct error behavior.

## Platform-first note
This is presentation at existing CLI and Next.js seams. It does not create telemetry, a new gate, or a data read. Existing authorization and public demo checks continue to own status decisions.

## What already exists (reuse, don't rebuild)
- `packages/cli/src/commands/config.ts` owns `frijoles setup`; `run.ts` and `output.ts` own JSON and terminal output.
- `apps/web/app/s/[token]/not-found.tsx` already covers indistinguishable shared-link failures; preserve that behavior.
- `apps/web/design-system/Frame.tsx` and brand tokens provide the public visual language. Next.js App Router error conventions provide the fallback boundaries.
- The `SKILLS` lettering belongs to the third-party `npx skills` installer; the approved reveal lives in the Golden Frijoles CLI.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1 Golden terminal welcome | high |
| 2 | S2 Branded recovery pages | high |

## Deploy order
Ship CLI and web from this branch after verification. The web pages deploy on merge to `main`. The plugin and kit advance together to 1.4.0 through the skills mirror and release workflow; CLI 1.2.0 pins the already-published kit 1.3.0 and has a separate npm publish that requires Daniel's 2FA before merge. Check the packed CLI locally and web behavior on preview before merge. Keep API JSON responses, auth-gated 404s, and shared-link failure text intact.

## Verification record
- CLI `tsc`, build, 119 focused tests, and a real PTY run showed the gold sweep finishing before the first setup prompt.
- Web `tsc`, production build, lint, design-drift, and 3,329 unit tests passed. A browser spec checked desktop/mobile 404 rendering and HTTP 404; a temporary throwing route showed the production 500 boundary and HTTP 500, then was removed.
- Each new recovery spec failed against the live pre-change 404, then passed against the local production build. The animated-frame spec failed against the pre-fix cursor-hiding implementation and passed after it was corrected.
- The full API suite needs this checkout's local Supabase credentials and instance. The focused recovery API spec passed; CI's database-backed gate remains the full-suite check.

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at refining — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and is ACTIVATED there** —
      `frijoles flags get <key>` must not print `—` in its PRODUCTION row. Creating a definition is not
      turning it on, and a flag that is synced but never activated serves compile-time defaults while
      every dashboard says it exists. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
