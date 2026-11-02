---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-11-02T21:15:24Z"
slug: off-vercel-hosting
title: "Off Vercel: production on our own box"
area: 09-platform-infra
risk: high
type: chore
sprints_total: 3
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 85   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 33
quote_basis: "M, n=27, p25–p75"
hypothesis: null   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: null   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: null   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
satisfied_min_score: null   # the score (1–5) a satisfaction_rated answer needs to count as satisfied · null = 4
build_order: 102     # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Off Vercel: production on our own box

> **Area:** 09-platform-infra · **Risk:** high · **Class:** Chore · **Scope seed:** [`00-ideas/seeds/off-vercel-hosting.md`](../../00-ideas/seeds/off-vercel-hosting.md)
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
goldenfrijoles.com has been down since 2026-10-30: nine projects shared one free Vercel quota and Miyagi's CI used it
up, so every visitor, SDK call, CLI command and connector request got a 402. This epic moves production to the Oracle
VM as a portable Docker image, deployed on every merge to `main`, so a free-tier meter can never take the product
offline again and nothing we build ties us to one host. We'll know when the domain, ingest, the connector and the
delivery waker answer from the VM and the 🚀 message names the merged commit.

## Platform-first note
No product primitive changes: Supabase stays the system of record and no migration ships. Rule #1 (the engine owns
telemetry) and rule #2 (public = demo only) are untouched. Rule #4 is REWRITTEN (Daniel approves the text, S3.2); rule
#5 holds (`SITE_URL` is set on the VM, never a Host header); rule #6 holds (gates stay catalog flags; the seam only
decides WHICH flag environment is read).

## What already exists (reuse, don't rebuild)
- CI's local server boot (`.github/workflows/ci.yml`, `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100`): the app already runs as a plain Node process.
- `lib/site-url-resolve.ts`: `SITE_URL` first, so the VM needs only `SITE_URL=https://goldenfrijoles.com`.
- `lib/gates-decision.ts → flagEnvironmentFor()`, `lib/notify-policy.ts`, `lib/billing-decision.ts`: the readers the seam replaces; extend their specs.
- `lib/gates-guard.test.ts`: the shape for the new `VERCEL_ENV` guard.
- `notify-telegram.yml` (`deployment_status`): keeps working if the deploy job writes GitHub Deployments.
- `/api/internal/resilience/probe`: the health check target.
- The pg_cron waker (`20261020100000_delivery_waker.sql`): calls a URL from Vault, same domain, no change.
- LEARNINGS on Miyagi's Cloud Run cutover: verify env vars by exercising behaviour, never by listing them.

## Architecture lock (2026-11-02, verified against live code and live data)

- **D1 — One seam, `lib/deploy-env.ts`.** `deployEnv(env)` → `'production' | 'preview' | 'development'`: on Vercel
  (`VERCEL=1`) `VERCEL_ENV` alone decides, so a `DEPLOY_ENV` in Vercel's shared scope can never promote a preview
  (amended after the verifier, #444); elsewhere a non-empty `DEPLOY_ENV` decides (unknown → `development`), else
  `VERCEL_ENV`, else `development`. Pure, takes an env object (default `process.env`).
- **D2 — `isDeployed(env)` replaces `isOnVercel()`.** `VERCEL === '1'` OR `DEPLOY_ENV` is `production`/`preview`.
  **Scope the pitch missed:** `gates-decision.ts → envOverride()` lets a set `*_ENABLED` var override the catalog
  whenever `isOnVercel()` is false, so on the VM a stray `*_ENABLED` would silently beat a kill switch (rule #6). Live
  check: Vercel Production holds no `*_ENABLED` var today, so the hole is latent; D2 closes it before the VM exists.
- **D3 — Every behaviour-deciding reader goes through D1/D2** (live grep, 11 sites): `gates-decision.ts` (182, and
  `isOnVercel` 147–156), `gates.ts:66`, `self-track.ts:231`, `notify-policy.ts:82,89`, `billing-decision.ts:279`,
  `webhook-url.ts:38` (**missed by the pitch**: the localhost-webhook carve-out must stay closed in production on the
  VM, where loopback is the box itself), `site-url-resolve.ts:68,95`, `site-url.ts:29` (forwards `DEPLOY_ENV` too),
  `app/page.tsx:76`, `resilience/probe/route.ts:62`. `notify-policy`'s escape hatch keeps its meaning: "absent" =
  BOTH `VERCEL_ENV` and `DEPLOY_ENV` unset. `VERCEL_BRANCH_URL`/`VERCEL_URL` stay as the preview-host source (no
  previews in this epic). `playwright.config.ts`'s bypass secret is test tooling, untouched.
- **D4 — Guard.** A node:test (`lib/deploy-env-guard.test.ts`, shaped like `gates-guard.test.ts`) fails on a
  `.VERCEL_ENV` / `.VERCEL` property read in non-comment, non-test code under `apps/web/{app,lib,middleware.ts}`
  outside `lib/deploy-env.ts` and the one forwarder `lib/site-url.ts`.
- **D5 — Image.** `output: 'standalone'` + `outputFileTracingRoot` = repo root. Root `Dockerfile`, Node 24 slim
  (Vercel ran 24.x), stages deps → build → runtime; the runtime copies `apps/web/.next/standalone`, `.next/static`
  and `public/`, runs `node apps/web/server.js` as a non-root user on `PORT=3000`, `HOSTNAME=0.0.0.0`. Build-time
  ARGs are exactly `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (live grep: the only
  `NEXT_PUBLIC_*` the code reads; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` exists in Vercel but nothing reads it), and
  **they are set in the runtime stage too**: `lib/supabase-auth.ts` reads them by a dynamic key Next does not inline,
  so without them every session read 500s (the container-smoke job caught it on #444; corrected here).
- **D6 — CI `container-smoke` job** reuses `.github/actions/e2e-setup` (local Supabase, credentials in
  `$GITHUB_ENV`), builds the image with those build args, runs it with `--network host` on :3000 with the ON-gate env
  file, waits on `/llms.txt`, proves no runtime secret is in any layer, and runs a fixed api-spec subset against it
  (`PLAYWRIGHT_BASE_URL` explicit). Skippable on docs-only like the e2e jobs;
  added to `gate`'s `needs` and `--skippable`.
- **D7 — Ingress is a Cloudflare Tunnel, not open ports (deviation from S2.1's text).** Live: the account already
  runs tunnels (`n8n-server`, remote-managed, healthy). A dedicated remote-managed tunnel `golden-frijoles` with a
  `cloudflared` service in our compose: no 80/443 contention on a shared box, no origin cert, no IP allow-list, the
  VM's IP never public. DNS becomes a proxied CNAME to `<tunnel-id>.cfargotunnel.com` (S3.1). The tunnel token lives
  in the VM's `.env`. Needs Daniel's yes (a new TLS/ingress path).
- **D8 — Which box.** Live: `n8n-server` connects from a GCP address, not Oracle. The Oracle VM's identity, access and
  inventory are S2.1's first step, owed by Daniel; nothing in S1 depends on it.
- **D9 — Deploy.** GHCR package `ghcr.io/danybgoode/golden-frijoles`, public (the image holds no secret; the two
  build-time values are public by design), so the VM pulls without registry credentials. Built natively on
  `ubuntu-24.04-arm`. GitHub Deployment written by the job (environment `Production`).
- **D10 — Routing.** The orchestrator (Opus 5.5) builds S1–S3 in place (one session in this checkout; S2/S3 need
  Daniel at the box, so a separate builder buys nothing). Reviews: the fresh `verifier` on every PR (high risk) plus
  `review-route.mjs`.

- **D11 — The VM's own tenant contract wins (found 2026-11-02, after D7/D8 were written).** The VM is shared, and its
  operating rules live in a private repo (pointer only, per public-monorepo D7): CI-built arm64 images pulled by the
  VM, one deploy script per tenant, caps and a health check on every service, a shared proxy, env files 0600 with a
  password-manager copy, a nightly backup unit. Two consequences for S2: GitHub Actions cannot reach the VM over SSH,
  so S2.2's push deploy becomes a pull; and the box's spare capacity must be measured before we add a tenant. S2
  re-locks D7/D9 against that contract before building.
- **D12 — Trusted client IP (S2, verifier #444).** Five routes key rate limits on the leftmost `x-forwarded-for`
  (public signup, waitlist, self-visit, CLI device + token). Behind Cloudflare → a proxy, the client can set that
  value. S2 decides one seam (Cloudflare's `cf-connecting-ip`, trusted only because the origin is reachable through
  Cloudflare alone) before DNS moves.

### Build contract — Sprint 1 (locked by the architect before the builder started)
D1–D6. Inert on Vercel: with `DEPLOY_ENV` unset every reader returns what it returns today (each reader's existing
spec stays green unchanged). No behaviour change, no env var added anywhere yet.

### Build contract — Sprint 2 (re-locked 2026-11-02 against the VM's tenant contract; Daniel's decisions)
- **D7 → superseded: the shared proxy, not a tunnel.** Daniel chose the SOP: the container joins the `edge` network as
  `golden-frijoles-web`; a site file `deploy/oci/golden-frijoles.caddy`, installed by our own deploy to the shared
  proxy's sites directory, validated inside the proxy and restored on failure; a Cloudflare Origin CA certificate
  issued from a CSR generated ON the VM (the key never leaves it), SSL mode Full (strict). The site file sets
  `X-Forwarded-For`/`X-Real-IP` to `CF-Connecting-IP`, as the other tenants do — that is D12's answer: the
  rate-limit routes read a leftmost XFF the proxy now writes.
- **D9 → amended: the VM pulls.** `.github/workflows/deploy.yml` builds `linux/arm64` natively, pushes
  `ghcr.io/danybgoode/golden-frijoles:{main,<sha>}` (public) with the revision as a label and as the `x-gf-revision`
  response header (`GF_REVISION`, next.config `headers()`). A systemd timer on the VM runs
  `deploy/oci/update.sh --if-changed` every 2 min: digest-pinned pull (a failed pull fails, never a cached image),
  `compose up`, site file, health check from inside the container, roll back to the previous digest on failure. The
  workflow writes the GitHub Deployment, waits for the live `x-gf-revision` to equal the merge, sets the status and
  posts the 🚀 itself (events from `GITHUB_TOKEN` start no other workflow, so `notify-telegram.yml` would not fire).
- **D13 — Capacity, measured.** Live 2026-11-02: 3.3 GB used / 8.6 GB available of 12 GB, load 0.3 on 2 OCPU. Our cap:
  0.75 CPU / 768 MB. No other tenant's cap is trimmed (Daniel: only if tight; it is not). Recorded in the tenant table.
- **D14 — Secrets.** `deploy/oci/web.env` (0600, `ubuntu`) holds every runtime value; the agent writes the readable
  ones plus `DEPLOY_ENV=production`, `SITE_URL`, and a marked blank line per Sensitive value, which Daniel fills on
  the VM. Copy in the password manager (Daniel). Nothing serves traffic before DNS moves (S3), so a blank is safe.
- Nothing changes DNS in S2. Proof: `curl --resolve goldenfrijoles.com:443:<vm>` reaches the app through the proxy.

### Build contract — Sprint 3
DNS flip recorded first (the old CNAMEs are the rollback). Rule #4 text approved by Daniel in the PR.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 One deploy-environment seam | high |
| 1 | S1.2 A portable Docker image, built and booted in CI | high |
| 2 | S2.1 The VM, inventoried and ready | high |
| 2 | S2.2 Deploy on merge to main | high |
| 3 | S3.1 DNS cutover and the production smoke | high |
| 3 | S3.2 The rules say where production lives | high |

## Deploy order
S1 merges first and is inert on Vercel (the seam falls back to `VERCEL_ENV`). S2 deploys to the VM while DNS still
points at Vercel, proved by IP. S3 flips DNS (rollback: the recorded records, or the previous image tag), then the
rules change. No Supabase migration. No previews in this epic.

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
