---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: one-product-project
title: "One product project, and every flag in it"
area: 09-platform-infra
risk: high
type: chore
sprints_total: 3
stories_total: 9   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 83   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 55    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 111
quote_basis: "L, n=4, p25–p75"
hypothesis: "Golden Frijoles runs on one project and its own flag provider: no Vercel env var acts as a flag, and every gate is killable with `gf flags kill` in under a minute, with no redeploy."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "Vercel env vars acting as flags (prod)"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 18   # from what, a number
target_to: 0       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
flag_key: null   # the epic's flag, decided at groom Stage 6b and copied from the seed; null = no flag. The epic page shows its state
build_order: 63      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: One product project, and every flag in it

> **Area:** 09-platform-infra · **Risk:** high · **Class:** Chore · **Scope seed:** [`00-ideas/seeds/one-product-project.md`](../../00-ideas/seeds/one-product-project.md)
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
Golden Frijoles is built with Golden Frijoles, but until now it was spread over two projects and its feature gates
lived in Vercel env vars, outside its own flag provider. After this epic there is one project, `golden-frijoles`,
holding the roadmap, the telemetry, the North Star and every flag. Switching a gate off is `gf flags kill`: no Vercel
edit, no redeploy.

## Platform-first note
Everything is already modelled. Projects, api_keys, features, North Star and the flag registry are tables. The in-process
catalog read exists for one flag (`lib/terminal-sign-in-flag.ts`). This epic points the product at itself. It adds no
table and no migration.

## Decisions (Plan gate, Daniel, 2026-10-08)
- **D1 — Consolidate on `golden-beans-demo`, renamed `golden-frijoles`.** It holds the roadmap, the CI push key and the
  public role (rule #2: the demo IS us). `golden-beans`' real rows move in; `golden-beans` is archived (keys revoked,
  rows kept, slug reserved).
- **D2 — `FLAG_SERVING_ENABLED` and `CLI_WRITE_API_ENABLED` retire as flags.** They gate the control plane that would
  turn them back on, so they become always-on code. The rollback is `git revert`, and the CLI stays the recovery path
  for every catalog flag.
- **D3 — 17 env gates become catalog flags** in `golden-frijoles`, activated per env at today's live value.
- **D4 — Named prod writes, approved:** project rename + data moves in prod Supabase, revoking `golden-beans`' keys,
  creating 17 prod flags, deleting 18 Vercel env vars (production + preview). No new credential is minted: the Vercel
  `SELF_PROJECT_API_KEY` row (`golden-beans`' live ingest key) is re-pointed at `golden-frijoles`.
- **D5 — The fallback is the prod value** (served when the catalog read fails, or on previews, which have no DB),
  except the three gates that act on others' systems or are off in prod, which fall back OFF.
- **D6 — Off Vercel (CI, local), the old env var names still override.** `ci/gates.*.env` keep driving the two CI
  servers. On Vercel (`VERCEL=1`) no gate reads `process.env`.

## The gate table (D3 / D5)

| Env var (retired) | Flag key | Prod 2026-10-08 | Fallback |
|---|---|---|---|
| `SIGNUP_ENABLED` | `auth.signup_enabled` | true | true |
| `CONNECTOR_ENABLED` | `connector.mcp_enabled` | true | true |
| `CONNECTOR_WRITES_ENABLED` | `connector.writes_enabled` | true | true |
| `DESTINATION_DELIVERY_ENABLED` | `delivery.destinations_enabled` | masked → S3.1 | S3.1 |
| `JOURNEY_PROJECTIONS_ENABLED` | `journeys.projections_enabled` | true | true |
| `EXPERIMENT_GOVERNANCE_ENABLED` | `experiments.governance_enabled` | true | true |
| `EXPERIMENT_BUILDER_ENABLED` | `experiments.builder_enabled` | true | true |
| `REPORT_SHARES_ENABLED` | `reports.shares_enabled` | true | true |
| `SIGNALS_ENABLED` | `signals.loop_enabled` | true | true |
| `FLAG_DEFINITION_SYNC_ENABLED` | `flags.definition_sync_enabled` | true | true |
| `FLAG_RULE_BUILDER_ENABLED` | `flags.rule_builder_enabled` | masked → S3.1 | S3.1 |
| `FLAG_CONSOLE_ENABLED` | `flags.console_enabled` | true | true |
| `RESILIENCE_SCENARIOS_ENABLED` | `ops.resilience_scenarios_enabled` | masked → S3.1 | S3.1 |
| `SECURITY_SIMULATIONS_ENABLED` | `ops.security_simulations_enabled` | masked → S3.1 | **false** |
| `AUTOMATIC_CIRCUIT_BREAKERS_ENABLED` | `ops.automatic_circuit_breakers_enabled` | masked → S3.1 | **false** |
| `SCENARIO_AUTHORING_ENABLED` | `ops.scenario_authoring_enabled` | false | **false** |
| `AGENT_RAIL_ENABLED` | `console.agent_rail_enabled` | true | true |
| `FLAG_SERVING_ENABLED` | — retired: always on (D2) | masked → S3.1 must read ON | — |
| `CLI_WRITE_API_ENABLED` | — retired: always on (D2) | unset = on | — |
| *(already a flag)* | `auth.terminal_sign_in_enabled` | as in `golden-beans` | true |

## What already exists (reuse, don't rebuild)
- `apps/web/lib/terminal-sign-in-flag.ts` + `terminal-sign-in-flag-decision.ts`: the in-process catalog read, its
  30 s cache, `flagEnvironmentFor(VERCEL_ENV)` and the fallback. `lib/gates.ts` is this, for N keys.
- `lib/flag-registry.ts → getFlagRegistryView`, `lib/cli-flag-view.ts → toCliFlagView`.
- `@golden-frijoles/cli`: `gf flags create --kill-switch|--enablement --all-envs`, `gf flags get`, `gf flags kill`.
- `lib/public-demo.ts` (`DEMO_PROJECT_SLUG`), `lib/self-track.ts` (`SELF_PROJECT_SLUG`), `lib/tenant-slug.ts`,
  `lib/provisioning.ts` (reserved self/demo slugs).
- `ci/gates.on.env`, `ci/gates.off.env`, `scripts/lib/gate-env.mjs`: they become the off-Vercel overrides (D6).
- Prod data: `supabase db query --linked` (ref `slweidgffcfndnskcskc`).

## Prod data map (read 2026-10-08)
`golden-beans` (`2a709135…`) → into `golden-frijoles` (= `golden-beans-demo`, `c7af5b7a…`):
- **Moves (UPDATE project_id, no key collisions):** features `waitlist_conversion`, `activation`, `methodology_reading`.
  North Star `proven_bets` + its 4 leading inputs. Ingest key `d2bf557b…` (Vercel's `SELF_PROJECT_API_KEY`).
- **Retires in `golden-frijoles`:** the synthetic demo North Star `payable_sellers` (+1 input, 14 values), so the
  project has one North Star. It is backed up to the epic's scratch file first, and `scripts/seed-demo-project.mjs`
  can re-seed it.
- **Recreated, not moved:** `auth.terminal_sign_in_enabled`. `flag_definition_versions` is immutable, so its history
  stays on `golden-beans`.
- **Stays, archived:** 502 events, audit rows, journey proof rows, flag history. Connector token `6225230f…` is revoked.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 The code says `golden-frijoles` (defaults, reserved slugs, redirects, specs) | high |
| 1 | S1.2 Prod data moves into `golden-frijoles`; `golden-beans` archived | high |
| 1 | S1.3 `auth.terminal_sign_in_enabled` recreated in `golden-frijoles` | high |
| 2 | S2.1 `lib/gates.ts`: one catalog reader, the gate table, fallbacks | high |
| 2 | S2.2 Every gate call goes through the seam (async) | high |
| 2 | S2.3 Guard: no `process.env.*_ENABLED` outside the seam | low |
| 3 | S3.1 Read the masked values from live behaviour; create + activate 17 flags | high |
| 3 | S3.2 Verify on prod, then delete the 18 Vercel env vars | high |
| 3 | S3.3 Docs: AGENTS rule #4 + Key env vars, LEARNINGS, flags comments | low |

## Deploy order
1. S1 merges. As soon as its deploy is Ready, the prod rename + data moves run (S1.2). The public demo routes 404 for
   the minute in between, which is accepted. The redirects cover old links.
2. S3.1's flags are created and activated **before** S2 merges. Since the fallbacks are the prod values, the order is
   belt-and-braces, not load-bearing.
3. S2 merges → each gate is verified on prod → S3.2 deletes the env vars. The deletion takes effect on the next deploy
   and changes nothing, because nothing on Vercel reads them any more.

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
