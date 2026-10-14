---
epic: many-products
sprint: 2
title: "Delete, /connect and the folded-in fixes"
risk: high
phase: Shaping
stories_total: 5
stories:
  - id: S2.1
    title: "An owner can delete a product"
    as_a: "a founder who owns a product"
    i_want: "to delete it from the terminal or the console"
    so_that: "a mistake or a dead product disappears and its keys stop working"
    risk: high
    status: planned
  - id: S2.2
    title: "Purge after 30 days, by the owner"
    as_a: "a founder who deleted a product"
    i_want: "to purge its data once 30 days have passed"
    so_that: "the data really goes, without a cross-tenant job"
    risk: high
    status: planned
  - id: S2.3
    title: "/connect shows how to install the CLI"
    as_a: "a founder on the Connect page"
    i_want: "the install and help commands"
    so_that: "I can get the CLI without asking an agent"
    risk: low
    status: planned
  - id: S2.4
    title: "Agents may run supabase db push"
    as_a: "the product owner"
    i_want: "agents to apply migrations with supabase db push"
    so_that: "a migration is not a hand step"
    risk: high
    status: planned
  - id: S2.5
    title: "roadmap-push works in a first-day repo"
    as_a: "a founder with a brand-new repo"
    i_want: "roadmap-push to push my board, or tell me the real reason it can't"
    so_that: "the first push isn't a dead end"
    risk: low
    status: planned
---
# Many products — Sprint 2: Delete, /connect and the folded-in fixes

**Status:** ⬜ not started

## Stories

### Story 2.1 — An owner can delete a product
**As a** founder who owns a product, **I want** to delete it from the terminal or the console, **so that** a mistake or a dead product disappears and its keys stop working.
**Acceptance:**
- A migration adds `projects.deleted_at` (expand/contract).
- `frijoles projects delete <slug> --confirm <slug>` (owner only; a member or stranger gets not-found) and a console
  button with typed confirmation set it.
- A deleted product is "not found" everywhere: the three reads in `lib/membership.ts` and key resolution in
  `lib/auth.ts`. A spec proves its ingest key, connector token and share link each fail.
- The slug stays reserved until purge.
- `golden-frijoles` (the public `DEMO_PROJECT_SLUG`) refuses delete (rule #2 would 403 its own landing).
**Risk:** high (auth, tenancy, migration)

### Story 2.2 — Purge after 30 days, by the owner
**As a** founder who deleted a product, **I want** to purge its data once 30 days have passed, **so that** the data really goes, without a cross-tenant job.
**Acceptance:**
- `frijoles projects purge <slug> --confirm <slug>`: refuses before 30 days (saying the date it becomes possible);
  after, removes the product and everything that points at it, scoped to that one `project_id`.
- No scheduler and no cron (Plan gate decision b, 2026-10-13: an automatic job would need its own scheduler exemption).
**Risk:** high

### Story 2.3 — /connect shows how to install the CLI
**As a** founder on the Connect page, **I want** the install and help commands, **so that** I can get the CLI without asking an agent.
**Acceptance:**
- `/connect` shows `npm i -g @golden-frijoles/cli`, the pinned `npx -y @golden-frijoles/cli@<version>` form (version from
  `packages/cli`, never typed by hand) and `frijoles --help`.
- No brew (no-go for v1).
**Risk:** low

### Story 2.4 — Agents may run `supabase db push`
**As the** product owner, **I want** agents to apply migrations with `supabase db push`, **so that** a migration is not a hand step.
**Acceptance:**
- Every `db push` deny spelling leaves `.claude/settings.json` and `.claude/permissions-ledger.json`; every `db reset`
  spelling stays. `scripts/permissions-smoke.mjs` green.
- The same change in `skills/template` (a plugin release, `skills/RELEASING.md`).
- AGENTS.md (Workflow + quick-reference) and WAYS-OF-WORKING no longer say agents can't push; they say migrations are
  still a separate step from the deploy.
**Risk:** high (shared infra)

### Story 2.5 — roadmap-push works in a first-day repo
**As a** founder with a brand-new repo, **I want** `roadmap-push` to push my board, or tell me the real reason it can't, **so that** the first push isn't a dead end.
**Acceptance:**
- A failed extract prints its real cause (today `roadmap-push.mjs:107` keeps only the last stderr line).
- `roadmap-push --docs-only` is accepted and pushes the docs-only stages.
- A repo with no `origin` remote (so no branches and no PRs) pushes the docs-only board with one line saying why,
  instead of failing. A repo WITH a remote whose `gh` call fails still fails, naming the cause.
- Kit release; `skills/plugins/.../refine/vendor` copies stay byte-identical where the kit vendors them.
**Risk:** low

## Sprint QA
- **api spec(s):** deleted product's ingest key / connector token / share link / membership reads all not-found (S2.1);
  purge before/after 30 days (S2.2); `permissions-smoke` (S2.4); `roadmap-push` unit tests for the three failure shapes (S2.5).
- **browser smoke owed:** yes, to the product owner — the console delete (auth) and /connect.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Go to https://goldenfrijoles.com/connect
   → It shows `npm i -g @golden-frijoles/cli`, the `npx` form and `frijoles --help`.
2. Run `... projects delete smoke-many-1 --confirm smoke-many-1`.
   → It says deleted; `... projects ls` no longer lists it.
3. Send one event with smoke-many-1's old `.env.local` key (`... status --project smoke-many-1`).
   → It is refused (not found).
4. Run `... projects purge smoke-many-1 --confirm smoke-many-1`.
   → It refuses and names the date purge becomes possible.
5. (auth — owed to the product owner) In the console, delete smoke-many-2 from its settings with the typed confirmation.
   → It disappears from the portfolio and the switcher.
6. Run `... projects delete golden-frijoles --confirm golden-frijoles`.
   → It refuses: the public project can't be deleted.
7. In an empty folder with a Roadmap but no git remote, run `npx -y @golden-frijoles/kit@<new version> roadmap-push --env-file .env.local`.
   → It pushes, with one line saying it pushed docs-only stages because there is no remote.

If any step fails, note the step number + what you saw — that's the bug report.
