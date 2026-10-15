---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building                   # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-15T05:56:51Z"
slug: owed-on-screen
title: "Owed on screen"
area: 02-commercial
risk: high
type: feature
sprints_total: 2
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 81   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=24, p25–p75"
hypothesis: "We believe that showing every owed check on the epic page and in one band on the board, for founders who own the product, will cut the open owed checks, because today they live only in a generated file nobody opens (85 open on 2026-10-14, 24 of them answers only the owner can give). We'll know when the open count falls."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "open owed checks (OWED-LEDGER.json total)"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 96   # from what, a number
target_to: 40       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "A founder who owns the product, closing the loop on what their agents built"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "An operator surface: it clears what stalls epic close-outs, where verdicts are stamped, but no North Star input counts owed checks directly."   # only with grounded: false
flag_key: hub.owed_enabled   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: everyone   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: owed_viewed
retained_event: null
retention_days: null
satisfied_event: null
build_order: 92      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Owed on screen

> **Area:** 02-commercial · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/owed-on-screen.md`](../../00-ideas/seeds/owed-on-screen.md)
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
Owed checks (the walkthroughs, credentials, publishes and answers an epic leaves for its owner) live only in a
generated file: 96 open on 2026-10-15, 30 of them answers only the owner can give. This puts them where a founder
already looks, on the epic page, in one band on the board and as a count on the portfolio, for members only. We'll
know when the open count falls from 96 to 40 within 30 days of shipping.


## Platform-first note
No new table: the ledger already exists (`scripts/owed-ledger.mjs`) and rides the roadmap push like `quote_*` and
`verdict`. The tenancy invariant holds: every read is one project's own push; the portfolio reads through
`getWorkspaceProjects()`. Rule #2: the public project's roadmap stays public, but owed checks are member-only (S1.2).


## What already exists (reuse, don't rebuild)
- `scripts/owed-ledger.mjs` → `OWED-LEDGER.json`; `scripts/roadmap-extract.mjs` → `scripts/roadmap-push.mjs` →
  `POST /api/v1/roadmap/push` → `apps/web/lib/roadmap-artifact-schema.ts`.
- `apps/web/app/hub/[projectSlug]/epic/[epicSlug]/`, `apps/web/app/hub/[projectSlug]/board/`, `apps/web/app/app/portfolio`
  (`lib/portfolio.ts`).
- `apps/web/design-system/bands`, `lib/hub-freshness.ts`, `lib/membership.ts`, `lib/public-connector-scrub.ts`,
  `lib/gates.ts`, `lib/self-track.ts` (`trackSelfEvent`).


## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 The roadmap push carries each epic's owed checks · S1.2 Only a member ever receives an owed check | high |
| 2 | S2.1 Epic page · S2.2 Board band · S2.3 Portfolio count · S2.4 Flag + measurement | low |

## Deploy order
Sprint 1 first: the push contract and the member-only seam, with no screen. Sprint 2 ships behind
`hub.owed_enabled`, off in production until the product owner sets it on. `roadmap-extract.mjs` is mirrored to
`skills/`, so S1.1 is also a plugin release (`skills/RELEASING.md`). No migration.


## Architecture lock (D1…D12) — locked 2026-10-15, before any builder started

Verified against live code on `main` (`d1eafaa`) and live production data (read-only, 2026-10-15). Builders cite these;
each rule lives where it says, once.

**Deviations the live system forced, said out loud:**
- **`OWED-LEDGER.json` holds counts only — no items** (`{ total, cleared, files, byCategory, byKind, generatedAt }`;
  `scripts/owed-ledger.mjs` writes the items only to the markdown). The S1.1 text ("reads `OWED-LEDGER.json` and
  attaches each item") is fiction as written. Corrected in D1: the push **derives** the items live with the ledger's own
  functions, and the committed JSON's presence is only the opt-in.
- **Per-row `owed` is replaced by ONE top-level `owed` block on the envelope** (D2). Per-row would ride every
  `items` reader (`.passthrough()` keeps unknown fields): the journey, palette, epic-index, share link, finops, pod
  report, connector — ten readers each needing to remember to drop it. One block is one key to strip, and
  `buildRows()` (BUILD-ORDER, terminal, Notion) stays byte-identical. `owed_unattached` becomes `epic: null`.
- **The baseline is 96, not 83** (`node scripts/owed-ledger.mjs`, 2026-10-15: 96 open across 72 files). `target_from`
  corrected 83 → 96; `target_to` (40) is the product owner's and stays.
- **The kit does not ship `owed-ledger.mjs` today** (no skill lists it in `requires_scripts`). Making `roadmap-push.mjs`
  import it means `refine`, `report` and `setup` declare it (+ `lib/reporting-config.mjs` for `refine`), checked on the
  BUILT kit (LEARNINGS: a shared module must be declared in every skill that runs it).

**Live data (2026-10-15):** `report_artifacts` roadmap rows: `golden-frijoles` v441 (546,740 bytes, cap 4,194,304),
`aomx` v8. No payload carries an `owed` key. `hub.owed_enabled` does not exist in the catalog yet. 96 owed items
≈ 50 KB on the push.

- **D1 — Derivation.** `scripts/owed-ledger.mjs` exports `owedForPush({ root, epicSlugs })`: returns `null` when
  `Roadmap/00-ideas/OWED-LEDGER.json` is absent (the opt-in — AC4), or when the ledger's own refusal rule fires (no spec
  dir / a configured dir missing — `main()`'s rule, extracted, never a second copy); otherwise the OPEN items of
  `buildLedger(gather(...))`, each `{ epic, text, kind, category, file, line }`. `gather` takes `root` (today it reads the
  module's `ROOT`). Count === the ledger's `total` (AC1), asserted in its pure spec.
- **D2 — Attribution.** `epic` = the slug of the epic folder holding `file` (`Roadmap/<NN-area>/<slug>/…` where `<slug>` is
  in `epicSlugs`), else `null` (specs under `apps/*/e2e`). Pure, in `owed-ledger.mjs`, spec'd beside its tests.
- **D3 — Envelope.** `roadmap-push.mjs → envelopeFor` adds `owed` (when non-null) via `buildEnvelope(..., { owed })`, like
  `horizon`. `text` is cut to 500 chars with `…` in the extract (the source keeps the whole note).
- **D4 — Schema** (`lib/roadmap-artifact-schema.ts`, top-level, `.nullish()` so an older pusher validates — AC2):
  `owed: z.array({ epic: slug|null, text: 1..500, kind: z.enum(OWED_KINDS), category: z.enum(OWED_CATEGORIES), file:
  repo-relative path ≤300 (no `..`, no scheme), line: int ≥1 }).max(1000)`; superRefine: ≤100 per epic, and every non-null
  `epic` names an `Epic` row in `items` (the destinations rule's shape). Messages name the field (AC3). `OWED_KINDS` /
  `OWED_CATEGORIES` are COPIES of `KINDS` / `CATEGORIES` in `scripts/owed-ledger.mjs`, pinned by a spec (the
  `ROADMAP_STAGES` precedent). The push route stores `owed` beside `items` (it is not in `items`, so it would be dropped).
- **D5 — The strip is the read seam** (CODE-QUALITY §2: unrepresentable, not remembered). `lib/report-artifacts.ts`'s
  `getLatestArtifact` / `getLatestArtifactBefore` return a roadmap payload WITHOUT `owed`: every read maps its row through
  the zero-import `lib/report-artifact-row.ts → artifactFromRow(row, { keepOwed })`, which applies `withoutOwed`
  (amended at build: the mapping moved there so the strip itself is unit-tested, not just the helper). Every existing reader (hub pages, connector, CLI, share link,
  portfolio, finops, pod report) is covered with no edit.
- **D6 — The one raw read.** `lib/report-artifacts.ts` exports `getLatestRoadmapWithOwed(projectId)`. Its callers are a
  closed registry pinned by a source-guard spec: `app/api/v1/roadmap/push/route.ts` (the D16 unchanged-board compare must
  see `owed`, or every push is a new version) and `lib/owed-read.ts`. A third caller turns the spec red.
- **D7 — The member gate.** `lib/owed-read.ts` (server-only): `getOwedForViewer(projectId, userId | null)` →
  `{ ok: true, items, generatedAt, sourceCommit } | { ok: false }`. `userId` null → `{ ok: false }` with no read; else
  `getMembershipByProjectId(userId, projectId)` (fails closed, re-checks the workspace) → null ⇒ `{ ok: false }`. The
  decision is the pure `owedForViewer(payload, isMember)` in `lib/owed.ts` (`[]` unless member) — the spec target.
  `projectId` is always the id the page's own read resolved (one-epic-page D2), never re-derived from a slug.
- **D8 — Connector.** `lib/public-connector-scrub.ts` DROPS (not "hidden") keys `owed` / `owed_unattached` anywhere —
  belt to D5's braces, so a future tool that reads raw cannot leak to the anonymous reader. Api spec on the public
  project's anonymous connector (`get_horizon` + the epic reads): no `owed` key in any reply (AC S1.2-2).
- **D9 — Flag.** `GATES.owedOnScreen = { key: 'hub.owed_enabled', envVar: 'HUB_OWED_ENABLED', fallback: false }` (an
  enablement, born dark); `isOwedOnScreenEnabled()` in `lib/flags.ts`; `HUB_OWED_ENABLED=false|true` in
  `ci/gates.off.env` / `ci/gates.on.env`. Catalog: `frijoles flags create hub.owed_enabled --enablement --all-envs`;
  `frijoles flags get` must print `off vN` in production. Flag off ⇒ the three screens skip the owed read entirely.
- **D10 — Grouping.** `lib/owed.ts → groupOwed(items)`: `waiting` (judgment, credential, publish, ops), `agentCould`
  (signed-in, interactive), `unsorted`. The kind → group map is total over `OWED_KINDS` (a `Record`, so a new kind is a
  build error). Pure spec.
- **D11 — Measurement.** `owed_viewed` joins `lib/self-track-events.ts`, mapped to `HUB_ENGAGEMENT_SIGNAL_KEY` (already
  registered on the self tenant — no prod feature registration owed). Fired via `after()`, with the member's user id
  (person = user subject, one-bet-wired), once per page view that rendered ≥1 owed check, on the epic page, the board and
  the portfolio.
- **D12 — Release + order.** S1.1 touches mirrored `scripts/` → plugin+kit release **1.10.0** in the S1 PR
  (`skills/RELEASING.md`, `plugin-checksums.mjs`). No migration. S1 ships with no screen; S2 ships dark behind D9.

**Routing.** S1 (push contract + authorization boundary, high): the architect (Opus) builds it — never delegated
(WAYS-OF-WORKING: auth/tenancy stay strongest). S2 (four low, well-specified stories on S1's seams): one Sonnet builder
on `feat/owed-on-screen-s2`, stacked. Review on every PR: `review-route.mjs` (general + security lens on S1), plus the
mandatory fresh `verifier` (high-risk epic). Built in place (one session in this checkout, one builder at a time).

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at refining — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and its switch is set there** —
      `frijoles flags get <key>` must print `on vN` or `off vN` in its PRODUCTION row (a bare `off` with no version
      means nothing is served there, so the app runs on its own built-in default). A newly synced flag goes live as written in its file; a sync never switches an existing one. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
