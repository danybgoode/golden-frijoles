---
epic: off-vercel-hosting
sprint: 1
title: "Portable build"
risk: high
phase: Shipped
stories_total: 2
stories:
  - id: S1.1
    title: "One deploy-environment seam"
    as_a: "the operator of golden-frijoles"
    i_want: "the app to know it is production from DEPLOY_ENV, falling back to VERCEL_ENV"
    so_that: "gates, notifications and billing behave as production on any host"
    risk: high
    status: done
  - id: S1.2
    title: "A portable Docker image, built and booted in CI"
    as_a: "the operator of golden-frijoles"
    i_want: "a standalone Next build in a multi-stage Docker image that CI builds and smoke-tests"
    so_that: "the same image runs on the Oracle VM, Cloud Run or anywhere else"
    risk: high
    status: done
---
# Off Vercel: production on our own box — Sprint 1: Portable build

**Status:** ✅ shipped — PR #444, merge `0897040` (2026-11-02). Inert on Vercel by design; live since the S3 cutover.

Code only. Merges while Vercel is paused and changes no behaviour on Vercel (the seam falls back to `VERCEL_ENV`).

## Stories

### Story 1.1 — One deploy-environment seam ✅ `fb796ed`
**As a** the operator of golden-frijoles, **I want** the app to know it is production from `DEPLOY_ENV`, falling
back to `VERCEL_ENV`, **so that** gates, notifications and billing behave as production on any host.
**Acceptance:**
- `apps/web/lib/deploy-env.ts` exports `deployEnv(env)` → `'production' | 'preview' | 'development'`:
  `DEPLOY_ENV` wins, else `VERCEL_ENV`, else `development`. An unknown value is `development` (fail toward non-production).
- Every behaviour-deciding `VERCEL_ENV` read in `apps/web` goes through it: `gates-decision.ts` /
  `gates.ts` (`flagEnvironmentFor`), `notify-policy.ts` (keep its "absent" narrowing semantics: absent = BOTH unset),
  `billing-decision.ts`, `site-url-resolve.ts` (production/preview branches only; `VERCEL_BRANCH_URL`/`VERCEL_URL`
  stay as the preview host source), `app/page.tsx` (forced variant), `resilience/probe`, `guarded-http.ts`,
  `self-track.ts` if it decides on it.
- Pure spec over the table: DEPLOY_ENV only · VERCEL_ENV only · both (DEPLOY_ENV wins) · neither · garbage. Existing
  specs of the readers stay green unchanged.
- A guard test fails CI on any new `process.env.VERCEL_ENV` / `env.VERCEL_ENV` read in `apps/web` outside the seam
  (same shape as `lib/gates-guard.test.ts`).
**Risk:** high (gates, billing, notify — production behaviour)

### Story 1.2 — A portable Docker image, built and booted in CI ✅ `3fd7d05`
**As a** the operator of golden-frijoles, **I want** a standalone Next build in a multi-stage Docker image that CI
builds and smoke-tests, **so that** the same image runs on the Oracle VM, Cloud Run or anywhere else.
**Acceptance:**
- `apps/web/next.config.*`: `output: 'standalone'` and `outputFileTracingRoot` at the repo root (monorepo). `npm run
  build` still green; the Vercel build is not broken by it.
- `Dockerfile` (repo root) multi-stage on Node 24 slim: `npm ci` → build → runtime stage with `.next/standalone`,
  `.next/static`, `public/`; non-root user; `HEALTHCHECK` on the resilience probe or `/`; builds for `linux/arm64`
  and `linux/amd64`. `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are `ARG`s (build-time), every
  other var is runtime env. `.dockerignore` keeps `.env*`, `node_modules`, `.git`, `Roadmap/`, `.claude/` out.
- A CI job (path-filtered to `apps/web`, `packages/`, `Dockerfile`) builds the image (no push) and boots it with
  the CI gate env, then runs the Playwright `api` smoke subset against the container on `127.0.0.1`.
- No secret is baked into any layer (`docker history` / a grep of the image for the CI secrets' values is empty).
**Risk:** high (shared infra)

## Owed
- Owed to Daniel: re-decide the two console-gate deferrals (button height, project switcher), which this sprint extended
  provisionally from 2026-10-30 to 2026-11-16 because they turned every PR red (`apps/web/design-system/console-gate-spec.ts`).

## Sprint QA
- **api spec(s):** S1.1 → a unit spec on `deploy-env.ts` + the guard test; S1.2 → the container smoke job in CI.
- **browser smoke owed:** no (no user-facing change).
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge (the local CI recipe).

## Sprint 1 — Smoke walkthrough (do these in order)
Env: local (Vercel is paused; nothing deploys from this sprint)

1. Run `docker build -t gf:local --build-arg NEXT_PUBLIC_SUPABASE_URL=… --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=… .`
   → the build finishes; `docker image ls gf:local` shows one image.
2. Run it with the local `.env.local` and `DEPLOY_ENV=development`, then open http://localhost:3000
   → the landing page renders.
3. Open the PR's CI run
   → the "container smoke" job is green.

If any step fails, note the step number + what you saw — that's the bug report.
