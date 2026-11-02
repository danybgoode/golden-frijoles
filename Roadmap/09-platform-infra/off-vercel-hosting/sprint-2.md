---
epic: off-vercel-hosting
sprint: 2
title: "The box and the pipeline"
risk: high
phase: Shaping
stories_total: 2
stories:
  - id: S2.1
    title: "The VM, inventoried and ready"
    as_a: "the operator of golden-frijoles"
    i_want: "the shared Oracle VM to run a golden-frijoles container behind its proxy, reachable only through Cloudflare"
    so_that: "production has a home that no free-tier meter can pause"
    risk: high
    status: planned
  - id: S2.2
    title: "Deploy on merge to main"
    as_a: "the operator of golden-frijoles"
    i_want: "every merge to main to build, ship and health-check the image on the VM, and roll back on failure"
    so_that: "merging to main stays the deploy, with the live SHA on record"
    risk: high
    status: planned
---
# Off Vercel: production on our own box — Sprint 2: The box and the pipeline

**Status:** ⬜ not started

**Needs Daniel:** the VM's IP and an SSH user/key the agent may use; the Sensitive Vercel values `vercel env pull`
cannot read; adding the GitHub Actions secrets (SSH key, host). Ask for all three in ONE message at sprint start.

## Stories

### Story 2.1 — The VM, inventoried and ready
**As a** the operator of golden-frijoles, **I want** the shared Oracle VM to run a golden-frijoles container behind
its proxy, reachable only through Cloudflare, **so that** production has a home that no free-tier meter can pause.
**Acceptance:**
- An **inventory** written into this sprint doc before anything is installed: OS + arch, free RAM/disk, what listens
  on 80/443, the existing reverse proxy (if any) and the other services. Nothing already running is stopped or
  reconfigured beyond adding one site.
- Docker + Compose installed (if absent). `/opt/golden-frijoles/compose.yml` runs the image by `TAG`, with a memory
  limit sized from the inventory, `restart: unless-stopped`, bound to `127.0.0.1` only.
- The proxy (the existing one, else Caddy) serves `goldenfrijoles.com` + `www` with a **Cloudflare Origin
  Certificate**; 80/443 accept Cloudflare's IP ranges only (VCN security list and host firewall).
- `/opt/golden-frijoles/.env` (0600, owned by the deploy user) built from `vercel env pull` + Daniel's Sensitive
  values, plus `DEPLOY_ENV=production` and `SITE_URL=https://goldenfrijoles.com`. **A key-list diff against Vercel's
  Production scope shows no missing key.**
- A restricted `deploy` user whose key can only run the deploy script (forced command or sudoers line).
- Oracle console: a $1 budget alert (Daniel).
**Risk:** high (production infra)

### Story 2.2 — Deploy on merge to main
**As a** the operator of golden-frijoles, **I want** every merge to `main` to build, ship and health-check the image on
the VM, and roll back on failure, **so that** merging to `main` stays the deploy, with the live SHA on record.
**Acceptance:**
- `.github/workflows/deploy.yml`, on push to `main` (path-filtered like the app's CI) and `workflow_dispatch`:
  build `linux/arm64` on `ubuntu-24.04-arm` with the `NEXT_PUBLIC_*` build args, push `ghcr.io/danybgoode/golden-frijoles:<sha>`.
- SSH as `deploy` → `TAG=<sha> docker compose pull && up -d` → poll the health check (≤ 90 s) → on failure, `up -d`
  the previous tag and fail the job. The previous two tags stay on the VM.
- The job creates a GitHub Deployment (environment `Production`, ref = sha) and sets `in_progress` → `success` /
  `failure`, so `notify-telegram.yml` fires 🚀 and `gh api …/deployments` names the live SHA, unchanged.
- `concurrency: deploy-production` (one at a time, never cancelled mid-run).
- Proved on the VM's own hostname or IP (via `curl --resolve`) **before** any DNS change: the landing renders and a
  flag reads as `production`.
- The secret guard: no secret value printed in the job log.
**Risk:** high (deploy pipeline)

## Sprint QA
- **api spec(s):** none new (infra); the S1 container smoke covers the image. The deploy job is proved by one real run.
- **browser smoke owed:** no (DNS still points at Vercel).
- **deterministic gate:** `actionlint` on `deploy.yml` + the usual CI green before merge.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: the VM, by IP (DNS unchanged)

1. Merge any `apps/web` change to `main` (or run the deploy workflow by hand)
   → the "Deploy" run goes green and Telegram posts 🚀 with the merged SHA.
2. Run `curl -sI --resolve goldenfrijoles.com:443:<VM-IP> https://goldenfrijoles.com -k`
   → `HTTP/2 200` from the VM.
3. Run `gh api repos/danybgoode/golden-frijoles/deployments --jq '.[0] | {sha, environment, creator: .creator.login}'`
   → the merged SHA, `Production`, created by `github-actions[bot]`.

If any step fails, note the step number + what you saw — that's the bug report.
