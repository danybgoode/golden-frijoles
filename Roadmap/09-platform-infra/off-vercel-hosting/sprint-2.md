---
epic: off-vercel-hosting
sprint: 2
title: "The box and the pipeline"
risk: high
phase: Shipped
stories_total: 2
stories:
  - id: S2.1
    title: "The VM, inventoried and ready"
    as_a: "the operator of golden-frijoles"
    i_want: "the shared Oracle VM to run a golden-frijoles container behind its shared proxy, reachable only through Cloudflare"
    so_that: "production has a home that no free-tier meter can pause"
    risk: high
    status: done
  - id: S2.2
    title: "Deploy on merge to main"
    as_a: "the operator of golden-frijoles"
    i_want: "every merge to main to build, ship and health-check the image on the VM, and roll back on failure"
    so_that: "merging to main stays the deploy, with the live SHA on record"
    risk: high
    status: done
---
# Off Vercel: production on our own box — Sprint 2: The box and the pipeline

**Status:** ✅ shipped — PR #446, merge `f8595a8` (2026-11-02). The VM timer deployed it (`✓ deployed golden-frijoles f8595a8`); the dispatched Deploy run closed the Production Deployment as success after S3.
— Sprint 2"): the shared proxy instead of a tunnel, the VM pulls instead of a push over SSH.

## Stories

### Story 2.1 — The VM, inventoried and ready ✅ `689035a`
**As a** the operator of golden-frijoles, **I want** the shared Oracle VM to run a golden-frijoles container behind its
shared proxy, reachable only through Cloudflare, **so that** production has a home that no free-tier meter can pause.
**Acceptance:**
- **Inventory before install** (2026-11-02, read-only): arm64, 2 OCPU, 12 GB — 3.3 GB used / 8.6 GB available, load 0.3,
  disk 28 %. Three tenants already on the box behind one shared proxy, which imports one site file per tenant. Nothing
  existing was stopped or reconfigured; one site file was added.
- `deploy/oci/docker-compose.yml`: one `web` service, 0.75 CPU / 768 MB, on the shared `edge` network as
  `golden-frijoles-web`, no published port. ✅ running (bootstrap image): healthy, 72 MB, user `node`.
- `deploy/oci/golden-frijoles.caddy`: names its two hosts, a Cloudflare Origin CA cert issued from a CSR generated on the
  VM (key never left it; valid to 2041), **Authenticated Origin Pulls** (a TLS client must present Cloudflare's
  origin-pull cert), `X-Forwarded-For`/`X-Real-IP` := `CF-Connecting-IP` (D12). ✅ validated + reloaded; a direct
  connection without Cloudflare's cert is refused at the handshake; the neighbours answer 200 after each reload.
- `deploy/oci/web.env` (0600, `ubuntu`): every readable value + `DEPLOY_ENV=production` + `SITE_URL`; the 11
  Sensitive values are blank until Daniel fills them (owed below). `deploy/oci/*.env` is gitignored.
- `update.sh` + a 2-minute systemd timer (installed after merge: before it, the timer would reset to a `main` without
  `deploy/oci`).
**Risk:** high (production infra)

### Story 2.2 — Deploy on merge to main ✅ `0cad4ff`
**As a** the operator of golden-frijoles, **I want** every merge to `main` to build, ship and health-check the image on
the VM, and roll back on failure, **so that** merging to `main` stays the deploy, with the live SHA on record.
**Acceptance:**
- `.github/workflows/deploy.yml` (main only): build `linux/arm64` natively, **boot it under the production cap** and see
  its own `x-gf-revision`, push `:<sha>`, and push `:main` only if the run is still `main`'s head.
- The VM pulls: `update.sh --if-changed` resolves `:main` to a digest (a failed pull fails), starts it, health-checks
  from inside the container, installs + validates the site file, rolls back to the previous digest and records the
  failed one so the timer does not retry it.
- The workflow opens a GitHub Deployment (`Production`), waits ≤ 15 min for the live `x-gf-revision`, closes it and
  posts the 🚀 itself. **Until DNS moves (S3) the wait cannot see the VM: the first Deploy runs are expected red.**
**Risk:** high (deploy pipeline)

## Owed
- Owed to Daniel: fill the 11 Sensitive values in the VM's `deploy/oci/web.env` (and keep a copy in the password manager).
- Owed to Daniel: make the GHCR package `golden-frijoles` public after its first push.

## Sprint QA
- **api spec(s):** none new (infra). CI's container-smoke covers the Dockerfile on amd64; the arm64 boot is in deploy.yml.
- **browser smoke owed:** no (DNS unchanged).
- **deterministic gate:** CI green. `actionlint`/`shellcheck` are not installed here; `bash -n update.sh` passes.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: the VM, before DNS moves

1. Merge #446, make the GHCR package public, install the timer (`deploy/oci/README.md` → First install, last two
   lines), then on the VM run `journalctl -u golden-frijoles-deploy -n 20`
   → a line `✓ deployed golden-frijoles <sha>` for the merge.
2. On the VM, `docker inspect golden-frijoles-web-1 --format '{{index .Config.Labels "org.opencontainers.image.revision"}}'`
   → the merge SHA.
3. Open the merge's "Deploy" run
   → `image` green (arm64 boot probe passed); `rollout` red until S3 (it waits on the public domain).

If any step fails, note the step number + what you saw — that's the bug report.
