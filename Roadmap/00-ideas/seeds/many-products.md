---
title: "Many products"
slug: many-products
status: scaffolded
area: "02-commercial"
type: feature
appetite: M
underwritten_by: wave-2026-10
risk: high
epic: "02-commercial/many-products"
build_order: 82
updated: 2026-10-13
intent_ask: verbatim   # verbatim = the product owner's own words below · proxy = reconstructed after the fact
hypothesis: "We believe a founder whose agent can start, bind and delete a product from the terminal will place bets in more than one product, because today a second product takes hand-written SQL and login links a new repo to the wrong one. We'll know when another product places its first bet."
persona: "Startup founders who own the product, running more than one product (or a new repo) from one account, through their agent."
grounded: true         # true = traced to a North Star input with a target · false = funded anyway (say why below) · null = Bug/Chore
grounded_reason: null  # required with grounded: false — one sentence (references/result-record.md → The challenge)
target_metric: bets_placed_per_workspace
target_from: 0         # bets placed in a product OTHER than golden-frijoles this month (Roadmap/bets/, 2026-10-13: all 26 October bets are golden-frijoles')
target_to: 3           # within 30 days of shipping (the product owner, 2026-10-13)
read_date: null        # when we read it, YYYY-MM-DD; null = 30 days after shipping
flag_key: null         # Stage 6b: no flag — ship straight to prod, rollback is git revert (feedback: ship enabled, not dark)
target_segment: null   # the bet's TARS target segment: `everyone` (the only one until tars-segments) · null = not measured
adopted_event: null    # the event that means "adopted" (Stage 6b, Measure) · null = not measured
retained_event: null   # the repeat that means "retained" · null = the adoption event again
retention_days: null   # the retention window in days (1–90) · null = 7
satisfied_event: null  # optional: the event that means "satisfied" (a rating) · null = not measured
intent_match: 91
---

# Pitch — Many products

Moves: bets_placed_per_workspace · Tests: Growth strategy

## The ask, as given

> now, im signed in golden frijoles, and have multiple products. How do i create a new one? CLI, MCP, or else headless mode is always preferred. So that opens a new question, should the cli be authed at product or portfolio level? i guess that depends on the type of user, which we only have one right now right? We cant invite users to a portfolio and assign them roles.
>
> This comes after trying to install the plugin on a new project. I wanted to have the cli authed by itself, just make sure it was there already, so i went to the /connect route to see if we had the handy command in there but no (btw we should support more packages like at least brew, or you think npx as is is the best?) [...]
>
> So i ran the first command npx -y @golden-frijoles/cli@1.5.1 login it opened the webpage asking me to select a product, but since this is a brand new if i had chosen one of the existing ones, i would have linked to the wrong one, so what do you think? lets think of the ux again from the user pov. I guess if the cli was authed already at portfolio level then this would all be solved right? and well of course to allow for users and their agents to create new products headlessly and for humans in the ui. Whats the heuristic here? i feel like i have complicated this process so would like for you to help us stay lean.
>
> and how could i delete an existing product?
>
> [...] but why do i want to block supabase pushes? i dp not want that at all, make it permanent
>
> [after `roadmap-push` failed with "live facts could not be gathered" on the new repo] ok it pushed, now lets refine the permanent solution folding in what you found also here. And ive realized also that the /horizon is hard coded to my original project. Lets trace how it should be set and connected to what, I mean, this is intended to be the highest level of abstraction of a roadmap.

### Claims
1. A signed-in person can create a new product headlessly (CLI / MCP), and a human can in the UI.
2. The CLI is signed in as the person, not as one product, so login never asks which product.
3. A new repo is never linked to the wrong product.
4. `/connect` shows the install and help commands.
5. An owner can delete a product.
6. Agents may run `supabase db push`; the block is removed for good.
7. `roadmap-push` works (or says why it can't) on a brand-new repo.
8. `/horizon` shows each product's own destinations, as the highest level of that product's roadmap.
9. Stay lean: no roles, no invites.

**Teach-back:** yes — "You want a signed-in person, or their agent, to start a new product from the terminal or the UI without hand-written SQL, with a repo binding to the right product, and with `/horizon` showing that product's own destinations, so that a second product is as easy as the first. Right?" (asked 2026-10-13; answered by approving the packaging, appetite, horizon source and delete shape)

## Problem

A self-serve account can own exactly one product. `projects_one_per_creator_idx`
(`20260721100000_self_serve_tenants.sql:60`) was a signup double-click guard, but it is also the only reason
`frijoles projects create` is an "ensure" that never creates. The product owner's other products exist only because
they were hand-seeded with `created_by NULL`; `aomx` had to be created by hand in prod on 2026-10-13.

Around it, four things made a second product hard to start:
- `frijoles login` (the browser approve page, `app/cli/connect/page.tsx`) makes a token scoped to ONE product and
  asks for it — before the new repo has a product to pick. Picking an existing one links the repo to the wrong one.
- `/connect` doesn't show how to install the CLI or ask it for help.
- `roadmap-push` on a repo with no `origin` fails with a generic message: it keeps only the last stderr line
  (`skills/scripts/roadmap-push.mjs:107`), hiding the real cause, and advises `--docs-only`, which it can't accept
  (it hardcodes `--live --require-live`, :101).
- `/horizon` reads one hardcoded list (`lib/horizon-destinations.ts → HORIZON_DESTINATIONS`) of Golden Frijoles'
  own destinations, for every product.

There is no way to delete a product at all. Separately, the committed deny list blocks `supabase db push` for agents,
which the product owner does not want.

## Appetite

M — three sprints in one epic run: products headlessly, delete + the folded-in fixes, the per-product horizon.
quote: $15–33 (M, n=23, p25–p75)

## Outcome & signal

- An agent in a fresh repo runs `frijoles login` (no product question), `frijoles init --create aomx-2`, and ends with a
  new product, bound to that repo, with its key in `.env.local`. No SQL.
- A human clicks **New product** on the portfolio and gets the same product.
- `frijoles projects delete aomx-2 --confirm aomx-2` makes it disappear from every list, and its keys stop working.
- A repo with no remote runs `roadmap-push` and the board lands (docs-only stages), or the message names the cause.
- `/hub/aomx/horizon` shows aomx's destinations, or an empty state saying how to declare one — never Golden Frijoles'.

## Stage-2.5 bucket

**Light enhancement on existing seams, plus one migration.** Account-wide CLI tokens already exist
(`lib/cli-auth.ts:103`: `scopeProjectId: null` from the console mint); provisioning already creates a product,
its owner membership and its keys (`lib/provisioning.ts`); the roadmap push already carries an optional, additive
`board` key, which a `horizon` key copies. Only the one-per-creator rule and soft delete need the database.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| Signup-only uniqueness: the index covers only the product signup creates (a `from_signup` marker), not every product a person creates | keeps the double-click guard, ends the one-product limit |
| `createProductForUser(userId, slug)` in `lib/provisioning.ts`, in the caller's own workspace | one creation path for the CLI, the connector and the UI |
| `frijoles projects create <slug>` really creates (already-yours → `created: false`) | headless, idempotent for agents |
| Login mints an account-wide token; the approve page stops asking for a product | login = who you are |
| `frijoles init` binds the repo: `--project <slug>`, or `--create <slug>`, or asks (TTY) / fails naming both (`--json`); writes the slug to `golden-frijoles.config.json` | the repo, not the login, says which product it is |
| **New product** button (portfolio + switcher) → same function | humans in the UI |
| Soft delete: `projects.deleted_at`; owner-only `frijoles projects delete <slug> --confirm <slug>` + a console button; the membership seam and `lib/auth.ts` treat a deleted product as not found | gone at once, keys dead, recoverable |
| `frijoles projects purge <slug>` (owner, ≥30 days after delete) | the data really goes, without a cross-tenant scheduler |
| `/connect`: `npm i -g @golden-frijoles/cli`, the pinned `npx` form, `frijoles --help` | the command the product owner looked for |
| Remove the `supabase db push` deny (keep `db reset`): settings.json + permissions-ledger.json + `skills/template` + AGENTS.md | the product owner wants agents to push migrations |
| `roadmap-push`: print the real cause; accept `--docs-only`; a repo with no remote pushes docs-only with a one-line note | a first-day repo works |
| `Roadmap/00-strategy/horizon.md` (destinations) + epic frontmatter `destination: <id>`; extract + push carry optional `horizon`; `/horizon` reads the artifact | each product's own horizon, declared where its roadmap lives |
| Golden Frijoles' current list moves into its own `horizon.md`; `HORIZON_DESTINATIONS` is deleted | no product sees another's destinations |

## Scope
**In v1:** everything in the table above.

**Out of v1 (no-gos):**
- Roles, invites, workspace members other than the owner (one user type today).
- Brew / other package managers (`npm i -g` + pinned `npx` on `/connect` instead; a tap is a release surface to maintain).
- An automatic 30-day purge job — it would be a cross-tenant scheduler, which needs its own approval and a registry row
  (AGENTS → *The scheduler exemption*). Purge is an owner command in v1.
- A portfolio-level horizon across products (a later read through `getWorkspaceProjects()`, built on these files).
- Editing destinations in the console (they're repo-declared, like the rest of the roadmap).
- Lifting the `supabase db reset` deny.
- Moving a product between workspaces, renaming a slug.

## Rabbit holes

- **The signup guard.** The index must still make two confirmation callbacks for one signup produce ONE product.
  Marker column + partial unique index `(created_by) WHERE from_signup`; existing self-serve rows backfill
  `from_signup = true`. Hand-seeded rows (`created_by NULL`) are untouched. Expand/contract: the code that writes
  the marker ships before the index changes.
- **Soft delete reaches every read.** All project-access reads pass through `lib/membership.ts` (three reads) and
  `lib/auth.ts` (keys); connector tokens and share links resolve through `api_keys`. The filter goes in those seams,
  and a spec proves a deleted product's ingest key, connector token and share link all fail. A deleted slug stays
  reserved until purge.
- **Delete the public project.** `golden-frijoles` (the `DEMO_PROJECT_SLUG`) refuses delete: rule #2 would 403 its
  own landing.
- **Scoped tokens already out there.** Existing single-product tokens keep working; only new logins are account-wide.
- **`init` in `--json` mode never prompts.** With no `--project`/`--create` and no repo config, it fails with code
  `invalid` naming both flags — an agent must not get a hung prompt.
- **The horizon in the extract.** `horizon` is an optional, additive envelope key (the `board` precedent in
  `roadmap-artifact-schema.ts:242`); a push without it stores none, and the page shows the empty state, not stale data.
  An epic naming an unknown `destination:` is a push error naming the epic.
- **Two releases.** The kit (`roadmap-extract`/`roadmap-push`) is a plugin release (`skills/RELEASING.md`); the CLI is
  an npm publish (the product owner's 2FA step).

## What already exists (reuse, don't rebuild)

- `lib/provisioning.ts → provisionTenantForUser` — product + owner membership + first key + connector token, with
  compensating deletes; the new create shares its body.
- `lib/cli-auth.ts` — account-wide vs scoped tokens (`scopeProjectId`), `withinScope`, `cliUserProjects`.
- `app/api/v1/cli/projects/route.ts` — GET/POST already exist; POST changes from ensure to create.
- `app/cli/connect/page.tsx` + `app/api/v1/cli/device/*` — the browser device flow (has a `repoHint`).
- `packages/cli/src/commands/{projects,init,auth}.ts` — the verbs; `__golden__/help.txt` pins the help (changes on purpose).
- `lib/membership.ts` + `lib/workspace-access.ts` — the one seam every project read passes; `project_members_join_workspace` trigger.
- `lib/workspace.ts → getWorkspaceProjects` — the later portfolio horizon's only path.
- `lib/roadmap-artifact-schema.ts` (optional `board` key precedent) + `skills/scripts/roadmap-{extract,push}.mjs` + `lib/stage-facts.mjs`.
- `app/hub/[projectSlug]/horizon/page.tsx` + `lib/horizon-destinations.ts → deriveHorizon` (keep the derivation, drop the constant).
- `scripts/permissions-smoke.mjs` — the ledger guard that must stay green after the deny removal.

## Visuals

```mermaid
flowchart LR
  PO([Founder or their agent]) -- frijoles login --> T[account-wide CLI token]
  PO -- New product --> UI[console: portfolio / switcher]
  T -- projects create / init --create --> API[/api/v1/cli/projects/]
  UI --> API
  API -- createProductForUser --> DB[(projects + project_members<br/>in the caller's workspace)]
  PO -- init --project --> CFG[repo: golden-frijoles.config.json]
  REPO[repo: Roadmap/ + 00-strategy/horizon.md] -- roadmap-push --> ART[(roadmap artifact<br/>rows + board + horizon)]
  ART --> HZ[/hub/&lt;product&gt;/horizon/]
```

```surface
state: hub-horizon-empty
route: /hub/aomx/horizon
- head "Horizon" lede "The end states this product is walking toward, and which epics light each one."
- empty "No destinations yet. Declare them in Roadmap/00-strategy/horizon.md and name one in an epic's `destination:`, then run roadmap-push."
```

## UX heuristics & rails check
- **CI guards covering this surface:** `golden.test.ts` (CLI help bytes), `permissions-smoke` (deny ledger),
  `lib/gates-guard.test.ts`, the semantic-lint `tenancy` rule (shadow), the surface/visual gate for `hub-horizon`
  (a new empty state needs its approved state), `project-route-inventory.test.ts`.
- **Audits-lens findings that apply:** none checked yet — the builder looks in `Roadmap/00-ideas/audits/` at S1.
- **Design-language debt (if any):** none known; New product / Delete reuse the kit's ONE confirmation pattern.

## Kill-switch / runtime gate (risk:high only — Stage 6b)
No flag (the product owner's standing call, 2026-08-31: ship enabled, not dark). Rollback is `git revert`; the
migration is expand/contract so a revert of the code leaves a working schema.

## Acceptance criteria

**S1 — Products, headlessly** (risk high: tenancy, migration, auth)
- `frijoles login` in a fresh terminal never asks for a product; `frijoles whoami` lists every product of the account.
- `frijoles projects create aomx-2` creates it in the caller's workspace with them as owner; running it again says `created: false`.
- Two parallel signup callbacks still produce one product (spec).
- `frijoles init --create aomx-3` in a repo writes the slug to its config and a key to `.env.local`; `frijoles init` with no flags in `--json` exits `invalid` naming `--project` and `--create`.
- **New product** in the console creates the same product. QA: pure specs on the create seam + api suite; browser smoke owed by the product owner.

**S2 — Delete, `/connect`, and the folded-in fixes** (delete: high; the rest: low)
- `frijoles projects delete <slug> --confirm <slug>` (owner only; a member gets not-found) hides it from every list; its ingest key, connector token and share link fail (spec each). `golden-frijoles` refuses.
- `frijoles projects purge <slug>` refuses before 30 days, removes everything after.
- `/connect` shows `npm i -g @golden-frijoles/cli`, the pinned `npx` form and `frijoles --help`.
- An agent can run `supabase db push`; `supabase db reset` is still denied; `permissions-smoke` green; AGENTS.md no longer describes the push block.
- In a repo with no `origin`, `roadmap-push` pushes the docs-only board with one line saying why; `--docs-only` is accepted; a real failure prints its real cause.

**S3 — Each product's own horizon** (risk low: additive schema)
- `Roadmap/00-strategy/horizon.md` + `destination:` in epic frontmatter reach `/hub/<product>/horizon` through roadmap-push.
- Golden Frijoles' horizon looks the same as today, read from its own file; `HORIZON_DESTINATIONS` is gone.
- A product with no `horizon.md` shows the empty state above; an epic naming an unknown destination fails the push naming the epic.
- The `bets_placed_per_workspace` reading counts bets pushed from every product in the workspace, not only this repo's — confirmed by reading it after aomx places one (or the gap is filed and the target read by hand).

## Open risks / research
- **The target counts only the part this moves** (Plan gate, 2026-10-13): the workspace total is dominated by this
  repo's own pace (26 bets in October to date, all golden-frijoles'), so the read is bets placed in the workspace's
  OTHER products — 0 today, 3 within 30 days of shipping. It holds only if the reading sums every product's ledger
  (S3's last check).
- **Purge is an owner command, not an automatic job** (Plan gate decision b, 2026-10-13).
- Is `golden-frijoles.config.json` already the place `init` remembers a product, or is that only the credentials file's
  `activeProject`? The builder confirms at S1 before adding a key.

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/many-products.md
  coverage in   0.95  (9 claims)
  coverage out  0.86  (13 criteria)
  clarity       0.83  (13 criteria)
  teach-back    1.00  (yes)
  agreement     pending  (the optional reader at the architecture lock)
  why story     0.44  (advisory, not in the total: rewrite the Why as a story)
Total 91 / 100 — uncalibrated · signals: coverage in, coverage out, clarity, teach-back
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.949,"coverage_out":0.856,"clarity":0.826,"teach_back":1,"total":91} -->
