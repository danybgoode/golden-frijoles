# Golden Frijoles — Product Roadmap & Feature Poster

> **Mission:** Give a product team one primitive set — telemetry ingest, an SDK, a TARS funnel, a
> North Star metric, and A/B experiments — to run growth and experimentation without stitching
> vendors together. Multi-tenant by design; dogfooded against real product funnels.

This folder is the **product source of truth**. It speaks in plain product language for product,
design, and business — **no engineering or tech specs here** (those live in `tasks/` and team memory).

---

## How this roadmap is organized

```
Roadmap/
├── README.md                ← you are here · the product poster (all features)
├── WAYS-OF-WORKING.md       ← how we plan, build, ship (scrum cadence) + tooling
├── LEARNINGS.md             ← the cross-cutting retro digest, read at every session start
├── SESSION-KICKOFFS.md      ← thin-pointer prompt cheat sheet for starting a session
├── 00-ideas/                ← the idea funnel (seeds, audits, the generated BUILD-ORDER.md)
└── <Macro-section>/         ← a product domain (a journey, not a component)
    ├── README.md            ← what this area is, for whom, current features
    └── <Epic>/              ← a meaningful body of work
        ├── README.md        ← the epic's product overview
        ├── sprint-N.md      ← the sprint's user stories (As a… I want… so that…)
        └── RETROSPECTIVE.md ← what we learned
```

**Levels:** `Roadmap → Macro-section → Epic → Sprint → User Story`. Each user story is a small,
independently shippable slice of value.

---

## The macro-sections (product domains)

| # | Macro-section | Covers |
|---|---|---|
| 01 | Growth Engine | Telemetry ingest, SDK, TARS funnel (Targeted/Adopted/Retained), North Star metric, A/B bucketing — the core engine. |
| 02 | Commercial | The public offer: landing page (end-state-driven, backfilled by every epic), waitlist, connector install page, tenancy/pricing, outcome reports — Golden Frijoles as a product, not just an engine. |
| 09 | Platform & Infra | Engineering/observability work that isn't a user-facing product domain — deploy pipeline, dev tooling, cross-cutting process (this convention — reserving `09` for platform/infra — is a deliberate carry-over from the origin project; keep the number stable so tooling that reads it doesn't need per-project config). |

---

## Feature map

<!-- Convention: ✅ means enforced in code, not merely intended — partial/aspirational is 🚧.
     Updating this map is part of the epic Definition of Done (see WAYS-OF-WORKING.md); one
     `### <NN> · <name>` heading per macro-section row above. -->

### 01 · Growth Engine
- 🚧 [Scenarios made PM-operable](01-growth-engine/scenarios-pm-operable/README.md) (owner define ·
  bounded launch/retry/stop · explicit target state · honest impact comparison and immutable evidence
  links) — **code and migration are live, authoring remains dark** (2026-08-13, PR #98, `5bca24c`).
  Signed-in owners now have one project-scoped operating surface over the existing scenario engine;
  members keep the read-only evidence view. The enablement gate stays OFF until a verified synthetic
  production launch/stop and the product owner's rendered-claim judgment are complete. #14's chart
  decision remains open, so impact uses the documented comparison-table fallback.
- ✅ [SDK 1.0: one line to start, who the user is, and North Star inputs](01-growth-engine/sdk-1-0/README.md) —
  **shipped 2026-10-09** (#331; `@golden-frijoles/sdk` 1.0.0). `createGrowthEngineClient({ apiKey })` defaults to
  goldenfrijoles.com (an empty `baseUrl` fails rather than defaulting); `identify`/`reset`; `pushInputValues` for North
  Star inputs; ESM and CommonJS; one-line quickstarts. Everything 0.6.0 did still works, pinned by a freeze test.
  **Owed:** the `_Intent_` word and one live identify + track.
- ✅ [Flag control plane + Miyagi migration + resilience/SecOps](01-growth-engine/flag-serving-and-prd-g/README.md)
  (typed/versioned flag registry · local snapshot provider · complete 40-key Miyagi cutover · closed
  resilience/security scenarios · policy-bound circuit breakers · generic project catalog sync ·
  discoverable Flags/Agent queue) — Golden authority is live in both Miyagi services on snapshot `47`; the
  owned-shop feature remains ON behind its normal Golden-managed killswitch, the internal production
  exercise and manual/automatic protective transitions are evidenced, and all three proof-only gates
  are back OFF. The authenticated browser walkthrough was unavailable to this session; HTTP
  auth-boundary proof is recorded.
- ✅ [A/B tests for humans](01-growth-engine/experiments-for-humans/README.md) (five-question
  builder · served experiment bindings · decision-first readout · decide in chips + roll out with
  undo · JSON authoring retired) — **live in production** (2026-09-25, PRs #167, #169, #170, #172).
  An owner plans, starts, reads and decides an experiment without writing JSON; the page leads with
  what to do next, and every Production flag write is a compare-and-set that refuses to override a
  change it did not plan against.
- ✅ [Growth Engine v1](01-growth-engine/growth-engine-v1/README.md) (telemetry ingest · SDK · TARS
  funnel · North Star metric · A/B bucketing) — live in production at
  `https://goldenfrijoles.com`, dogfooded against Miyagi's real setup-guide funnel.
- ✅ [Event destination router](01-growth-engine/event-destination-router/README.md) (versioned
  actor/subject event contract · transactional outbox · tenant-managed **signed webhook
  destinations** · bounded retry/dead-letter + operator replay · delivery operating view) —
  **delivery LIVE in production** (2026-07-22). A tenant creates a signed, filtered destination and
  receives their events reliably, at-least-once, without ingest ever depending on a sink's health.
  First real consumer: Miyagi's merchant-lifecycle projection (Story 3.1, in `medusa-bonsai`). The
  optional Attio adapter (3.2) is deferred until a workspace token exists.
- ✅ [Entity journeys](01-growth-engine/entity-journeys-projections/README.md) (versioned,
  tenant-defined lifecycles · deterministic subject history · cohort conversion/aging/drop-off ·
  exact retention · authenticated UI/API + gated MCP parity) — **live in production** (2026-07-23).
  Miyagi's 13-stage founding-merchant lifecycle is the first proof. Measured production p95 stayed
  under 120 ms with 13 relevant events, so the engine keeps its simpler query-time architecture.

### 02 · Commercial
- ✅ [Golden Frijoles CLI v1 — a write surface an agent can drive](02-commercial/golden-frijoles-cli/README.md)
  — `gf`, published as `@golden-frijoles/cli`. An agent can create a flag **in every environment**,
  roll it out and kill it with no browser and no human click: `gf flags create <key> --kill-switch
  --all-envs` is the line that used to stop and wait for someone to open the console. Built on a
  **user-scoped CLI token** minted at *Setup › CLI access* (its own table — `api_keys` cannot express
  a credential that exists before a project does), and every write goes through the SAME RPCs the
  console uses. The decisions — polarity, kill-clears-every-rule, percent-not-clamped — live in ONE
  pure command core in the SDK, which the CLI and the connector's new **MCP flag tools** both call,
  so parity is structural. `/install` now leads with the CLI. **Live in production** (2026-09-18,
  PRs #149–#152); the npm packages are `@golden-frijoles/cli@0.1.0` and `@golden-frijoles/sdk@0.5.0`.
- ✅ [The mockups, as built](02-commercial/mockups-as-built/README.md) — the previous epic shipped six
  sprints, reported **27/27 coverage with `outstanding: []`**, and the console still did not look like
  the approved design. Three facts explained the whole gap: the old UI had been **hidden behind
  sixteen `<details>` disclosures** rather than replaced, the assertion on 25 of 27 routes was
  *"status < 400 and the `<main>` contains at least one `ds-` class"* (which a JSON textarea inside a
  collapsed disclosure satisfies), and the coverage number was computed from a **hand-typed boolean**.
  Now: **22 of 22 routes match their approved state's structural signature, measured** — a contract
  generated from the approved prototype that asserts the ordered block sequence, the tile count, the
  column labels, the primary action's words and that the number of `<details>` is **zero**, with a
  committed floor that fails a PR which lowers it. Every disclosure on a rebuilt surface is gone and
  **no capability went with them** (journey create+activate, experiment create/transition/bind,
  scenario launch+stop and delivery replay all still work, from the approved wizard shape as a modal).
  Two screens that never existed were built — a **North Star** Measure surface and **Flag history's**
  pagination — and `CONSOLE_SHELL_ENABLED` is deleted from the repository and every Vercel
  environment. **Live in production** (2026-09-10) — walked through signed-in on goldenfrijoles.com,
  including every `+ New …` opening the approved wizard shape as a modal (PR #140).
- ✅ [One design system, every surface](02-commercial/design-system-rails/README.md) — the design now
  lives **in the product**, at `apps/web/design-system/`, and it outlives the epic that produced it.
  Three prior design epics each scoped their design to themselves and left it in a closed epic's
  folder; the audit could still find *two routes in twenty-six* using the component kit. All **27**
  in-scope routes render from one system now — the 21 console routes through `ProductShell`, the nine
  doors and hub routes through `Frame` — each against an approved reference state, with the visual
  gate blocking on every PR and a **ratchet that fails a PR which lowers coverage**. The approved
  prototype's 32 states are hash-pinned in `APPROVED.md`, the tokens and stylesheet are **generated
  from it** (so "one definition" holds by construction rather than by discipline), and
  `MEASURED-SPEC.md` is emitted rather than typed. The old design is **deleted**, not layered over:
  32 `.product-shell` rules, 16 compensating `.is-console` rules and the `.auth-shell` card are gone,
  and a guard fails if any of them return. **Live in production** (2026-09-02, `3258381`) — verified
  by probing the deploy: `/login` serves `ds-door` where it served `auth-shell`, and `product-shell`
  no longer appears in any production HTML. No flag and no dark period: the merge was the release,
  and rollback is `git revert`.
- ✅ [Four destinations — an information architecture for the signed-in console](02-commercial/console-ia-overhaul/README.md)
  — the signed-in product had **sixteen destinations and no information architecture**, presented as
  one flat list ordered by the sprint that built each. It now has **four sections** (Today · Measure ·
  Ship · Setup) generated from the route inventory, a per-section rail, `⌘K` over every surface AND
  every feature key, and a per-feature destination carrying the whole loop — its switch, its rules,
  its **Funnel** and its **Impact**, the last two of which used to be routes whose own nav
  descriptions told you to edit the URL. **Live in production** (PRs #122/#123/#124 + Sprint 3B):
  `CONSOLE_SHELL_ENABLED=true` in all three Vercel scopes, proved by both Setup routes going
  **404 → 307** across the deploy. The flags page carries no JSON and no talk of immutable versions;
  creating a feature is a three-step wizard where the only thing anyone types is the word the code
  will import. The approved design is **binding and measured** —
  `design/CONSOLE-CONTRACT.md` plus a visual gate that runs in CI and can go red on the way a page
  looks, which is the thing this epic's own plan could not do until it was rewritten mid-flight.
- ✅ [Golden Frijoles rebrand close-out](02-commercial/frijoles-rebrand-closeout/README.md)
  (published `@golden-frijoles/sdk@0.4.0` · explicit OpenFeature identity break · deprecated old SDK
  pointer · footer-ledger deletion · authenticated mobile sweep) — **live in production 2026-08-13**
  (PR #96, `0a0beb0`). The package clean-installs from npm, the SDK section named the package that
  exists (that section was retired by `landing-readability-pass` on 2026-08-20; `/install` carries
  the install line now), and the
  signed-in sweep repaired shared sortable-header targets plus scenario/destination table overflow.
  Wire envelope `golden_beans.webhook.test`, historical tenant slugs, and integration addresses stay
  deliberately stable because other systems resolve them.
- ✅ [A preview deployment stops calling itself localhost](09-platform-infra/site-url-preview-aware/README.md) —
  `SITE_URL` is Production-scoped, so every preview rendered every absolute URL as
  `http://localhost:3000` — the hero's copy-a-prompt card told a reader's agent to fetch their own
  machine. Nothing failed; it was consistently the wrong host, which is how it survived two epics.
  `getSiteUrl()` now derives a preview's hostname from Vercel's platform variables (**not** a request
  Host header — AGENTS rule #5 is untouched and now structural), `SITE_URL` still wins so production
  is unaffected, and a registry test forces every new caller of that seam to declare whether it hands
  someone a URL they keep.
- ✅ [The public surface names the category](02-commercial/agentic-pm-public-surface/README.md) —
  **agentic product management**, defined once in `lib/positioning.ts` and imported by all five
  outward surfaces (landing, link preview, `/llms.txt`, the workshop, `/methodology`) so no two can
  drift. The hero hands the reader a prompt for their own agent instead of two illustrations;
  §product and §proof are retired and the nav is **Ops · Pricing · Methodology**.
  `/northstar-self-serve.md` is a real North Star workshop — the three games, the
  North Star → Inputs → Opportunities → Interventions ladder, the seven-question checklist,
  breadth/depth/frequency/efficiency, worked examples — and `/llms.txt` is an operating brief that
  tells a visiting agent what to ask before it recommends anything.
- ✅ [The methodology gets a room of its own](02-commercial/methodology-experience/README.md) —
  `/methodology` plus six chapter URLs, server-rendered and deep-linkable, with the whole method in
  ONE typed module (`lib/methodology-chapters.ts`) that the pages, the index, the sticky
  phase-grouped rail, the route metadata, the sitemap and the downloadable edition all derive from.
  The maker loop reads as three portfolio moves (Consider · Operate · Exit) and the method's second
  move is **Design**, everywhere a reader can see it. A reading shell with the work-block family as
  primitives (contrast measured, not assumed), an Apple-materials pass whose
  `prefers-reduced-transparency` / `prefers-contrast` / `prefers-reduced-motion` fallbacks ship in
  the same story and are verified through CDP, and read progress that renders NOTHING rather than a
  zero it cannot stand behind. **Agent-readable by design**: per-route metadata, a generated
  markdown edition at `/methodology/edition.md`, and the sitemap + `robots.txt` this site did not
  have.
- ✅ [The landing reads at a glance — the maker-ops page, cut down to what it claims](02-commercial/landing-readability-pass/README.md)
  (one statement per claim · no green ink · §connect and §sdk retired into `/install` · the hero at
  the mockup's scale, its two objects overlapping) — **live in production 2026-08-20** (PR #102,
  `0ec12b3`), serving on **https://goldenfrijoles.com**. `landing-maker-ops` earned its honesty the
  hard way and then said everything twice: a resolved badge AND a paragraph restating the same gate.
  This pass keeps every qualification and deletes the second copy of it — including
  `drillAvailabilitySentence`, whose whole job was composing one. The guard moved rather than going
  with it: the spec now asserts the resolved badge against the same two real drill routes. Six
  cross-family rounds with Codex quota-capped for weeks (agy + vibe rotated in per the router's own
  order); every real finding came from a round explicitly scoped at `globals.css`, which did not fit
  agy's argv budget in the unscoped rounds that returned clean.
- ✅ [Maker ops — the landing repositions from a growth engine to an operating context](02-commercial/landing-maker-ops/README.md)
  (the maker-ops spine · four operating surfaces whose status is computed, never written down ·
  FinOps shipped as an explicit concept · the Pods booking flow at `/talk`) — **live in production
  2026-08-19** (PR #100, `46c7e80`), serving on **https://goldenfrijoles.com**. The page stopped selling a primitive set: the buyer changed underneath it,
  because agents made it possible for one person to hold a product that used to need a department.
  Twelve sections retired; Proof, Connect, SDK and Pricing were kept against the mockup, since they
  are the page's only live numbers and both of its conversion paths. (Connect and SDK were
  subsequently retired by `landing-readability-pass` on 2026-08-20 — both answered "how do I wire
  this up", which is a question a reader has after deciding; `/install` carries that flow.) Three cross-family review
  rounds found the two failure modes a repositioning is uniquely good at producing: a **claim that
  outlived its qualifier** (retiring §4 took `isConnectorWritesEnabled()` with it while the new
  authority section inherited the argument), and a **shared component that moved from one route to
  many**, silently invalidating the spec that only ever loaded `/`. The consulting tier lost its
  price and gained a real conversation.
- ✅ [Golden Frijoles — the rebrand, the material pass, and the broken controls](02-commercial/landing-frijoles-rebrand/README.md)
  (the product's name and its own domain · two live-page defects repaired · the chat-shaped agent
  surfaces · the infomercial and the flag-honest resilience drills · one elevation ladder and one
  motion vocabulary) — **live in production 2026-08-13** (PR #95, `5544c06`), serving on
  **https://goldenfrijoles.com**. This epic deliberately stopped at public surfaces; the follow-up
  rebrand close-out above published the renamed SDK while leaving the GitHub, Vercel, Supabase, wire,
  tenant-data, and caller-owned integration addresses stable. Two controls were genuinely broken and both
  were specificity accidents — the primary CTA lost its label on hover (`a:hover` at (0,1,1) beating
  `.btn-gold` at (0,1,0), so only *anchor*-based golds were affected, which is why it read as "some
  of them"), and selecting a paragraph on a phone painted an opaque gold slab. The section stamps
  are drawn discs now rather than `①` glyphs, which are illegible at any size a text run tolerates
  because the ring is part of the character.
- ✅ [Landing redesign v2](02-commercial/landing-redesign-v2/README.md) (the decision-first
  narrative · mobile heuristics as site-wide rails · `/northstar-self-serve.md` · proof that carries
  both the Outcome report and a live engine read) — **live in production 2026-08-12** (PR #92, `4553767`).
  The landing sold an *engine* — "The growth engine your agent operates" — which accurately described
  what was built and poorly described who buys it: it opened on the primitive set for a reader who
  had not yet been told what primitives are *for*. It now opens on the problem a PM already has, and
  the engine is the reason the receipts exist rather than the thing being sold. **Give-before-you-ask
  is the second section:** a prompt a stranger can paste into their own ChatGPT or Claude, which
  sends it to two public routes and runs a real North Star workshop with them — no account, no
  connector, nothing to install. §6 is the only section with numbers, and it carries **both** proofs:
  the Outcome report computed from this repo's own git history, and a live read of the demo tenant that
  reconciles exactly with the `/api/v1/public/north-star` the page invites you to curl (verified in
  production: `value: 35, wow: 0.409` both ways). Every other framed surface is labelled an
  illustration, and **a spec checks that it is** — because the footer's ledger claimed the hero was
  labelled before it actually was. Four collisions between the mockup's copy and what is checkable
  were resolved in favour of checkable, including a `$49` tier that ships with its price *and* the
  fact that nobody can be charged it yet. The mobile work is deliberately **rails, not an audit**:
  zero-specificity floors any component can step over, plus a guard that sweeps a list of routes —
  it found the site's most-tapped control sitting 4px under the accessibility floor on its first run.
- ✅ [App shell and agent rail](02-commercial/app-shell-and-agent-rail/README.md) (section nav over
  the route inventory · the agent's activity rail · Command Center) — **merged to `main` 2026-08-07**
  (PRs #71/#75/#73). The backend had modelled the agent as an accountable actor since signals-loop —
  scoped revocable credentials, staged writes bound to the credential that proposed them, an
  append-only trail — and **none of it reached a screen**. Now it does: a rail on every `/app` route
  showing what your agent and your team actually did, and what your agent has staged and is waiting
  on you to allow. `/app` stopped being a bulleted list of project slugs and became a front door that
  answers *did anything need me today* — North Star, adoption and retention, the TARS funnel drawn as
  a funnel over CSS that already shipped, and an explicit list of what this project is **not**
  measuring (including the Medusa-truth revenue boundary) so "where's my revenue number?" is answered
  with a reason rather than a plausible figure. No migration, no new query, **no new dependency**:
  the nav renders the inventory `project-route-inventory.ts` already carried, and the stat strip
  reuses the same `getProjectOutcome` the client-facing Outcome report reads, so an owner's numbers and a
  client's cannot drift. The rail is **dark in production** behind `AGENT_RAIL_ENABLED`, born OFF —
  and the var does not exist in Vercel yet, which is the one item owed.
- ✅ [The flag console a human can operate](01-growth-engine/flags-console-parity/README.md)
  (one feature list · a per-feature destination · a control that says what it stops · credentials and
  the audit on their own routes · one vocabulary) — **all three sprints merged and LIVE**
  (PRs #118/#120/#121). The page used to render the engine's shape
  rather than the operator's job: a JSON textarea, three key-minting forms, an `<article>` per flag,
  then three more tables. At 42 definitions nobody reached the bottom. Now: one scannable,
  URL-driven list; each feature with its own address; and three activation states said in words —
  **on**, **turned off**, and **never turned on here**, which 39 of 42 live flags actually are and
  which the old page drew identically to a deliberate kill. ⚠️ **This entry said "deployed, DARK"
  and listed the flip as owed until 2026-08-29.** `FLAG_CONSOLE_ENABLED` is ON in production and
  can be proved without a session: `/app/flags/<slug>/<key>` calls `notFound()` BEFORE auth, so it
  answers **404 while dark and 307 → /login once lit**, and it answers 307 (checked 2026-08-29,
  along with `/app/flag-credentials/…` and `/app/flag-audit/…`). `console-ia-overhaul` then rebuilt
  these surfaces on top of it — see below.
- ✅ [Flags — a visual rule builder](01-growth-engine/flags-visual-rule-builder/README.md) (rule
  builder · rollout bars · plain-language version diff · preview-as-a-user) — **all three sprints
  merged** (PRs #87/#88, and **#90**, which replaced #89 — that PR was auto-closed irreversibly when
  its base branch was deleted on merge, the trap LEARNINGS records). ⚠️ This entry said "Sprints 2
  and 3 await the owner's merge" until 2026-08-29; every one of them is on `main`, verified by
  `flag-preview.tsx` being there. **`FLAG_RULE_BUILDER_ENABLED`'s live value is RECORDED as on and
  has never been measured** — it is stored Sensitive in Vercel and its surfaces need a session, so
  unlike the console's gate above there is no anonymous proof to point at (console-ia-overhaul A21).
  Since `console-ia-overhaul` Story 3.2 the builder lives on a feature's **Targeting** tab rather
  than on the features list. A PM is the person who knows *"roll this out to pro-plan users in Mexico at
  10%"* and the person least able to type it as JSON into a `<textarea>` — so the strongest
  primitive the product has was invisible to the buyer it was built for. **No migration, no new
  route, no new dependency, no change to the wire contract:** the builder posts through the server
  action the textarea already used, the bars and the diff are pure derivations over props the page
  already had, and the preview calls the SDK's own evaluator server-side. Everything renders behind
  `FLAG_RULE_BUILDER_ENABLED`, so with the gate down the page is byte-for-byte pre-epic. The
  architecture lock disproved **four** of this doc's own claims before a line was written — including
  that D4 was unbuildable as the SDK stood, and that D5's "read the constant" was impossible because
  three of its four constants were never exported.
- ✅ [Component-kit adoption sweep](02-commercial/app-component-kit-adoption/README.md) (`DataTable`
  · `ConfirmDialog` · `FormSection`/`Field` · six converted routes · every irreversible action
  confirmed) — **shipped & live 2026-08-09** (PRs #82/#83/#84). `app-shell-and-agent-rail` shipped a
  nine-component kit that **2 of 26** `/app` route files used; this closed the gap for the surfaces a
  PM actually operates. Every list in the product now sorts, filters, and tells *"you have none"*
  apart from *"none match what you typed"* — and nine irreversible controls ask first and **say what
  stops**, in a sentence, naming the specific object. The lock pass found the epic's own D5 was
  false: the agent rail was documented as "already confirming" and has no interactive controls at
  all, while the product's one real confirmation — a bespoke two-click in `destinations` — went
  unmentioned. That one is now converged onto `ConfirmDialog`, so the product ships **one**
  confirmation pattern. Also the first `table`, `form` and `dialog` CSS the repo has ever had: before
  this, every `/app` table rendered at browser defaults. No migration, no new route, no new
  dependency.
- ✅ [Design system lift](02-commercial/design-system-lift/README.md) (gold-ingot Lucide bean mark ·
  approved dark-roast/kraft/foil system · reusable public/product rails · restrained route loaders
  · automated drift guard) — **shipped 2026-07-28** (PRs #51/#53), sourced directly from the
  supplied proposal folder and round-two mark exploration; the visual rails now cover public,
  auth, install, and signed-in routes without weakening gated-route HTTP semantics.
- ✅ [Multi-tenant activation](02-commercial/multi-tenant-activation/README.md) (auth hardening ·
  self-serve tenants · pod trials) — **Sprint 1 live in production** (2026-07-21): Supabase Auth +
  per-tenant membership, dashboards behind real authorization (slug-guessing returns 404, no
  existence oracle; the public demo still renders anonymously), and API keys as a revocable
  lifecycle (issue/rotate/revoke; owner-only). **Sprints 2–3 built and merged, shipping dark**:
  a confirmed signup provisions a whole tenant (project + owner membership + first key + connector
  token + a starter feature so the funnel isn't empty), the shared ingest path is bounded per
  tenant (payload cap · per-key rate limit · per-project monthly quota, all configurable as data on
  the project row), credential actions are audited append-only, and the landing's §1 hero + §7
  tiers show a real "Start free" CTA. **Launched 2026-07-21** — a real user signed up and received a
  working tenant (project, owner membership, API key, connector token, starter feature) with nobody
  touching the database, verified row by row in production.
- ✅ [Workspaces become the tenant](02-commercial/workspaces/README.md) (one person, many products, one boundary) —
  **shipped and live in production 2026-10-01** (#220, #221). Every project lives in exactly one workspace, and the
  workspace is the tenant: AGENTS.md states the invariant at that level. Every membership read re-checks it: a
  project in a foreign workspace is a 404 on the console and the CLI, and loses its MCP write tools (D10). Credentials
  (API keys, connector tokens, share links) stay project-scoped, by design. `getWorkspaceProjects()` is the one legal multi-project
  read, so the portfolio view and the workspace-wide board are now buildable. The switcher groups projects by workspace,
  and `gf whoami` prints it (CLI 0.4.0, npm publish owed). A `tenancy` lint rule watches it in shadow. Nobody gained or
  lost access (access model A; no billing, quotas or invites yet).
- ✅ [Portfolio view](02-commercial/portfolio-view/README.md) (every product in a workspace on one page) — **shipped
  and live 2026-10-03** (#234, #235). `/app/portfolio` puts each product you belong to on one row: its place on the
  Consider · Operate · Exit loop (written by an owner, never inferred — `projects.loop_stage`), its North Star metric
  and inputs, the furthest TARS stage, running experiments and kill switches off, epic lead time and spend vs quote
  ("as of" their push). Every cell is a value, a reason, or "couldn't load" — never a fabricated 0. Rows come only
  through `getWorkspaceProjects()`. A bare `/app` opens on it at 2+ products in one workspace; Today stays one click
  away. No metric level for the North Star exists yet, so there is no week-over-week (lock C1, a follow-up).
  **Owed to Daniel:** the signed-in walkthrough, and placing his products on the loop.
- ✅ [Account from the terminal](02-commercial/account-from-the-terminal/README.md) (launch epic 2: one prompt, one
  browser click, one URL) — **shipped and live 2026-10-06** (#277, #280, #282; plugin + kit 0.29.0–0.30.0, CLI 0.5.0).
  The install prompt has the agent read `/install.md` first (what installs, what changes on the machine, which
  services it contacts, how to remove it) and wait for a go-ahead; the hero says "Plan, ship and prove it paid off".
  "Continue with Google" signs in through Supabase's own provider (Clerk was offered and declined at the lock;
  GitHub and email links are follow-ups). `gf login` opens the browser and signs in when you confirm the code —
  device codes live ten minutes, work once, store no token, and every mint is audited — behind the kill switch
  `auth.terminal_sign_in_enabled`, which lives in Golden Frijoles's own catalog. A connector URL an owner makes now
  acts as them, so the Claude app can turn a flag off under their name; the public demo URL never writes, and the
  URL is shown to owners only. Setup › Connections shows whether Claude has used it, your signed-in machines
  (Disconnect) and Get a new URL. **Owed to Daniel:** the walkthroughs (an agent reading install.md, `gf login` on a
  clean machine, the Claude app turning a flag off).
- ✅ [One header and one name per thing](02-commercial/one-header-one-name/README.md) (launch epic 3, audit decisions
  2 and 3) — **shipped and live 2026-10-07** (#287, #288). The console and the Hub are one product: the header reads
  **Today · Plan · Ship · Measure · Setup**, the Hub's Roadmap, Board and Horizon are Plan, the Outcome report is under
  Measure, and the Hub's own bar and "Back to the console" are gone, with every URL unchanged. The switcher offers the
  board across all products beside Portfolio; ⌘K finds epics and products. Each thing has one name on screen (Flags,
  A/B tests, Outcome report, Webhooks, Portfolio, Agent queue, Flag history; the board's Backlog and Ready), with the
  stored keys untouched and a guard that fails if an old name comes back. **Owed to Daniel:** both walkthroughs signed
  in, re-approving the board surfaces' words, and a follow-up list of in-page nouns.
- ✅ [The result record](02-commercial/result-record/README.md) (launch epic 4) — **shipped and live 2026-10-07**
  (#290, #291, #293; plugin + kit 0.31.0–0.33.0, CLI 0.6.0). Every newly groomed epic says which number it should
  move, from what to what, and when it is read: groom asks at Stage 1.5, offering your North Star inputs. On the read
  date `epic-read` **fetches the number itself** through `gf` (`gf north-star readings`, `gf experiments decision`; the
  connector has the same two reads), drafts Proven, Disproven or Unclear with the evidence pointer filled in, and
  writes it only when you approve. A due read
  shows in the session's opening lines and on Today; shipped board cards show the result as a **Bean** (gold only on
  Proven). The record lives in the epic file and reaches the Hub with the roadmap push, ready for the epic page and
  the Outcome report (epics 5 and 6). **Owed to Daniel:** the CLI 0.6.0 npm publish, then the grooming and end-to-end read walkthroughs.
- ✅ [Gates in plain agile](02-commercial/gates-in-plain-agile/README.md) (launch epic 7) — **shipped and published
  2026-10-07** (#302, #303; plugin + kit 0.35.0, 0.36.0). Every decision a founder makes with the agent has one shape:
  where to read it, what's decided for you, two or three decisions, then numbered options. The words are plain agile:
  the Strategy gate (**Approve the strategy · Change something · Coach me through it**), the Plan gate ("We bet that …",
  Moves · Target · Read date · Size · Flag · Measured by, **Approve the plan · Park it · Change something**) and the
  Build gate (what was created, `/build <slug>`, only the setup that's missing). One home, groom's
  `references/gates.md`; a CI check keeps fund, scaffold, cycle, kickoff, agreed and draft off the screen in every
  copy. Files and their values are unchanged. **Owed:** Daniel's terminal walkthrough from setup to `/build`.
- ✅ [Build view upgrade](02-commercial/build-view-upgrade/README.md) (launch epic 8) — **shipped and published
  2026-10-08** (#312; plugin + kit 0.40.0). While an epic builds, the view says why (a Why line from the epic's
  target, or "no target set"), how far (one bar per sprint, `▰▰▱│▱▱`), and where (the stage as a track, `Grooming ─
  Ready ─ ◉ Building ─ QA ─ Shipped`, and a link to the epic's own page on the Hub). The session line under the
  prompt is now in colour, green to yellow to red, with the time to each window's reset: `5h 78% (-2h) · 7d 46%
  (-3d)`. **Owed:** Daniel's walkthrough in Claude Code with plugin 0.40.0.
- ✅ [Coaches v2](09-platform-infra/coaches-v2/README.md) — **shipped and published 2026-10-08** (#314, #315,
  #316; plugin + kit 0.41.0–0.43.0). A **cold read** goes first: a separate agent, on another model family when one
  is reachable, reads the repo without the strategy files and seals its read; after the coaches, the compare refuses a
  read whose hash changed and writes what agreed, what didn't and what each missed. The three coaches now share one
  way of working (groom's `references/coaching.md`): they play back what is written, show `Step N of X`, save after
  every step, offer options with sources, mark a step the maker handed over as the coach's proposal, label each
  benefit true today or aspirational, ladder examples up to needs, and keep `Roadmap/00-strategy/` out of a public
  repo. When the strategy is approved, **three one-pagers** render from the files: a business model canvas, a value
  proposition sheet and a persona poster, every line labelled. **Owed:** Daniel's interactive walkthroughs, the
  claude.ai duplicates, the Strategyzer VPC ask.
- ✅ [Launch trust sweep](02-commercial/launch-trust-sweep/README.md) (launch-sweep audit, score 11) — **shipped
  2026-10-08** (#322). The repo opens on a user README (pitch, quickstart, a screenshot of this board), maintainer
  notes live in `CONTRIBUTING.md`, and this poster's licence section states the real per-folder licences. No Vercel
  deployment host is left anywhere; `scripts/check-brand-host.mjs` keeps it out in CI. The landing's GitHub link opens
  the repo, and the navigation loader no longer always says "Percolating…". **Owed:** Daniel's two account settings
  (repo descriptions, the old host's redirect) and the `_Intent_` word.
- ✅ [First run: setup starts](02-commercial/first-run-setup/README.md) (gap 4 of the First run review) — **shipped
  and published 2026-10-07** (#307; plugin + kit 0.37.0). Before its first question, setup says who is signed in, for
  which product, and what it found in the repo. Then: **What are we working on? 1 This repo · 2 A new idea · 3 Just
  planning**. **This repo** reads the project into its roadmap: a dry run, then on approval shipped epics (merged pull
  requests grouped by branch, last 12 months, the 20 largest, marked "backfilled, no target"), Building epics from
  open pull requests, and open issues grouped into backlog ideas. It writes only new files under `Roadmap/`, through
  groom's generators, and only reads GitHub. **A new idea** takes one sentence, then strategy first or a first epic
  now. With no strategy, a pitch and its Plan gate say "not grounded". `gf setup` (CLI 0.8.0, #309–#310) asks the same
  Q1 and hands This repo to the read. **Owed:** Daniel's terminal walkthrough.
- ✅ [Outcome report v2](02-commercial/outcome-report-v2/README.md) (launch epic 6) — **shipped and live 2026-10-07**
  (#299, #300). The Outcome report opens by saying whether the product is on the pace its epics planned, then a chart
  of each North Star input against the line the shipped epics' targets draw, four figures each against expected, and
  an epics table (bet, metric expected → actual, Bean, spend vs quote; overspend neutral). How fast compares with the
  last two months; the Steps of AI Adoption say where you are, what the next step needs and hand you a prompt for your
  agent; every section has a line and a link. Share links keep spend, the table and console links team-only.
  **Owed:** signed-in walkthroughs and a client share link opened signed out.
- ✅ [One epic page](02-commercial/one-epic-page/README.md) (launch epic 5) — **shipped and live 2026-10-07** (#295,
  #297; plugin + kit 0.34.0). Every card, Roadmap row, workspace card and ⌘K epic opens one page,
  `/hub/<p>/epic/<e>`; old `?card=` links redirect there with their filters. It shows where the epic is (chips and a
  Backlog → Read track), one next command in plain words any agent understands (the rest under More), why we're
  building it (hypothesis, target, read date, the Bean once read), one bar per sprint, the epic's flag from the
  project's own registry with "Open in Ship", and spend against the quote with its FinOps row. `flag_key` is set at
  grooming and travels with the roadmap push. **Owed:** both signed-in walkthroughs; a design-gate picture of the page;
  flag lines read "not found" on prod until `one-product-project` puts roadmap and flags in one project.
- ✅ [Connect: start where you are](02-commercial/connect-page/README.md) (Daniel's feedback on the epic above) —
  **shipped and live 2026-10-06** (#284). Signup — password or Google — lands on **Connect**, not on an onboarding page
  that pushed a one-time API key; the connector URL a new account is handed can already change flags as its owner.
  Connect reads top to bottom: the install prompt; do it yourself (Claude Code, or `npx skills` for any other agent);
  the Claude app; **Codex** (one `codex mcp add … --url` command); the SDK, with where an ingest key really comes from;
  and your signed-in machines. The two-card grouping was accepted by Daniel. **Owed to Daniel:** the walkthrough.
- ✅ [One stage, every client](02-commercial/board-sinks-and-scrumban/README.md) (a six-stage board on the Hub, the CLI
  mod and every sink) — **shipped and live 2026-10-02** (PRs #224–#228, plugin + kit 0.20.0/0.21.0). Every client now
  reads ONE stage: Backlog · Grooming · Ready · Building · QA · Shipped, decided once by
  `scripts/lib/stage.mjs` from the docs plus git/GitHub facts (a live branch, an open or merged PR) and carried in the
  push. The Hub has a **Board** (`/hub/<slug>/board`: six columns, a card view with the copyable kickoff, filters in the
  URL, WIP as advice), the **Roadmap** tab is areas × Shipped · Now · Next · Later, and a **workspace board**
  (`/hub/w/<workspaceId>/board`) reads several projects only through `getWorkspaceProjects()`. The CLI build view, the
  kit's `roadmap-extract --sink terminal|hub|notion` and Notion's `Stage` column read the same row, and
  `roadmap-push.yml` re-pushes on the event that moved a card. The Hub never computes a stage. **Owed to Daniel:** the
  `Stage` select on the Notion DB; the signed-in workspace-board walkthrough.
- ✅ [Outcome report + Roadmap Hub](02-commercial/pod-report/README.md) (benchmarks/ROI + live
  roadmap-vs-end-state views · scoped share links) — **shipped and live in production 2026-07-26**
  (PRs #30/#32/#33/#34). The report-rendering primitive became an engine primitive with two consumers
  at birth: an **Outcome report** (renamed from its first name by `one-header-one-name`) whose every figure is computed from a repository's own git and
  pull-request history, and a **Roadmap Hub** (journey · epic drill-down · horizon) rendering a
  tenant's own pushed roadmap artifact. What makes it a product rather than a dashboard is the
  honesty, and it is structural: speed is never rendered without its gaps beside it, the ladder
  verdict and its not-instrumented count live in one element, a `met` criterion with no resolvable
  evidence pointer is downgraded rather than claimed, and an artifact that lost its caveats is
  REFUSED rather than shown. The baseline is published benchmarks (DORA 2025 · LinearB 2026 · DX
  Core 4), cited and linked, never republished — because the dataset has no human-majority era to
  compare against and that comparison is therefore not claimed. **Landing §5 is live with real
  numbers** (13 days · 88 commits · 2.2 d median epic lead time · step 1 "Assisted" · **11 things we
  do not measure, named**), and **share links** (`/s/<token>`, team/client/investor lenses, revocable
  and expirable) are enabled — as scoped rows in the existing `api_keys` taxonomy, with the ingest
  scope filter welded into a Postgres view so a URL-borne token can never authenticate against the
  API. Six cross-review rounds across two model families; Codex caught a Blocking cross-tenant read
  that four agy rounds had read past. **Owed to Daniel:** minting the first real share links.
- ✅ [Commercial shell](02-commercial/commercial-shell/README.md) (Golden Beans landing · waitlist ·
  read-only MCP connector + install page · dogfood instrumentation · SEO/OG + agent manifest) —
  **launched** and live in production at `https://goldenfrijoles.com`. The landing tracks
  itself as a real tenant (visitor→waitlist funnel via the actual SDK), serves real OG cards +
  `/llms.txt`, and the read-only MCP connector is **enabled** (`CONNECTOR_ENABLED` flipped ON
  2026-07-20) with a live demo token on `/install`. It moved to `goldenfrijoles.com` with the Frijoles rebrand.

### 09 · Platform & Infra
- ✅ [Fund at approval](09-platform-infra/fund-at-approval/README.md): **the approval gate is the betting table.**
  Approving a pitch in `groom` funds it in the same commit as the scaffold: `fund.mjs` writes a row in the month's
  cycle file (`Roadmap/bets/wave-YYYY-MM.md`), `underwritten_by:` and a build position, renumbering only the queue.
  "Approve, don't fund" leaves the pitch `ready`. `build-order.mjs` fails any live bet with no funding record, after
  an honest 45-row `wave-backfill`. `priority:` is retired. A fixed-scope seed scaffolds from its slug alone, with its
  acceptance criteria as the stories (dogfood F33). **Shipped 2026-10-04** (#271, plugin + kit 0.28.0).
- ✅ [Setup drafts the strategy: two North Stars from the evidence, and a first bet in one review](09-platform-infra/setup-drafts-strategy/README.md) —
  **shipped 2026-10-09** (#336; plugin + kit 1.2.0). Setup asks what the product is for first, reads the product
  (`read-product.mjs`: README, landing copy, routes, analytics calls, flags, each with its file), drafts the strategy
  with a source on every line and two North Star candidates, and ends with a first idea in the backlog, grounded when
  it has a target. **Owed:** the interactive setup walkthrough.
- ✅ [Grounded bets: every Why is a hypothesis traced from the North Star](09-platform-infra/grounded-bets/README.md) —
  **shipped 2026-10-09** (#334; plugin + kit 1.1.0). refine writes each bet as *We believe that … for … will … because …
  We'll know when …*, traced to a North Star input, challenges once when none fits, and records an override with its
  reason; `grounded_bets_share` is computed from the funded bets and pushed on every merge (October: 1 of 15).
  **Owed:** the `_Intent_` word and the interactive refine walkthrough.
- ✅ [Plugin 1.0: five plain skills, the frijoles CLI, and Refining](09-platform-infra/plugin-1-0/README.md) —
  **shipped and released 2026-10-08** (#324, #328; plugin and kit 1.0.0, CLI 1.0.0). Five skills instead of fifteen:
  `setup`, `refine` (was groom), `strategy` (cold read, PMF narrative, North Star, risk validation), `report` (daily,
  weekly, PMO) and `smoke`, plus the `verifier` agent with a security lens; our own ops skills live in this repo's
  `.claude/skills/`, and the routines run their scripts. The CLI is `frijoles` (`gf` is shadowed by oh-my-zsh's
  `git fetch` alias; it keeps working with a notice until 2026-12-31, and CI goes red after). The board reads Backlog ·
  Refining · Ready; stored keys are unchanged. **Owed:** Daniel's interactive walkthrough, the Notion `Stage` option
  and the prototype's wording decisions, his live routines, and the `_Intent_` word.
- ✅ [Notification rails](09-platform-infra/notification-rails/README.md) (Telegram + Slack
  mechanical push/deploy pings · identical reviewed prose reports · per-channel retry checkpoints)
  — **shipped 2026-07-28** (PR #51); Slack uses a channel-scoped Incoming Webhook and plain-text
  response handling, while the local report checkpoint advances only after every configured channel
  accepts the reviewed prose.
- 🚧 [One public monorepo](09-platform-infra/public-monorepo/README.md): the plugin, kit and template live in
  `skills/` (with history), and `golden-frijoles/skills` is a fast-forward mirror whose own release workflow still
  publishes the kit. Release 0.5.3 went out that way. The repo is now `danybgoode/golden-frijoles`, and sensitive docs
  live in the private `golden-frijoles/internal`. Per-folder licences apply: Apache-2.0 for `skills/`, the CLI and the SDK, and FSL-1.1-ALv2 for
  the engine (#184). **Shipped 2026-09-28 except** the local folder move (owed to Daniel).
- ✅ [Verify spike](09-platform-infra/verify-spike/README.md): formal verification, measured on our own code
  in one session. A Quint model of the delivery outbox found a stranded row, an unbounded unlogged resend
  (bug seed, fix already model-checked) and an unenforced timing order (guard test, #194). Lean proves the
  flag explanation agrees with the served value for every type-correct call, and a differential test ties
  the model to the shipped code (0/6,000 disagreements). **Decision:** Quint + Lean, per-PR simulation,
  nightly exhaustive checks, and no proof without a differential test. **Shipped 2026-09-29.** No landing
  claim yet (audit D7). ⚠️ **Owed to Daniel (F7):** confirm the delivery cron is registered in production
  (Vercel → Settings → Cron Jobs). Root Directory is `.`, but the `crons` entry lives only in `apps/web/vercel.json`.
- ✅ [Intent match (wave 1, advisory)](09-platform-infra/intent-match/README.md): every groomed pitch keeps the ask
  **verbatim** (claims + teach-back) and is **scored against it** by Jev — coverage in and out, clarity, teach-back, a
  total marked *uncalibrated*, and a routed next artifact per gap; no key means "could not look", never a number.
  Groom **Stage 4.6** draws from the shape of the ask (a system context for every M/L bet, then only what it
  triggers). An **optional reader** at the lock (`intent.reader`, off by default, never Claude) adds agreement; every
  failure is one skip line. Every closed scored epic answers **`_Intent: yes | mostly | no_`** (`epic-dod` checks it),
  and `intent-outcomes` joins scores and answers across repos: **24 scored, 0 of 20 answered** — the backfill's
  answers are owed to Daniel. **Shipped 2026-09-30** (#196, #197, S3; kit 0.10.0–0.12.0; medusa-bonsai #198).
- 🚧 [Semantic lint (v1: AGENTS rule 1, in shadow)](09-platform-infra/semantic-lint/README.md): on every push, the
  advisory pre-push hook runs `semantic-lint.mjs`. Deterministic selectors (globs, added-line patterns, an allowlist,
  all data in `golden-frijoles.config.json → lint.rules`) pick candidate hunks, and Jev answers one question per
  candidate. A push that selects nothing makes no call: 19 of the last 220 commits selected anything. There are four
  outcomes: raise, clear, uncertain and **not checked**, and not checked never counts as a pass. Rule 1's wording is
  measured: 31/33 labelled hunks decided, all right. 🚧 = **in shadow until 2026-10-14**, logging and printing but
  never shown as findings; the promote / tune / drop decision is owed to Daniel on that date. **Shipped 2026-09-30**
  (#200, kit 0.13.0).
- ✅ [Compiled prompts, wave 1](09-platform-infra/compiled-prompts/README.md): **every Jev question is data**
  (`scripts/lib/jev-questions/*.json`, Jev's own shape plus a `measured` block), and **every recording stamps the
  wording it answered**, so an edited question fails CI until it is re-measured. `optimize/` (dev-only Python, never
  shipped, with a leak guard) refits thresholds with DSPy ReAnchor in one command, and `optimize/wording.mjs` measures
  a new wording on held-out folds. Its first run, on `flag-state-claim`, produced a win on paper that was **not
  adopted**: the win was leakage from the drafts the candidate was written against. **Shipped 2026-09-30** (#207,
  kit 0.15.0; #208).
- ✅ [Think skills](09-platform-infra/think-skills/README.md): **the strategy coaches ship in the plugin.**
  `pmf-narrative`, `north-star` and `risk-validation` each write `Roadmap/00-strategy/<name>.md` from their own
  template, ask before overwriting an `agreed` file, credit their sources, and offer the next one: narrative, then
  North Star, then risk validation, then groom. Groom's Stage 0 reads the folder when it exists and gives each pitch
  one line, `Moves: <input> · Tests: <dimension>`. With no folder it says nothing. intent-match's "worth doing?" route
  points at the coaches. **`gf north-star set <file>`** sends the workshop's metric and inputs to the engine over a new
  owner-only `/api/v1/cli/north-star` route, which shares its logic with the ingest-key route. It's a dry run by
  default and names what a sync can't undo. Under `--json` the dry run says `sendable` and `blockers` (CLI 0.4.1, cli-think-skills-followups). All CLI POST routes
  check the gate before reading the body, and a parameter-anchored guard goes red on any route that reads it itself.
  **Shipped 2026-10-01** (#214, #215, #216; plugin 0.17.0–0.19.0, CLI 0.3.0). ⚠️ Owed to Daniel: the CLI's npm
  publish, the first real North Star run and its live `--yes`, and removing the account copies.
- ✅ [Sketch specs](09-platform-infra/sketch-specs/README.md): **a screen is written once as a `surface` block** — a
  state id, a route, then one line per block from twelve kinds (`- head "Orders" action "Share your shop"`), with only
  an action's words, a count and a list's columns as facts. `node scripts/sketch-render.mjs <seed>` draws every block
  as one **grey** wireframe page for the product owner to approve (no design system, no colour); a line it cannot read
  fails with the file, the line and the known kinds. Groom's seed template and visuals rule now write this grammar.
  In this repo, an approved block in `apps/web/design-system/surfaces/` **is** a state contract: `state-contract.mjs`
  turns it into the entry the gate compares, refuses an id the prototype owns, and refuses a file whose SHA-256 is not
  on an `APPROVED.md` line, the same kind of hash pin `tokens.test.ts` holds on the two prototypes. Three prototype states rewritten as
  surfaces reproduce their entries byte for byte. **0 surfaces approved yet**: the first new console state is the first
  user (story 2.3, deferred). **Shipped 2026-09-30** (#210, kit 0.16.0; #211). ⚠️ Owed to Daniel: say whether a
  rendered wireframe reads.
- ✅ [Session budget](09-platform-infra/session-budget/README.md): **one deep ask per approval gate; keep going while
  the budget line says so.** It replaces "one per run" and "fresh session per sprint". In Claude Code a status row
  under the prompt reads the engine's own figures, for example `Session 48% · 5h 23% · 7d 9% → keep going`, and
  turns to checkpoint or hand off. Groom prints the same verdict at every approval gate in Cowork, with "context: not
  measured here". There is one `THRESHOLDS` table, nothing is shown as 0% when it's unknown, and the line never acts
  on its own. **Shipped 2026-09-30** (#202, kit 0.14.0). The live walkthrough is owed to Daniel.
- ✅ [One Roadmap](09-platform-infra/one-roadmap/README.md): the plugin repo's epics, seeds, bets and LEARNINGS live
  here, `build_order` is one ship history (28–54), and `golden-frijoles/skills`' Roadmap is a pointer. **Shipped
  2026-09-28** (golden-beans #177, skills #56).
- **The plugin, the kit and the template** (moved from `golden-frijoles/skills`' own Roadmap by
  [`one-roadmap`](09-platform-infra/one-roadmap/README.md), 2026-09-28):
  - ✅ **Plugin marketplace**: `golden-frijoles@golden-frijoles` from `golden-frijoles/skills` (Apache-2.0), installed via `.claude/settings.json` or `claude plugin install`; Cowork `.skill` archives built reproducibly by `scripts/pack-skills.mjs`.
  - ✅ **Spawn template** — `Roadmap/`, `AGENTS.md`, CI guards, git hooks and scripts a new project copies once.
  - ✅ **Portability guards** — `check-plugin-leaks.mjs` (origin-project residue) and `check-skill-scripts.mjs` (every skill's scripts exist).
  - 🚧 **One plugin, one install**: wave 1 ✅ (2026-09-23). The plugin ships under the product's name with tagged, pinnable releases (a version bump merged to `main` publishes and tags). The skills' scripts reach any repo as **`@golden-frijoles/kit`** on npm, built from the skills' declared closure and published from CI with verified provenance. Every skill runs a project's own copy when it has one, otherwise the pinned kit. The **`golden-frijoles` umbrella skill**, `gf-kit init`, and one install prompt checked by *running* it (Claude Code and `npx skills`) complete it. Wave 2 (one config file, setup and adjust) is re-bet at the boundary. [`golden-frijoles-plugin`](09-platform-infra/golden-frijoles-plugin/README.md)
  - ✅ **Plugin audit + extraction** — every advertised skill runs (`KNOWN_ABSENT` empty; `check-skill-scripts` walks import closures, also against consumers), the advertised list is generated, and the origin's stranded rails are in the template behind committed config seams: the reporting family, routines, the hook budget, session notes, doc-format, owed-ledger, a prod-smoke engine, a fail-closed merge gate, merge-report, vercel-env and perf-probe. One implementation per rail it touched, across all three repos (each consumer's documented forks, notably the review rail, excepted). [`plugin-audit-and-extraction`](09-platform-infra/plugin-audit-and-extraction/README.md)
  - ✅ **Golden Frijoles by default** — a spawned project carries the flag provider already wired: one seam (`apps/*/flags.mjs`, fallback per call, SDK imported dynamically so it loads with no `node_modules`), `scripts/preflight.mjs` as the mandate-as-a-check (fails loudly on absent config, **warns** on an unreachable deployment), `AGENTS.md` rule 1 *"never build a parallel flag store"*, the leak guard's flag-mechanism rule, and `groom` Stage 6b planning against `gf flags create` with **activation as its own step**. The Edge answer is verified by executing the published SDK, not by reading its docs. [`golden-flags-by-default`](09-platform-infra/golden-flags-by-default/README.md)
  - ✅ **The build view** — a machine-readable frontmatter contract on every epic doc (`lib/roadmap-contract.mjs`), enforced by `doc-format.mjs` and born from the `groom` scaffolder; `roadmap-backfill.mjs` brought the whole corpus onto it and recorded what it could not resolve; `build-state.mjs` is the one resolver for "what is being built right now"; and `plugins/golden-frijoles/hooks/` renders it in the CLI as a Claude Mod (opt-in, deleting `hooks.json` is the kill-switch). [`build-visualization-claude-mods`](09-platform-infra/build-visualization-claude-mods/README.md)
  - ✅ **Jev semantic guards** — the review guard ("did the reviewer actually review?", which gates a PR's `cross-review/<lens>` status) and the prose guard's four semantic families (invented fix, beneficiary, liveness, deadline) are decided by Jev (TypeSafe, pinned `jev-1.13.0`) in all three repos, with the regexes as the offline fallback. One zero-dependency client (`lib/jev.mjs`) and a committed per-rail kill-switch (`jev.config.json`). Every decision is logged, and every posted review carries a `<!-- jev: -->` marker. `jev-eval.mjs` replays 240 labelled fixtures offline in CI, and `jev-report.mjs` watches agreement. Measured: review 98.7% vs the regex's 87.0%, prose 86.5% vs 71.2%. [`jev-semantic-guards`](09-platform-infra/jev-semantic-guards/README.md)
  - ✅ **Ways-of-work lean pass** — committed permissions with a cited deny/ask ledger (three spellings, deny **and** ask), one external general pass + one lean security lens + one fresh reviewer, a generated `WAYS-OF-WORKING`, and `epic-dod --check` for the mechanical half of the epic DoD. [`ways-of-work-lean-pass`](09-platform-infra/ways-of-work-lean-pass/README.md)
  - ✅ **[FinOps](09-platform-infra/finops/README.md)** — quote vs actual per epic, from your own Claude Code sessions (no hook,
    no receiver): `epic-actuals` (deduped, worktree-aware, ≈ API $ from one dated price table), `quote` (p25–p75 of your
    shipped actuals by appetite, written by groom), the build view's `$ Spend` row against the quote (alert only), the
    actual stamped at close, and an opt-in `$agent_usage` push to `/app/finops/<project>`. Claude Code only. Shipped
    2026-10-03 (#230–#232, kit 0.22.0–0.24.0).
  - ✅ **The build view is live** — the band re-checks after every Bash call and every 30 s and re-resolves only when a worktree, a commit or an epic doc moved (48 ms when nothing did); PR facts refresh on their own timer, never on a turn. From the lock on, every rung comes from a trigger: `scripts/epic-phase.mjs lock` stamps it (Locking architecture until then), a `commit-msg` hook makes each feat/fix commit on an epic branch name exactly one story, and Progress counts stories with commits. `/build <slug>` is the kickoff's one home, and a `Plugin` row plus marketplace `autoUpdate` let a fix reach the session. **Shipped 2026-10-03** (#240–#241, kit 0.25.0–0.26.0). [`live-build-view`](09-platform-infra/live-build-view/README.md)
  - ✅ **CI diet** — CI runs what a change can break, in parallel, behind one required-ready check. A docs-only PR skips e2e by an exclusion rule (2m10s, down from 7m38s). `e2e-api`, `e2e-authed` and `design-contract` run side by side, and the same tests still run, counted. `gate` is green only when every job passed or the docs rule skipped it, as proven by four mutation PRs. One env file per gate state replaces four copied flag lists, and three duplicate workflows are gone. A red run uploads its trace. A known flake can be `@quarantine`d with an owner and an expiry ≤ 30 days, and runs without blocking until that date. `browser` runs nightly. **Shipped 2026-10-04** (#246, #247, #258; kit 0.26.2); `gate` is required on `main`. [`ci-diet`](09-platform-infra/ci-diet/README.md)
  - ✅ **Kickoff generators run from anywhere** — `npx -y @golden-frijoles/kit emit-epic-kickoff --epic <slug>` (and `emit-kickoff … --sprint <N>`) prints the build kickoff from any project root on any host, with no plugin checkout. Before this only `/build` worked, and every doc named a path relative to the plugin's own folder (`skills/groom/…`) that failed with `MODULE_NOT_FOUND`. One source in `template/scripts/`; the groom skill's copies are vendored bytes; a packed-tarball spec pins kit and plugin output byte-identical. The nine process docs name `/build` or the kit command, a guard keeps that plugin-relative form out of anything a reader copies, and `check-release` now counts the skeleton `gf-kit init` ships. **Shipped 2026-10-04** (#262, #263; kit 0.27.0–0.27.1). [`kickoff-generator-path`](09-platform-infra/kickoff-generator-path/README.md)
  - ✅ **Distribute what we use** — a stranger's repo gets the rails this one runs, from the kit, by construction. **One review rail**, byte-identical across this repo, the template and medusa-bonsai. It is locked down: Vibe runs with no host tools, devin is refused, codex runs read-only with no user config or MCP, a reply carrying a secret is never posted, and outsiders' diffs are refused. One doctor. The **review rail, `session-resume` and `build-state` ship in the kit**. The **build view never runs the open repo's code**. A **byte-parity guard** covers the shared scripts. **Jev asks before anything is sent**, and a Jev setup route leads to a proof that writes nothing. A **notify setup route** covers `--chat-id` and `--test`. **Routines** are paste-ready for `/schedule`, and there are model-free cron templates. **Shipped 2026-09-30** (#188–#191, kit 0.6.0–0.9.0; medusa-bonsai #197). [`distribute-what-we-use`](09-platform-infra/distribute-what-we-use/README.md)

---

## Recent highlights

- **2026-10-09**: `setup-drafts-strategy` **shipped**: ≈$15.50 against a $15–32 quote, four verifier rounds to clean.
  Setup now drafts the strategy from the product's own evidence, with two North Stars to choose between, and ends with
  a first idea already grounded.
- **2026-10-09**: `grounded-bets` **shipped**: one PR, ≈$15.48 against a $17–32 quote. Every new bet's Why is a
  hypothesis traced from the North Star, and our own depth input `grounded_bets_share` is now computed and pushed from
  the roadmap (October: 1 of 15). Three review rounds; the first caught a push that could never run in CI.
- **2026-10-09**: `sdk-1-0` **shipped**: one PR, ≈$29.55 against a $16–32 quote. The SDK starts in one line, knows who
  the user is and pushes North Star inputs; review found a construction-time config read that would have sent three
  real 0.6.0 config shapes to production, now pinned by the freeze test.
- **2026-10-08**: `plugin-1-0` **shipped**: four sprints, ≈$56.54 against a $55–111 quote. The plugin went from fifteen
  skills to five plus the verifier, the CLI became `frijoles`, and Grooming became Refining. The verifier found a
  defect in every sprint that the builder's gates could not see; the stacked PRs merged into their bases instead of
  `main`, and one more PR (#328) carried the rest.
- **2026-10-08**: `launch-trust-sweep` **shipped**: one sprint, one PR, ≈$8.01, not quoted. Every public surface says
  Golden Frijoles on goldenfrijoles.com, and a CI guard keeps the Vercel host out. Review caught that rewriting the
  host in old smoke records turned July evidence into claims about a domain that only existed from August.
- **2026-10-08**: `coaches-v2` **shipped**: three sprints, three PRs, ≈$24.61 against a $22–34 quote. The lock
  found the epic's base gone: bet A's names never shipped and `agreed` had moved to the Strategy gate, so it built on
  today's names and rendered the one-pagers at the gate. Review found the seal could be swapped beside its read, and
  the "one-pagers" printed on two pages.
- **2026-10-08**: `build-view-upgrade` **shipped**: one sprint, one PR, ≈$13.82 against an $8–19 quote. The build
  view says why, how far and where, and the session line is coloured with reset times (Daniel's kickoff addendum).
  The lock found the mod was not a pure renderer: it drew the bar itself, and its Status colour would have turned
  every stage track green.
- **2026-10-07**: `first-run-setup` **shipped**: one sprint, one PR, ≈$13.45 against a $22–34 quote. Setup now
  reads an existing repo into its roadmap. Running it on a real outside repo (`sindresorhus/ky`) before review found
  two bugs that every fixture had passed: a dev-only test server reported as the stack, and a header linking a seed
  that never existed.
- **2026-10-07**: `gates-in-plain-agile` **shipped**: two sprints, two PRs, ≈$14.63 against a $22–34 quote. The
  terminal's gates now read in plain agile and share one shape. Reading the private canvas before the lock caught four
  things it drew that the system doesn't do (a flag made at grooming, an email digest, one-pagers, a renamed folder).
  Review then found real ambiguities in the gate text: a kill switch shown as "off", and a reply of "1" that meant two
  things.
- **2026-10-07**: `outcome-report-v2` **shipped**: two sprints, two PRs, ≈$14.59 against a $22–34 quote. The report
  answers "is it paying off?" first, from the epics' own targets — no invented number: the lock found the North Star
  itself has no recorded level, so the chart plots its inputs. Review found and fixed a one-bad-date crash that took
  down every share link and a pace floor that made fraction metrics always "on pace".
- **2026-10-07**: `one-epic-page` **shipped**: two sprints, two PRs, ≈$31.17 against a $22–34 quote. One page per epic
  replaces the Board's card view and the Hub's drill-down; commands read as plain lines, proven by pasting each into an
  agent (one wording failed and was changed). The lock's live-data check found the roadmap and the flags in different
  projects, and Daniel decided the follow-up the same day: one public `golden-frijoles` project, its own epic next.
- **2026-10-07**: `result-record` **shipped**: three sprints, three PRs, ≈$42.44 against a $22–34 quote (S3 added
  after the close: the agent fetches the number — verified end to end on production).
  - An epic now carries what it should move and gets an evidenced verdict you approve on its read date. The lock
    corrected two premises out loud (epic 1's Bean didn't exist, so it was built here; `gf` can't fetch evidence, so
    the owner supplies the actual), and the live data set the default: no read date for epics shipped without a target.
- **2026-10-07**: `one-header-one-name` **shipped**: two sprints, two PRs, ≈$19.61 against a $22–34 quote.
  - A founder now walks Plan → Ship → Measure in one header, with no back button, and finds an epic by name with ⌘K.
    The lock caught the two traps before any code: the demo Hub is public, so it keeps its tabs as a fallback row,
    and the board's stage names are data keys, so only the screen word changed.
- **2026-10-06**: `connect-page` **shipped**: two sprints in one PR, ≈$17.38 against a $25–60 quote.
  - A new founder now lands on the one page that connects their agent, the Claude app, Codex and their product, and the
    URL they are handed can already change things. The plan's own claim that `gf init` writes the SDK's key was false
    (it writes a flag-read key) and was caught before it shipped; the coverage ratchet refused a planned design
    deferral, and the approved page structure fit the requested order.
- **2026-10-06**: `account-from-the-terminal` **shipped**: three sprints in one run, two migrations applied before their
  merges, ≈$55.44 against a $67–144 quote.
  - A stranger now gets from the landing to a signed-in terminal with one prompt, one browser click and one URL, and
    the Claude app can change a flag as the person who connected it.
  - The lock turned down a second identity system (Clerk) for Supabase's own Google provider. The fresh reviewer
    caught three untrue sentences on the install page a careful founder would have checked, and the one real
    authorization defect: once the connector URL could write, a page outside the diff was still showing it to
    every member. A test fixture was found rewriting the real repository from a worktree hook, and is sealed.
- **2026-10-04**: `fund-at-approval` **shipped**: one sprint, plugin + kit 0.28.0, ≈$20.74 against a $7–16 quote.
  - Approving a pitch now funds it, in one commit; nothing leaves grooming scaffolded but unfunded, and the board
    enforces it.
  - A fixed-scope seed goes straight from its slug to a scaffolded epic and a kickoff.
- **2026-10-04**: `cli-think-skills-followups` **shipped**: one sprint, CLI 0.4.1 (the npm publish is owed), ≈$3.79
  against an $11–17 quote.
  - An agent driving `gf north-star set --json` branches on `sendable` and `blockers` instead of parsing a sentence.
    The gate-before-body guard now fails on every body read a regex can see, and on any handler it can't parse.
  - The lock corrected D4 (arrow handlers). Review found the guard's real hole: "can't read this parameter" was being
    recorded as "no parameter". It fails red now.
- **2026-10-04**: `kickoff-generator-path` **shipped**: two sprints in one run, kit 0.27.0–0.27.1, ≈$11.65 against a
  $23–36 quote.
  - Any plugin user, on any host, generates the build kickoff with `npx -y @golden-frijoles/kit emit-epic-kickoff`.
    Daniel at grooming: "this works for all users using the plugin not just me."
  - The lock corrected two premises before code (where groom's copies can live, and the plugin copy's project root).
    The review found a release-guard blind spot: the skeleton `gf-kit init` ships could change without a release.
- **2026-10-04**: `ci-diet` **shipped**: three sprints in one run, kit 0.26.2.
  - A docs-only PR answers in about two minutes. A code PR's tests run in three parallel jobs, the same tests as
    before, counted. One check, `gate`, can now be required on `main`. Red runs leave a trace, and a known flake can
    be quarantined with an owner and an expiry instead of blocking everyone.
  - The lock and the build disproved five premises, among them the groom's `**/*.md` docs rule, which would have let a
    markdown-only PR skip the one job guarding the measured design spec. The fresh reviewer caught the quarantine
    check failing closed on every PR outside a developer's checkout. Dependabot security updates were found switched
    off and are now on.
- **2026-10-03**: `live-build-view` **shipped**: two sprints in one run, kit 0.25.0–0.26.0.
  - The build view now moves while an agent works, not only when a person types: it re-checks after every Bash call
    and every 30 s, and its story and progress come from commits a hook keeps honest (one story per feat/fix commit
    on an epic branch). `/build <slug>` starts a build from the generated kickoff, which nothing saves to a file.
  - The lock found the band has no "In review" (a ready PR is QA, a draft is Building) and that CI checked the mod on
    a Claude Code too old to run it. Measuring in a real session found a spec fixture that misspelled the engine's own
    directory kind, and three fresh-review rounds caught a cache shared across sessions and version numbers read as
    stories.
- **2026-10-03**: `portfolio-view` **shipped**: two sprints in one run, one migration applied before its merge.
  - Anyone holding two or more products in a workspace now lands on one page that compares them, each placed on
    the Consider · Operate · Exit loop by its owner.
  - The lock found the pitch's headline figure did not exist: there is no stored North Star value, so no
    week-over-week. The cell names the metric and its inputs instead. Running the signed-in spec found three
    defects no review had: a 404 served as 200, a control a person could not click, and forged ids that never
    reached the action.
- **2026-10-03**: `finops` **shipped**: three sprints in one run, kit 0.22.0–0.24.0.
  - Every epic can now carry a quote calibrated from what our own shipped epics cost (today M is $24–35, n=4), shows
    spend against it in the build view while it is built, and stamps its actual at close. FinOps is live on the
    landing and at `/app/finops`, measured from Claude Code transcripts that already existed.
  - The lock rested on the 241 transcripts on this Mac: they repeat each streamed message, resumed sessions re-stamp
    copied history with a new branch, and half this repo's history still names its old folder. The first epic to
    stamp its own actual with the tool it built: ≈$56.
- **2026-10-02**: `board-sinks-and-scrumban` **shipped**: four sprints, plugin + kit 0.20.0 and 0.21.0.
  - One stage everywhere: the Hub's Board, the CLI build view, the kit's sinks and Notion all read the resolver's
    answer, so "10/10 shown as Building" can't recur.
  - The lock corrected thirteen things before code (among them: no prod project of that name, workspaces with no slug, a committed file
    that can't hold live facts). The HIGH tenancy sprint merged with both outside review families dark, by the product
    owner's call, after a fresh reviewer found the one missing spec that pins the access model at the page.
- **2026-10-01**: `workspaces` **shipped**: two sprints, both migrations applied before their merges, CLI 0.4.0 (the npm
  publish is owed).
  - The workspace is the tenant now. Every membership read re-checks it, one helper may read several projects, and the
    switcher shows the boundary.
  - The lock queried the four live projects first. It removed an invented "platform" workspace and moved NOT NULL to
    after the code that writes the column, because signup is live. A "gone from the switcher" assertion turned out
    unable to fail (the fresh reviewer flagged its missing control); it fails now.
- **2026-10-01**: `think-skills` **shipped**: three sprints, plugin 0.19.0, CLI 0.3.0 (the npm publish is owed).
  - The strategy coaches left one person's account and now write files that groom reads. The North Star's metric
    reaches the engine with one command, dry run first.
  - The lock disproved the headline story before any code was written: `gf`'s token couldn't call the route it was
    planned on. One question settled it: a new CLI route.
- **2026-09-30**: `sketch-specs` **shipped**: two sprints, kit 0.16.0.
  - A screen can now be approved as a grey wireframe drawn from text, and that same text is the state contract CI
    enforces, with its approval pinned by hash like the prototypes'.
  - The lock corrected five things out loud (a sixth, "nothing checks the prototype hash", was itself wrong and was
    corrected at close-out), among them 38 states rather than 33, a seed template that already shipped a
    shape nothing could read, and a walkthrough that asked for the duplicate its own D5 forbids.
- **2026-09-30**: `compiled-prompts` wave 1 **shipped**: two sprints, kit 0.15.0.
  - Jev's questions moved to data without changing a verdict; the stamp-then-move commit order is the proof.
  - The first wording test passed its own held-out rule and was still rejected: the winning examples were lifted
    from the drafts they fixed. Wording tests now need drafts the author has never seen.
- **2026-09-30**: `session-budget` **shipped**: one sprint, kit 0.14.0.
  - The product owner's decision bandwidth, not a stamina rule, now sets session length. Every approval gate ends
    with a keep going / checkpoint / hand off line, in Claude Code and in Cowork.
  - The lock corrected the seed out loud: nine files, not four; no "asks open" in Claude Code; and the line took the
    status row that #199 had just freed.
- **2026-09-30**: `semantic-lint` **shipped** in shadow: one sprint, kit 0.13.0.
  - Jev now judges only what deterministic selectors pick, starting with AGENTS rule 1 (no parallel telemetry
    pipeline). The measured wording decides 31/33 labelled hunks, every one right.
  - Real history changed the design twice. Whole hunks would have left most new routes "not checked", and this repo's
    labels would have broken any consumer's rules.
- **2026-09-30**: `intent-match` **shipped**: three sprints, three kit releases (0.10.0–0.12.0).
  - A pitch is now scored against the ask it came from, with measured question wording (37/37 labelled items right)
    and advisory only. 23 past epics across both projects were scored on their pitch as approved; answering them is
    the first step to real thresholds.
  - Review ran with every external family capped; the fresh reviewer's rounds still found real defects each time,
    including a fix that was worse than the hole it closed.
- **2026-09-29**: `verify-spike` **shipped**: one session, one decision (`DECISION.md`).
  - The outbox model found three things two dozen review rounds had not; one is fixed (#194), one is a
    bug seed with its fix already model-checked, one is an accepted residual.
  - The lesson for `verify-module`: model checking pays outright, and a proof pays only with a
    differential test against the real code.
- **2026-09-30**: `distribute-what-we-use` **shipped**: four sprints, four kit releases (0.6.0–0.9.0).
  - The review rail's three forks became one, and it is locked down. #188 took seven fresh review rounds; the
    one residual no code can close was accepted and documented.
  - A stranger's plugin-only repo now gets the kickoff's review route, the build view (it never runs the repo's
    own code), the Jev egress question before anything is sent, notify setup, and `/schedule`-ready routines.
- **2026-09-28**: `public-monorepo` S1–S4.3 **shipped**: one repo (`danybgoode/golden-frijoles`) with `skills/` mirrored
  byte-for-byte to `golden-frijoles/skills`. The first release through the mirror (kit 0.5.3, with provenance) installed
  cleanly on all three channels. Both repos' full history across every GitHub ref was secret-scanned: 0 live secrets.
- **2026-09-28**: `one-roadmap` **shipped**. Golden Frijoles has one planning home. The plugin repo's 6 epics, 12 seeds,
  3 audits, 3 bets and 45 new LEARNINGS entries moved here, and the board reads 28–54 as one ship history. In the same
  PR, the `jev-reanchor-thresholds` spike closed as a clean negative: DSPy ReAnchor, run offline on the recorded
  fixtures, keeps the hand Jev thresholds, and its fold check refused the overfit a naive refit would have shipped.
- **2026-09-25** — `experiments-for-humans` **shipped & live** (PRs #167, #169, #170, #172): the
  JSON textarea is gone; an experiment is five answered questions, and its page says what to do next.
  The lock caught two design errors before any code (adjacent FNV priorities collided; a saved draft
  could not be turned back into answers). The Production-write path is a revision-first
  compare-and-set that refuses to activate over a change it did not plan against — Start, Retry,
  roll-out and undo each name the exact version they replace. #172 took eight review rounds; two of
  them fixed over-corrections of the previous round's fix, and one fixed a seam patched at one caller
  but not its siblings.

- **2026-09-18** — `golden-frijoles-cli` **shipped & live** (PRs #149–#152): the engine's first write
  surface an agent can drive end to end. The architecture lock disproved three of the scope doc's
  assumptions before any code was written — the credential could not be an `api_keys` scope, "created
  disabled" had to mean *serving false* rather than *absent*, and the env-var "compatibility" question
  dissolved because the SDK reads no env var at all. Review ran nine rounds on Sprint 1 alone and
  found two Blocking defects on the **happy path** — interactive `gf login` hung after Enter, which a
  piped test cannot see — and an end-to-end spec found the epic's **headline command** returning 400
  (the parser requires a description; `--description` is optional). The last catch came at release:
  the CLI imported three SDK exports the **published** 0.4.0 lacked, invisible inside the monorepo
  because the workspace link resolves the local source. SDK 0.5.0 shipped with it.

- **2026-09-10** — `mockups-as-built` **shipped & live** (PRs #136–#140): the epic that made the last
  epic's number true. `design-system-rails` reported 27/27 with `outstanding: []` and at least
  sixteen routes did not resemble their approved design — the arithmetic was real and its input was a
  boolean somebody typed. The replacement is a **structural state contract generated from the
  approved prototype**, per route, blocking, with the coverage number derived from its result rather
  than from a flag. A screenshot diff was specified and **disproved by measurement before it was
  written**: the route the plan called correct came out farther from its picture than the one it
  called wrong, on both metrics, so no threshold separated them.
  Nine defects were found by **opening the page** on routes whose signature already agreed — including
  an activity timeline that had been rendering as one crammed line since the previous epic — and
  three more "failures" turned out to be **fixture gaps**, where the gate blamed a page that was
  correct. Deleting one flag meant fixing **six suites that read it** and would otherwise have skipped
  forever, this epic's own blocking gate among them.
- **2026-09-02** — `design-system-rails` **shipped and live** (`3258381`, PR #135): the epic that gave the design a home.
  The premise was one level below the symptom — the last epic shipped a rejected visual result
  because *nothing in its plan could go red on a page that looked wrong*, and the design it was
  measured against lived in a folder named after an epic that had closed. Now
  `apps/web/design-system/` holds the approved prototype, the generated tokens and stylesheet, the
  measured spec, the primitives and the coverage manifest, at a product-level path; **27 of 27**
  routes render from it, the visual gate is blocking, and coverage is a generated number a PR cannot
  lower. Sprint 6 is the half that makes that true rather than aspirational: the nine routes a
  customer meets *first* — `/login`, `/signup`, `/install`, a shared report and its designed 404,
  `/talk`, and the four `/hub` screens — came off four different private stylesheets onto one frame,
  and **the design this epic replaced was deleted rather than left underneath it**. Five plan
  corrections came from reading the code instead of the plan, including a password hint that
  promised twelve characters where the API enforces eight, a note promising a destination the signup
  flow does not visit, and an approved state that is unreachable because its route 404s by design.
  Fourteen specs went red at once on a *per-file* JSX pragma, and a coverage guard sliced a component
  by indentation and broke on a wrapper element — both fixed as classes, not instances.

- **2026-08-28** — `console-ia-overhaul` **shipped and live** (PRs #122/#123/#124 + Sprint 3B). The
  epic that had to correct its own plan to finish: Sprints 1 and 2 shipped a *correct* information
  architecture and a visual result the product owner rejected on sight, because the plan had demoted
  the approved design to "inspiration" — thirteen structural acceptance criteria, all satisfied, and
  **not one that could fail on the way a page looked**. A22 withdrew that sentence, made
  `design/CONSOLE-CONTRACT.md` binding for every signed-in route, and turned the contract into a
  spec that measures the page. It was red at **2889px in a 960px viewport**; Story 3.3 — deleting
  both free-key authoring paths and landing the "New feature" wizard in the same commit — is what
  turned it green, and it now runs in CI. Six defects in this sprint were found by opening the page
  rather than reading the diff, including **every confirmation dialog in the product pinned to the
  top-left corner of the viewport** since the component shipped. Six of nine locked decisions
  survived contact with the live database; the three that did not became numbered amendments before
  a builder could inherit them.
- **2026-08-20** — `site-url-preview-aware` **shipped** (PR #116, deployed `c2589e1`): the smallest
  epic in a while and the one with the most review rounds — nine, most of them finding a hole in the
  previous round's fix. The nine-line fix was never the work; proving those nine lines cannot mint a
  URL someone keeps was. `vercel env ls`, run before writing anything, showed that every dangerous
  call site is already unreachable on a preview because its database is Production-scoped — which
  turned the epic's scariest question into an observation and avoided a much worse design.

- **2026-08-20** — `agentic-pm-public-surface` **shipped and live** (PRs #111/#113/#114, deployed
  `c37fafe`): the landing argued a category it never named. It names it now, once, from one module
  that five surfaces import — and the page opens with something a reader can *use* rather than two
  pictures they have to take on trust. Two sections came out with it, including the only
  non-illustrative evidence on the page, on a deliberate call recorded in the epic. The North Star
  workshop stopped being eight questions any model could have written and became the framework;
  `/llms.txt` stopped being a stale sitemap and became a brief. 13 amendments, 19 review rounds, and
  a copy-button defect that had been live for two epics and was found by looking at a screenshot.

- **2026-08-20** — `methodology-experience` **shipped and live** (PRs #104/#105/#107/#108, deployed
  `727fc04`): the landing has said *"the way to learn it is to use it"* for months over a CTA that
  went nowhere. It now goes to `/methodology` — six chapters at their own URLs, readable without
  JavaScript, in a room that reads as a document rather than a sales page. The whole method lives in
  one typed module, so there is no second copy of the prose anywhere; the downloadable edition is
  **generated** from it rather than maintained beside it. Four of the mockup's five defects were
  fixed in the content, including six chapters that rendered a raw `{1:"…"}[n]` JavaScript literal
  as their opening paragraph. The materials pass survived its circuit breaker on evidence gathered
  BEFORE the build — the first visual read was wrong and the measurement caught it. Reader telemetry
  is proved by a non-zero funnel read out of the production database, not by a 200. And a
  product-owner question mid-flight ("can any agent read this?") turned up seven measured gaps,
  including a sitemap that **no story owned** under an acceptance criterion that read as though it
  were already handled.

- **2026-08-20** — `landing-readability-pass` **shipped and live** (PR #102, `0ec12b3`): the landing
  says each thing once. Every `tag-live` badge is gone and the page carries zero green ink, verified
  by sweeping computed styles over every element rather than by grepping a class name — which is what
  caught the two trend readings that no class search would have found (recoloured, not deleted: they
  are real measurements). Two sections came out with nothing orphaned. The hero's bag and agent
  window now overlap in ONE grid cell, so the row height is measured rather than declared and the
  bag's title keeps a constant 52px of clearance at every width above 1000px. Twenty-one production
  smoke checks pass on the live site.
- **2026-08-13** — `scenarios-pm-operable` **shipped dark** (PR #98, `5bca24c`): the scenario engine
  now has a PM-facing owner surface for closed-choice definition, bounded launch/retry/stop, target
  state, and an honest control-vs-treatment evidence thread. The additive owner-session facade keeps
  every write project-scoped and actor-attributed while sharing the credential rail's transaction
  cores. `SCENARIO_AUTHORING_ENABLED` remains OFF pending the named synthetic production walkthrough
  and rendered-claim judgment; read-only evidence remains available throughout.
- **2026-08-13** — `frijoles-rebrand-closeout` **shipped and live** (PR #96, `0a0beb0`): the name now
  holds below the public surface too. `@golden-frijoles/sdk@0.4.0` is public and clean-installable,
  the old `0.1.0` package points forward, and the OpenFeature provider identity break is explicit.
  The footer's mockup ledger is gone without weakening the local honesty labels. The long-owed
  signed-in mobile sweep reached eight real app routes and immediately found shared tap-target and
  table-overflow defects that the anonymous rail could only measure on a login redirect.
- **2026-08-13** — `landing-frijoles-rebrand` **shipped and live** (PR #95, `5544c06`): the product
  is **Golden Frijoles**, on **goldenfrijoles.com**. Beyond the rename, this epic repaired two
  defects the previous one shipped and made the page's materials one system. Three things are worth
  carrying forward. **Both bugs were specificity accidents** — nothing was wrong in isolation, which
  is exactly why they survived review and reached a human's eye instead. **Reproducing the selection
  bug in two engines before touching it prevented a wrong fix:** the full-width extension is UA
  selection painting and cannot be changed from CSS; what was ours was the opaque fill, so the fix
  was a material change, not a geometry one. And **fifteen cross-family review rounds found real
  defects for nine of them** — three of which were in the *guards* rather than the product,
  including a drift check that had been reporting the wrong line number for its entire existence,
  found by the second family in one pass after the first missed it in nine.
- **2026-08-12** — `landing-redesign-v2` **shipped and live** (PR #92, `4553767`): the public page
  now sells the decision rather than the engine, and gives a stranger something usable — a North Star
  workshop their own agent runs — before asking for anything. Two things are worth carrying forward.
  **Mobile shipped as rails, not as an audit:** zero-specificity floors in `globals.css` plus one
  sweep spec over a *list* of routes, which found the site's most-tapped control 4px under the
  accessibility floor on its first run; covering the next route is now one array entry. And **the
  honesty rules did real work against a signed-off mockup** — four of its claims were not checkable
  (hardcoded velocity stats, a price with no billing rail, a URL that 404'd, a CLI command that does
  not exist) and all four were resolved in favour of what can be verified, without losing the design.
  Five review rounds, nine findings; round 2's "clean" verdict came from a reviewer that had attached
  **zero files**, which is the session's sharpest lesson: read the scope line before the findings.

- **2026-08-26** — `flags-console-parity` **shipped to production, dark** (PRs #118/#120/#121, plus
  #119 in the reviewer tooling): the flag console a human can operate. Four sprints' worth of near-
  misses taught the epic's one durable rule — **moving a control is not one change, it is a change
  plus everything that pointed at it**; four times something was nearly removed before its
  replacement existed, three caught by review and one by a vocabulary sweep that happened to read
  every surface. The money-path find was mine to own: the console equated *an activation row exists*
  with *the feature is on*, and production says the latest version of **34 of 42** flags evaluates
  `false` — so "Turn on in production" would have served `false` on most of them, under a success
  notice. Enabling a third reviewer family also shook two real bugs out of the review rail itself: it
  was feeding reviewers file content from the working tree rather than the PR head, and a truncated
  review was posting as a clean pass.

- **2026-08-10** — `flags-visual-rule-builder` **built out end to end** (PRs #87/#88/#89; Sprint 1
  merged dark, Sprints 2 and 3 awaiting the owner's merge): the flag control plane finally has an
  authoring surface, a picture of where each flag actually reaches, a version history that reads as
  sentences, and a "what would this user see" that answers with the **SDK's own evaluator**. A3 is
  the shape of the epic: `evaluateFlag` could not name which rule matched, and collapsed *"a clause
  failed"* and *"the rollout excluded you"* into one `false` — the single outcome a PM is most likely
  to report as a bug. Rather than write a second matcher in the app (D4's exact named failure), the
  private predicate was split in two and `matchesRule` redefined as their conjunction, so the
  evaluator is unchanged **by construction** and the exported explanation is built from the same two
  halves. **Sprint 2 took seven review rounds and sixteen real defects**, and the reason it did not
  stop at two is the finding worth keeping: **round 4 was clean from both external families, and the
  fresh reviewer found a regression that round 3's own fix had introduced.** Rounds 5 and 6 each
  found one more path after the second family had gone clean three rounds running. Four of those
  sixteen were one cause wearing four hats — a TypeScript type over a JSONB column is a promise the
  database does not make, and guarding each field by hand was building the second validator D2
  forbids, always one review finding behind.
- **2026-08-09** — `app-component-kit-adoption` **epic shipped & LIVE** (PRs #82/#83/#84): the kit
  finally reached the routes, and nothing irreversible is one click away any more. The
  architecture-lock pass earned its keep before a line was written — it read the code instead of the
  plan and found **D5, a locked decision the whole of Sprint 3 rested on, described a component that
  does not exist as described**: `AgentRail.tsx` "already confirms" was false (it is read-only, zero
  controls), and the real pre-existing confirmation sat unmentioned in `destinations`. Unchecked,
  Sprint 3 would have shipped the second confirmation pattern D5 existed to prevent. Cross-review
  then caught what CI cannot: a green PR whose `ConfirmDialog` **stranded keyboard users on
  `<body>`** because it unmounted itself instead of calling native `close()` — the focus-trap spec
  passed it, having only ever examined focus *while the dialog was open*. A spec that watches a
  mechanism running will not notice it never puts anything back. Two other "regressions" turned out
  to be the environment, disproved by running the identical command on clean `main` rather than
  reasoning about the diff: a `next dev` server corrupting the local gate's own build output, and a
  spec failing on accumulated fixture data. And "less code", the Sweeper prior, was measured and is
  simply **false** for table conversions (136→135, 152→163) — the acceptance that survives is *same
  behaviour, no regressions*, which is falsifiable.
- **2026-07-26** — `pod-report` **epic shipped & LIVE** (PRs #30/#32/#33/#34): the Outcome report and the
  Roadmap Hub, both rendered from the same versioned immutable artifact primitive. Sprint 2 had
  computed every number and shipped none of the surface — a re-derivation against production found
  `--push` exiting 0 without storing anything and an outcome module with zero callers, so a Sprint 2.5
  carry-over built the surface those numbers had nowhere to render into. Three latent bugs were found
  by running things rather than reading them, including a payload CHECK that would have rejected every
  `pod_report` push (verified against production before the fix). Review took six rounds across two
  model families: agy found seven Should-fix and went clean on the auth surface, then Codex opened with
  a Blocking finding on that same surface plus a `CHECK` constraint that evaluated to NULL and so
  permitted exactly the row it appeared to forbid. Also fixed the Telegram rail properly — a rejected
  ping now turns its workflow red instead of leaving a green check, and the escaping/length rule is one
  tested function instead of two.
- **2026-07-23** — `experiment-governance-v2` **epic shipped & LIVE in production** (PRs #19/#22/#23):
  the capstone — an **immutable human decision record** for a stopped experiment (ship/keep/iterate/
  inconclusive/invalid + rationale over a frozen definition/analysis/integrity snapshot, append-only,
  owner-only, and structurally unable to mutate a product flag or roll out a variant), plus one resolver so
  the authenticated UI, the Bearer compare API and the gated MCP tool serve byte-identical plan + diagnostics
  + metrics + decision. Registry, immutable lifecycle and governed trust analysis (SRM/segments) shipped in
  Sprints 1–2. A fresh cold review caught a real accepted-but-unreadable resource-cap defect (fixed,
  mutation-verified); Agy + Devin reviewed clean. Rolled out 2026-07-23: migration applied to prod,
  `EXPERIMENT_GOVERNANCE_ENABLED` flipped ON, flag flip verified live (governed routes now authenticate
  instead of 404); the ledger's behaviour is covered by the 307-spec gate, and the authenticated
  prod decision round-trip validated on the UI.
- **2026-07-28** — `experiment-governance-v2` **proven on its first real customer surface**: the Tiendas
  Fundadoras promise/CTA test ran end to end through Miyagi's own flags (`miyagisanchezcommerce` #316/#317),
  with assignment staying local and Golden Beans never reading or changing a Miyagi flag. A clean 12/12 fixture
  was decision-ready with SRM clear and measured control 25.0% vs treatment 58.3% at metric addressability 1.0;
  a deliberately skewed 12/30 fixture flipped it to `srm_detected` (χ²=7.71, p=0.0055 < α=0.01) with every
  metric still visible. Close-out decision recorded as `invalid`. The dogfood paid for itself three times over:
  metrics join by `context.subject` (Miyagi sent none), the conversion lived in a different id space from the
  exposure, and the v1 plan declared an eligibility tag the emitter never sends — the last of which **the
  governance layer caught itself in production**, naming the cause instead of reporting a plausible zero.
- **2026-07-23** — `entity-journeys-projections` **epic shipped**: a tenant can define an ordered
  lifecycle beyond fixed TARS and read deterministic subject history plus cohort conversion, aging,
  drop-off and retention through one project-scoped UI/API/MCP resolver. The live
  `merchant_activation` v1 proof reached all 13 Miyagi founding-merchant stages from normal
  `/api/v1/track` facts, with no merchant PII or copied CRM/commerce state. Production query evidence
  (p95 <120 ms; 13 relevant events) stays far below the >2 s / >1M-event tripwires, so no projector
  or materialized subject table is justified.
- **2026-07-22** — `event-destination-router` **epic shipped**: the event stream is now
  *operational*. A tenant creates a signed, filtered webhook destination and their events are
  delivered reliably — at-least-once, with bounded retries, dead-lettering and operator replay —
  while ingest stays fully decoupled from sink health (a transactional outbox). Delivery was
  activated in production 2026-07-22 with its first real consumer, Miyagi's merchant-lifecycle
  projection. Hardened over a 24-round cross-agent review (SSRF closed with a connection-pinned
  sender; a tightly-scoped, property-bound AGENTS.md exemption for the background scheduler). Attio
  adapter deferred (optional, needs a token).
- **2026-07-21** — `multi-tenant-activation` **epic shipped**: the engine was multi-tenant by
  design and single-tenant in practice; it is now multi-tenant in operation. A stranger goes from
  the landing page to their own isolated, credentialed, quota-bounded tenant with no human in the
  loop — and that path was walked by a real user in production on launch day. A confirmed signup now becomes a working tenant with no human in the loop, and the
  shared ingest path grew per-tenant isolation limits so an open signup can't hurt a real tenant or
  the bill. Everything customer-facing sits behind `SIGNUP_ENABLED`, born OFF — the launch itself is
  Story 3.3, an env flip followed by a Git-tracked redeploy. Three rounds of cross-family review (Codex + Agy) found
  **12 blocking issues** pre-merge — including an infinite redirect loop, a quota-accounting bug
  that would have made "raise the ceiling" silently fail to restore service, and a **live
  production bug in the already-shipped landing funnel**: its dogfood events were never tagged with
  a feature id, so the funnel had been reading zero since launch while ingesting perfectly (fixed,
  and the four orphaned historical events were backfilled).
- **2026-07-21** — `multi-tenant-activation` **Sprint 1 shipped to production**: the account
  boundary. Dashboards were anonymous (anyone who guessed a project slug could read any tenant's
  data) and each project had one unrotatable key — both closed. Supabase Auth + `project_members`,
  per-tenant authorization, and `api_keys` as a revocable lifecycle, with every existing tenant's
  live ingest key migrated in (verified in prod: a real backfilled key still authorizes). Two rounds
  of cross-family review (Codex + Gemini) caught 6 blocking issues pre-merge, including a live open
  redirect and a cross-tenant credential bind.
- **2026-07-20** — `commercial-shell` **launched** (epic shipped): the landing dogfoods the growth
  engine as its own tenant (a real visitor→waitlist funnel + a `waitlist_conversion` Grower signal),
  serves real OG/Twitter cards and an `llms.txt` agent-readable manifest (Stories 3.1–3.2, PR #11),
  and the read-only **MCP connector is now enabled in production** with a live demo token
  (Story 3.3 — self-tenant seeded, demo token minted, `CONNECTOR_ENABLED` flipped ON; domain stays
  on the Vercel deployment host for v1 (since moved to `goldenfrijoles.com`)).
- **2026-07-16** — `growth-engine-v1` shipped: a standalone telemetry engine (event ingest + SDK),
  a TARS (Targeted/Adopted/Retained) funnel, a North Star metric with real Medusa revenue inputs,
  and client-side A/B bucketing with a basic-lift comparison view — all proven against one real
  Miyagi feature (the setup-guide funnel) with live production traffic.

## License

Licensed per folder: Apache-2.0 for `skills/`, the CLI and the SDK; FSL-1.1-ALv2 (each version becomes Apache-2.0
two years after release) for `apps/web/` and everything else. See [`LICENSE`](../LICENSE) and the trademark note in
[`NOTICE`](../NOTICE).
