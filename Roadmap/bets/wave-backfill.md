# Backfill — bets built with no funding record (2026-10-04)

**This is not a cycle and nothing here was bet.** When fund-at-approval made "scaffolded ⇒ funded" a hard rule
(`build-order.mjs` fails a live bet with no `underwritten_by`), 45 scaffolded or shipped bets had no funding record:
the betting table had been a separate step `groom` never reached. Each now points here, so the rule can go hard on
day one without inventing history. What each displaced was never written down, so the column says so.

From 2026-10-04 every bet is funded at `groom`'s approval gate (`fund.mjs`) into the month's cycle file, and nothing
is added to this file again.

| Bet | Appetite | Displaced (the opportunity cost) |
|---|---|---|
| **ai-adoption-maturity-lens**: AI-adoption maturity lens — the Pod Report places the pod on the published ladder (E3 amendment) | — | not recorded |
| **board-sinks-and-scrumban**: One stage, every client: a six-stage board on the Hub, the CLI mod and every sink, from one resolver | **L** | not recorded |
| **ci-diet**: CI diet: kill the duplicates, skip e2e on docs-only PRs, parallelise, and make every flake leave evidence | **M** | not recorded |
| **cli-body-order-guard-clone**: The CLI body-order guard misses req.clone().json() | **S** | not recorded |
| **cms-integration-spike**: E6 — CMS-neutral experiment integration + Payload go/no-go | — | not recorded |
| **commercial-shell**: E1 — Commercial shell: Golden Beans landing, waitlist, connector install page | — | not recorded |
| **compiled-prompts**: Compiled prompts, wave 1: Jev questions become data, optimize/ is committed, and wording gets measured | **M** | not recorded |
| **console-ia-overhaul**: Four destinations — an information architecture for the signed-in console | **M** | not recorded |
| **design-system-lift**: Design system lift — the limitless golden-bean brand | — | not recorded |
| **design-system-rails**: One design system, every surface — the rails that make a design outlive an epic | **L** | not recorded |
| **distribute-what-we-use**: Distribute what we use: one review rail, Jev and notify setup, schedulers, build view | **M** | not recorded |
| **entity-journeys-projections**: Entity journeys — configurable lifecycle projections beyond fixed TARS | — | not recorded |
| **event-destination-router**: Event destination router — reliable fan-out to CRM and downstream tools | — | not recorded |
| **experiment-governance-v2**: Experiment governance v2 — registry, metrics, guardrails, and decision record | — | not recorded |
| **experiments-for-humans**: Experiments for humans: a guided five-question flow replaces the JSON textarea | **L** | not recorded |
| **finops-actuals**: FinOps: quote vs actual per epic — measured from your own sessions, shown live in the build view, sent to the engine | **L** | not recorded |
| **finops-quotes**: FinOps quotes: an appetite becomes a calibrated token/$ range, then quote vs actual per epic | **M** | not recorded |
| **flag-serving-and-prd-g**: E5 — Flag control plane + Miyagi migration + resilience/SecOps circuit breakers | — | not recorded |
| **flags-console-parity**: The flag console a human can operate — Flagsmith-grade IA, terminology and list ergonomics | **M** | not recorded |
| **frijoles-rebrand-closeout**: Golden Frijoles rebrand close-out — SDK identity, footer cleanup, and authed mobile rail | **S** | not recorded |
| **growth-engine-v1**: Growth Engine v1 — telemetry ingest, SDK, TARS funnel, North Star, A/B bucketing | — | not recorded |
| **intent-match**: Intent match (wave 1, advisory): a score for how well the plan captured the ask, routed follow-ups, and a rule for visuals | **M** | not recorded |
| **kickoff-generator-path**: The kickoff generators run from anywhere: shipped in the kit, named correctly in every doc | **M** | not recorded |
| **landing-frijoles-rebrand**: Golden Frijoles — the rebrand, the material pass, and the controls that were broken | — | not recorded |
| **landing-readability-pass**: The landing reads at a glance — the maker-ops page, cut down to what it claims | — | not recorded |
| **landing-redesign-v2**: Landing redesign v2 — the agent harness for product managers | — | not recorded |
| **live-build-view**: Live build view: the band moves while the agent works, from facts no agent writes | **M** | not recorded |
| **mockups-as-built**: The mockups, as built — delete the disclosures and finish the screens | **M** | not recorded |
| **multi-tenant-activation**: E2 — Multi-tenant activation: auth hardening, self-serve tenants, pod trials | — | not recorded |
| **north-star-dry-run-sendable**: CLI follow-ups from think-skills: a machine-readable dry-run verdict, and a body-order guard that can fail | **S** | not recorded |
| **north-star-multi-metric-read**: A project with two North Star metrics breaks its North Star page and its Pod Report | **S** | not recorded |
| **notification-rails**: Notification rails — Telegram and Slack in lockstep | — | not recorded |
| **one-roadmap**: One Roadmap: the plugin's epics and seeds move into this repo | **S** | not recorded |
| **pod-report**: E3 — Pod Report + Roadmap Hub: benchmarks/ROI + live roadmap-vs-end-state views | — | not recorded |
| **portfolio-view**: Portfolio view: every product in a workspace on one page, placed on the Consider · Operate · Exit loop | **M** | not recorded |
| **public-monorepo**: One public monorepo with per-folder licences, a private docs repo, and a lean install mirror | **M** | not recorded |
| **review-rail-one-implementation**: Review rail — one implementation, and a doctor the template actually ships | — | not recorded |
| **semantic-lint**: Semantic lint: Jev judges what deterministic checks select (v1: AGENTS rule 1, in shadow) | **S** | not recorded |
| **session-budget**: Session budget: 'one deep ask per approval gate' plus a measured line | **S** | not recorded |
| **signals-loop**: E4 — Signals loop: error/friction signals → structured tasks → the customer's own agent | — | not recorded |
| **site-url-preview-aware**: A preview deployment stops calling itself localhost | — | not recorded |
| **sketch-specs**: Sketch specs: a surface spec renders the grey wireframe and becomes the state contract | **M** | not recorded |
| **think-skills**: Think skills: PMF Narrative → North Star → Risk Validation ship in the plugin, write files groom reads | **M** | not recorded |
| **verify-spike**: Verify spike: Quint on the event outbox and Lean on the flag evaluator, dogfooded on Golden Frijoles | **S** | not recorded |
| **workspaces**: Workspaces become the tenant: one person, many products, one boundary | **M** | not recorded |
