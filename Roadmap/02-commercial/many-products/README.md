---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-14T03:04:37Z"
slug: many-products
title: "Many products"
area: 02-commercial
risk: high
type: feature
sprints_total: 3
stories_total: 12   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 91   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 33
quote_basis: "M, n=23, p25–p75"
hypothesis: "We believe a founder whose agent can start, bind and delete a product from the terminal will place bets in more than one product, because today a second product takes hand-written SQL and login links a new repo to the wrong one. We'll know when another product places its first bet."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "bets_placed_per_workspace"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 3       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "Startup founders who own the product, running more than one product (or a new repo) from one account, through their agent."   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: true   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 82      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Many products

> **Area:** 02-commercial · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/many-products.md`](../../00-ideas/seeds/many-products.md)
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
A founder who runs more than one product can start, bind and delete a product from the terminal or the console, and
each product's horizon shows its own destinations. Today a second product needs hand-written SQL (`aomx` was made that
way on 2026-10-13), `frijoles login` asks which product before a new repo has one, and every product's `/horizon`
shows Golden Frijoles' destinations.

## Platform-first note
No new primitive. Products, owner memberships and keys already come from `lib/provisioning.ts`; account-wide CLI
tokens already exist (`lib/cli-auth.ts`, `scopeProjectId: null`); every project read already passes one seam
(`lib/membership.ts` + `lib/auth.ts`), which is where soft delete is enforced; the roadmap artifact already carries an
optional `board` key, which `horizon` copies. Tenancy invariant unchanged: a new product lands in the caller's own
workspace, and no request path reads across workspaces. No scheduler (purge is an owner command), so the scheduler
exemption registry is untouched.

## What already exists (reuse, don't rebuild)
- `lib/provisioning.ts → provisionTenantForUser` — product + owner membership + first key, compensating deletes.
- `lib/cli-auth.ts` — account-wide vs scoped tokens, `withinScope`, `cliUserProjects`.
- `app/api/v1/cli/projects/route.ts` — GET/POST exist; POST goes from ensure to create.
- `app/cli/connect/page.tsx` + `app/api/v1/cli/device/*` — the browser device flow.
- `packages/cli/src/commands/{projects,init,auth}.ts`; `__golden__/help.txt` pins the help.
- `lib/membership.ts` + `lib/workspace-access.ts`; the `project_members_join_workspace` trigger.
- `lib/roadmap-artifact-schema.ts` (optional `board` precedent); `skills/scripts/roadmap-{extract,push}.mjs`; `skills/scripts/lib/stage-facts.mjs`.
- `app/hub/[projectSlug]/horizon/page.tsx` + `lib/horizon-destinations.ts → deriveHorizon`.
- `scripts/permissions-smoke.mjs` + `.claude/permissions-ledger.json`.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | 1.1 One product per signup, not one per person | high |
| 1 | 1.2 `frijoles projects create` really creates | high |
| 1 | 1.3 Login is who you are, not which product | high |
| 1 | 1.4 `init` binds the repo to its product | high |
| 1 | 1.5 New product in the console | low |
| 2 | 2.1 An owner can delete a product | high |
| 2 | 2.2 Purge after 30 days, by the owner | high |
| 2 | 2.3 /connect shows how to install the CLI | low |
| 2 | 2.4 Agents may run `supabase db push` | high |
| 2 | 2.5 roadmap-push works in a first-day repo | low |
| 3 | 3.1 The horizon travels with the roadmap push | low |
| 3 | 3.2 /horizon shows the product's own destinations | low |

**Plan gate decisions (2026-10-13):** one epic, appetite M; destinations declared in the repo; soft delete then an
owner-run purge, not an automatic job; target = bets placed in products other than golden-frijoles, 0 → 3 within 30
days of shipping; no flag.

## Architecture lock (2026-10-13, the architect, verified against live code and production data)

Builders cite these; they do not restate them. Where a decision corrects the scope above, it says so.

**Live data at the lock (prod `slweidgffcfndnskcskc`, read-only):** 6 projects. `golden-frijoles`, `golden-beans` and
`aomx` are hand-seeded (`created_by NULL`) in the workspace "Daniel's products" (`9e58bc7d…`), one member each;
`miyagi` and `champion327` are self-serve (`created_by` set), each in its creator's own workspace. The backfill
(`20261001100000_workspaces.sql`) gave every workspace a `created_by` (it aborts otherwise), so "the caller's own
workspace" is `workspaces.created_by = userId`, exactly what `claimWorkspace` already reads.

- **D1 · The signup marker, in ONE migration, safe in either deploy order** (corrects S1.1's two-phase expand/contract).
  `projects.from_signup BOOLEAN NOT NULL DEFAULT true`; `UPDATE … SET from_signup = false WHERE created_by IS NULL`
  (hand-seeded rows untouched in meaning); `projects_one_per_creator_idx` is dropped and recreated **under the same
  name** as `ON projects(created_by) WHERE created_by IS NOT NULL AND from_signup`. The DEFAULT `true` is the
  expand step: the running code's signup insert never names the column, so it stays guarded before and after the
  deploy; the ONE non-signup writer (`createProductForUser`, D2) writes `false` explicitly. Keeping the index name
  means `CREATOR_CONSTRAINT` in `lib/provisioning.ts` does not change. `findProjectByCreator` gains
  `.eq('from_signup', true)` — with two products per creator its `.maybeSingle()` would otherwise error and strand the
  signup race. Migration: `20261014100000_many_products_signup_marker.sql`.
- **D2 · `createProductForUser(userId, slug)`** in `lib/provisioning.ts`: the caller's own workspace via
  `claimWorkspace` (never one named in a request), a PLAIN insert with `from_signup: false` (never an upsert on slug —
  the existing comment's rule), an owner membership, the owner-stamped connector token (`makerToStamp`, the mint-path
  rule in LEARNINGS), the audit row, and the same compensating delete + `releaseWorkspace` on failure. It shares the
  insert/member/credential tail with `provisionTenantForUser` through one private function; it does NOT mint an
  ingest key (the route never returned one — `frijoles keys create` / `init --ingest` do). Slug: `normalizeSlug`, then
  `isForbiddenSlug` (reserved, `DEMO_PROJECT_SLUG`, `SELF_PROJECT_SLUG`) → `invalid`. Outcomes: `created` ·
  `already_yours` (the caller is an OWNER of that slug → `created: false`) · `taken` (anyone else's, incl. a member
  who is not owner, and a soft-deleted slug: D9) → `conflict`.
- **D2 amendment (the product owner, 2026-10-14 — "Cap per account"):** the verifier on #356 found that an uncapped
  create multiplies an account's event quota (each product carries its own). `workspaces.product_limit` (default 10,
  `20261014110000_many_products_product_limit.sql`) caps the products in the caller's own workspace; past it,
  `conflict` with `reason: limit`. The app checks first for the sentence; a `BEFORE INSERT` trigger that locks the
  workspace row enforces it atomically (`20261014120000`, agy security lens on #356: parallel creates overshot a
  check-then-insert). Names are exact: anything `normalizeSlug` would change is `invalid`, never silently
  rewritten.
- **D3 · `POST /api/v1/cli/projects { slug }`** creates (D2). No `slug` → `invalid` naming it (the ensure is retired:
  every account already has a product from signup). A product-scoped token (`scopeProjectId !== null`) → `not_found`
  for any slug other than its own, and `created: false` for its own (it may not reach siblings, so it may not make
  them). Request-path tenancy: the product lands in the caller's workspace; no read crosses workspaces.
- **D4 · Login is account-wide.** `confirmDeviceCode` calls the existing **3-argument**
  `decide_cli_device_code(code, user, approve)` (still in prod; `20261007100000` kept it on purpose, and
  `collect_cli_device_code` mints `projectId: null` for it). No migration. The approve page loses the product select
  and the "Allow makes your first one" branch (login provisions nothing; `init --create` does). Its grant sentence
  changes from "only that product" to "every product you belong to". `defaultProjectSlug`/`repoHint` stay readable
  but unused on the page (the column and the CLI's `repo` field are harmless; removing them is not this epic).
  Existing scoped tokens keep working unchanged.
- **D5 · `frijoles login` no longer picks a product.** It keeps the saved `activeProject` only if still reachable, and
  otherwise sets one only when the token reaches exactly ONE product (today's `projects[0]` fallback is the
  "linked to the wrong product" bug in the CLI).
- **D6 · The repo binding is `project.slug` in `golden-frijoles.config.json`** (confirmed per S1.4: the kit's config
  core already owns that file and its `project` section; the CLI loads it through `config-core.ts`, and `setKey`
  needs no registry entry, so S1 does NOT wait on a kit release). Precedence for "which product" in every command:
  `--project` > `GOLDEN_FRIJOLES_PROJECT` > the repo's `project.slug` (at `projectRoot`) > the credentials file's
  `activeProject`. Resolved ONCE in `run.ts` into `context.auth.activeProject` (plus `projectSource`), so the dozen
  verbs that read `activeProject` inherit it unchanged. An unreadable config is "no binding", never a crash.
- **D7 · `frijoles init`**: `--project <slug>` binds an existing product (verified against `GET cli/projects`);
  `--create <slug>` calls D3 then binds (`already_yours` binds too); neither + a binding → uses it; neither + no
  binding → at a TTY it asks (existing products + "create one"), under `--json` or no TTY it exits `invalid` naming
  `--project` and `--create` without reading stdin. Both flags → `invalid`. It writes `project.slug` before minting
  (so a failed mint leaves the binding, which is harmless). `projects create <slug>` prints the slug and
  created/already; `--json` carries `{ created, slug }`. Help goldens change on purpose.
- **D8 · New product in the console** (S1.5): a Server Action calling `createProductForUser` with the SESSION user,
  behind the kit's one confirmation shape (`NewThingDialog`), on the portfolio head and the switcher; on success
  `redirect('/app/setup/connect/<slug>')`. The structural gate measures default state: a new head action changes
  `app-portfolio`'s approved state — re-approval is put to the product owner (LEARNINGS: a green gate is not an
  approval).
- **D9 · Soft delete in the database first, code second** (S2.1). `projects.deleted_at TIMESTAMPTZ NULL`
  (`20261015100000_many_products_soft_delete.sql`). Every credential view — `active_ingest_keys`,
  `active_agent_write_keys`, `active_flag_admin_keys` (gains the `projects` join), `active_flag_read_keys`,
  `active_flag_sync_keys`, `active_share_links` — is `CREATE OR REPLACE`d with the same columns and
  `AND p.deleted_at IS NULL`, so every SQL function that reads them inherits it. Code seams: the three reads in
  `lib/membership.ts`, `getWorkspaceProjects`' project read, `resolveConnectorToken`, and every remaining
  `.from('projects')` read on a request path, pinned by a source guard (`lib/soft-delete-guard.test.ts`: every
  `from('projects')` select in `lib/`+`app/` carries `deleted_at` or sits on a named allow-list — fix the class, not
  the instance). The slug stays taken until purge (the row exists). `DEMO_PROJECT_SLUG` and `SELF_PROJECT_SLUG`
  refuse delete. Delete = owner only (`requireCliOwner`); member/stranger → `not_found`.
- **D10 · Purge is one SQL function, owner-run** (S2.2): `purge_deleted_project(p_slug TEXT, p_user_id UUID)
  RETURNS TABLE(outcome TEXT, purge_after TIMESTAMPTZ)` — `not_found` unless the caller is an owner of a project with
  that slug AND `deleted_at IS NOT NULL`; `too_soon` with `deleted_at + 30 days`; else `DELETE FROM projects WHERE
  id = …` (the 26 `ON DELETE CASCADE` FKs and the immutable ledgers' `pg_trigger_depth() > 1` cascade exits do the
  rest — the spec seeds a decision record to prove it). Service-role EXECUTE only. No scheduler, so the exemption
  registry is untouched.
- **D11 · `/connect` install lines** (S2.3) come from `lib/cli-install.ts` + the generated `CLI_VERSION`
  (`lib/plugin-release.generated.ts`); no hand-typed version.
- **D12 · `db push` allowed** (S2.4): the 12 deny spellings (`supabase … db push`, `npx supabase … db push`) leave
  both `settings.json` files and both ledgers; every `db reset` spelling stays; `permissions-smoke` green in both.
- **D13 · roadmap-push in a first-day repo** (S2.5): the failure carries the full stderr (bounded), `--docs-only`
  passes the extract `--live` without `--require-live`, and "no `origin` remote" (`git remote get-url origin` fails)
  is detected BEFORE the extract and degrades to docs-only with one line; a remote whose `gh` call fails still fails.
- **D14 · The horizon travels as data** (S3; **corrects S3.1**). Live: `multi-tenant-activation` lights TWO
  destinations and `commercial-shell` TWO, so one `destination: <id>` per epic cannot reproduce Golden Frijoles'
  horizon. `destination:` takes one id or a comma-separated list (the kit's flat frontmatter parser reads it as a
  string). `Roadmap/00-strategy/horizon.md` declares destinations (`## <id> — <title>` + one-line description, in
  display order). The push gains optional `horizon: [{ id, title, description }]` (≤ 50) and each row an optional
  `destinations: string[]`; the extractor and the schema both reject a row naming an id the horizon lacks, naming the
  epic. `deriveHorizon(destinations, epics)` keeps its lit/partial/coming rule; `HORIZON_DESTINATIONS` is deleted.
  No `horizon` → the `hub-horizon-empty` state. `entity-journeys-projections` keeps `destination: primitives-grid` (it
  does have an epic folder — the lock was wrong), so the mapping reproduces exactly.
- **D14 amendment (Daniel, 2026-10-14):** the horizon lives at **`Roadmap/horizon.md`**, not `Roadmap/00-strategy/` —
  the verifier on #361 found the kit makes `00-strategy/` private on public repos (strategy-private), where a committed
  horizon is impossible and an epic's `destination:` would then fail the whole board push. `litBy` now lists epics by
  build order rather than the old registry's order (the only visible difference on Golden Frijoles' horizon).
  **After the merge deploys**, re-run "Push roadmap artifact" (`workflow_dispatch`): the push that fires on the merge
  can reach the OLD server, whose envelope silently strips `horizon`, leaving the public horizon empty until the next push.

**Routing.** The architect (Opus) builds everything on the auth/tenancy/migration path: S1.1–S1.4, S2.1, S2.2, S2.4.
Sonnet builders take S1.5, S2.3, S2.5 and S3 against the contracts above; the architect diffs every one.

## Deploy order
Migrations first and separately, each applied before its PR merges: S1's signup marker (D1, safe in either order),
S2's soft delete + purge function (D9, D10) before the code that reads `deleted_at`. Then the server (create route, device flow, soft-delete seams), then the CLI release
(npm publish is the product owner's 2FA step) and the kit/plugin release (`skills/RELEASING.md`) for S2.4, S2.5 and
S3.1. Merge to `main` is the deploy; no flag.

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
