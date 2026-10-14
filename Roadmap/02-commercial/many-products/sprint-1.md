---
epic: many-products
sprint: 1
title: "Products, headlessly"
risk: high
phase: Building
stories_total: 5
stories:
  - id: S1.1
    title: "One product per signup, not one per person"
    as_a: "a founder with an account"
    i_want: "to own more than one product"
    so_that: "a second product needs no hand-written SQL"
    risk: high
    status: planned
  - id: S1.2
    title: "frijoles projects create really creates"
    as_a: "a founder's agent"
    i_want: "to create a product from the terminal"
    so_that: "a new repo gets its own product headlessly"
    risk: high
    status: planned
  - id: S1.3
    title: "Login is who you are, not which product"
    as_a: "a founder"
    i_want: "frijoles login to sign in my account without asking for a product"
    so_that: "a new repo is never linked to the wrong product"
    risk: high
    status: planned
  - id: S1.4
    title: "init binds the repo to its product"
    as_a: "a founder's agent in a repo"
    i_want: "frijoles init to bind this repo to an existing product or create one"
    so_that: "the repo, not the login, says which product it is"
    risk: high
    status: planned
  - id: S1.5
    title: "New product in the console"
    as_a: "a founder in the console"
    i_want: "a New product button"
    so_that: "a human can do what the agent can"
    risk: low
    status: planned
---
# Many products — Sprint 1: Products, headlessly

**Status:** ⬜ not started

## Build contract (locked by the architect before the builder started)
Cites the epic README's Architecture lock; nothing here restates it.
- 1.1 → D1 (migration `20261014100000_many_products_signup_marker.sql`; `findProjectByCreator` filter).
- 1.2 → D2, D3 (`createProductForUser`; `POST cli/projects { slug }`; `e2e/cli-projects-create.spec.ts`).
- 1.3 → D4, D5 (3-argument decide; approve page without a product; login's active-project rule).
- 1.4 → D6, D7 (`project.slug` binding resolved once in `run.ts`; `init --project|--create`; `--json` never prompts).
- 1.5 → D8 (Server Action on the session user; `NewThingDialog`; re-approval of the changed state owed).

## Stories

### Story 1.1 — One product per signup, not one per person
**As a** founder with an account, **I want** to own more than one product, **so that** a second product needs no hand-written SQL.
**Acceptance:**
- A migration adds a marker for the product signup creates (`from_signup`, backfilled `true` for every existing row
  with a `created_by`), and the unique index becomes `(created_by) WHERE from_signup` — expand/contract: the code that
  writes the marker ships first.
- Two parallel signup callbacks for one account still produce ONE product (spec on the provisioning seam).
- A second, non-signup product for the same account inserts cleanly.
- Hand-seeded products (`created_by NULL`) are untouched.
- Applied to prod through the Supabase MCP `apply_migration` (or `supabase db push` once S2.4 lands), never with the deploy.
**Risk:** high (migration, tenancy)

### Story 1.2 — `frijoles projects create` really creates
**As a** founder's agent, **I want** to create a product from the terminal, **so that** a new repo gets its own product headlessly.
**Acceptance:**
- `createProductForUser(userId, slug)` in `lib/provisioning.ts` shares `provisionTenantForUser`'s body (product, owner
  membership, compensating deletes) and places the product in the caller's OWN workspace — never one named in the body.
- `POST /api/v1/cli/projects { slug }` creates; a slug the caller already owns answers `created: false`; a slug anyone
  else holds is `conflict`. A product-scoped token refuses (it may not reach siblings).
- `frijoles projects create <slug>` prints the slug and `created`; `--json` carries both. `__golden__/help.txt` is
  updated on purpose.
- The MCP connector gets no create tool in this epic (a connector token is product-scoped).
**Risk:** high (tenancy, auth)

### Story 1.3 — Login is who you are, not which product
**As a** founder, **I want** `frijoles login` to sign in my account without asking for a product, **so that** a new repo is never linked to the wrong product.
**Acceptance:**
- The browser approve page (`app/cli/connect/page.tsx`) no longer asks for a product; the device flow mints an
  account-wide token (`scopeProjectId: null`, as the console mint already does).
- `frijoles whoami` after a fresh login lists every product of the account.
- Existing product-scoped tokens keep working, scoped as before.
**Risk:** high (auth)

### Story 1.4 — `init` binds the repo to its product
**As a** founder's agent in a repo, **I want** `frijoles init` to bind this repo to an existing product or create one, **so that** the repo, not the login, says which product it is.
**Acceptance:**
- `frijoles init --project <slug>` binds to an existing product; `--create <slug>` creates it (S1.2) then binds.
- The binding is written where the repo keeps its settings (confirm first: `golden-frijoles.config.json` or the
  credentials file's `activeProject`) and later commands in that repo use it.
- At a TTY with neither flag and no binding, it asks (existing products + "create one"); under `--json` it never
  prompts: it exits `invalid` naming both flags.
**Risk:** high (shares the create seam)

### Story 1.5 — New product in the console
**As a** founder in the console, **I want** a New product button, **so that** a human can do what the agent can.
**Acceptance:**
- On the portfolio and in the product switcher, **New product** asks for a slug and calls the same create as S1.2,
  then lands on the new product's Connect page.
- Uses the kit's one confirmation pattern; no new design primitives.
**Risk:** low

## Sprint QA
- **api spec(s):** the signup race and second-product insert (S1.1, pure spec on the provisioning seam); `cli/projects`
  POST create / already-yours / someone-else's / scoped-token-refused (S1.2, `e2e` api); account-wide device token (S1.3);
  `init` flag matrix incl. `--json` no-prompt (S1.4, CLI tests + golden help).
- **browser smoke owed:** yes, to the product owner — the signed-in login approve page and New product (auth).
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. In a terminal, run `npx -y @golden-frijoles/cli@<new version> logout`, then `... login`.
   → The browser page asks you to confirm the code, and does NOT ask for a product.
2. Run `... whoami`.
   → It lists golden-frijoles, golden-beans, miyagisanchez and aomx.
3. In an empty folder, run `git init`, then `... init --create smoke-many-1`.
   → It says it created `smoke-many-1` and wrote `.env.local`.
4. Run `... projects create smoke-many-1` again.
   → It says you already have it; nothing changed.
5. (auth — owed to the product owner) Go to https://goldenfrijoles.com/app/portfolio and click **New product**, enter `smoke-many-2`.
   → You land on smoke-many-2's Connect page, and it appears in the switcher.
6. Run `... init --json` in a new empty folder.
   → It exits with an error naming `--project` and `--create`, without waiting for input.

If any step fails, note the step number + what you saw — that's the bug report.
