---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-14T19:07:51Z"
slug: outcome-report-any-product
title: "The outcome report for any product"
area: 02-commercial
risk: high
type: bug
sprints_total: 1
stories_total: 4   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 89   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 6    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 16
quote_basis: "S, n=8, p25–p75"
hypothesis: null   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "A founder (and their agent) running a product other than Golden Frijoles who was promised an outcome report."   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: null   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 87      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: The outcome report for any product

> **Area:** 02-commercial · **Risk:** high · **Class:** Bug · **Scope seed:** [`00-ideas/seeds/outcome-report-any-product.md`](../../00-ideas/seeds/outcome-report-any-product.md)
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
Any product that pushes its roadmap can make, push and send its outcome report from the kit, and trust its dates. Today
the generator exists only in this repo, setup and the console promise a command other products don't have, and its
shipped dates come from a text search rather than each epic's real status history.

## Platform-first note
No server change: `POST /api/v1/reports/pod/push` and `/reports/pod/lifecycle` already take any product's ingest key, and
the renderer reads `report_artifacts` for that product only. The work is distribution (the kit), the date source, one
additive payload field, and true copy.

## What already exists (reuse, don't rebuild)
- `scripts/pod-report.mjs` (I/O) + `scripts/lib/pod-metrics.mjs` (pure maths) + `scripts/lib/maturity-lens.mjs`; `scripts/pod-report.test.mjs`.
- `skills/template/scripts/lib/epic-kickoff.mjs → parseFrontmatter` (the kit's frontmatter parser); `roadmap-push.mjs`'s env names.
- `apps/web/lib/pod-report-schema.ts` (payload is an open record, so an added field is additive); `app/hub/report-components.tsx`.
- `skills/scripts/build-kit.mjs` + `check-skill-scripts.mjs` (a kit ships only what `requires_scripts` declares — LEARNINGS 2026-10-14).

## Architecture lock (2026-10-14, the architect, verified against live code and both real repos)
**Baselines (`pod-report.mjs --repo <r> --generated-at 2026-10-14T00:00:00Z`, today's code):** golden-frijoles —
`epicLeadTime` 7 measurable, median 2 d, p90 11.6 d, 75 retroactively documented; medusa-bonsai (`41e9006`) — 53
measurable, median 7 d, p90 7.3 d, 106 retroactively documented, `epicThroughput` recorded too.
- **D1 · Dates from parsed history.** For each `Roadmap/*/*/README.md`: ONE `git log --follow --format=<sha,date> -p` (or
  `--format` + batched `git show`) per README, parsing each revision's frontmatter with the kit's `parseFrontmatter`.
  `startedAt` = the first revision (unchanged); `shippedAt` = the FIRST revision whose parsed `status` is `shipped`
  (the product owner, 2026-10-14). A README whose first revision is already shipped stays "retroactively documented".
  **The baselines above must come out identical**; any epic whose date differs is listed in the PR with why (a real
  miss of the old `-S` search), never absorbed.
- **D2 · History and rework, additive.** Each epic in the artifact gains `statusHistory: [{at, from, to, commit, subject}]`
  (status CHANGES only); `delivery.rework = { reopened, of, medianDaysToReship, epics: [{slug, reopenedAt, reshippedAt,
  subject}] }` — an epic that left `shipped` after shipping. Lead time is untouched by rework. No reason is inferred;
  the re-opening commit's subject is shown. `POD_REPORT_SCHEMA_VERSION` stays 1 (additive fields; the renderer
  tolerates absence).
- **D3 · One report line.** The report shows "Re-opened after shipping: n of m (median d days to ship again)" when
  `rework` is present; the changed `hub-report` state is put to the product owner for re-approval.
- **D4 · In the kit.** `pod-report.mjs` + `lib/pod-metrics.mjs` + `lib/maturity-lens.mjs` move to
  `skills/template/scripts/` (root copies kept byte-identical by `check-script-parity`), declared in the report skill's
  `requires_scripts`; `--repo` defaults to the project root; base URL `GROWTH_ENGINE_URL` else
  `https://goldenfrijoles.com` (decision b); key `POD_REPORT_API_KEY` > `SELF_PROJECT_API_KEY` > `GROWTH_ENGINE_API_KEY`.
  Verified by building the kit and running `kit/dist` `pod-report` against a scratch repo.
- **D5 · True copy.** The console empty state (`report-components.tsx`), setup SKILL.md / config-registry /
  install-manifest / `agents-manifest.ts` name `npx -y @golden-frijoles/kit pod-report --push` (run in the product's
  repo with its ingest key in `.env.local`). `agents-md.test.ts` keeps the page honest.

**Routing.** The architect builds D1–D2 (it moves a headline metric) and D4; a Sonnet builder takes D3 + D5. Reviews:
verifier (fresh), agy general (scoped), Codex luna/xhigh security (the push path).

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | 1.1 Shipped dates from each epic's real status history | high |
| 1 | 1.2 Rework is its own number | low |
| 1 | 1.3 `pod-report` in the kit, with a stranger's defaults | high |
| 1 | 1.4 Every screen names the command that works | low |

## Deploy order
No migration, no server route. Merge deploys the copy and the report line; the kit release (plugin + kit patch) carries the generator.

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
